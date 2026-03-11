/**
 * Shared Web Push utility for Supabase Edge Functions.
 *
 * Implements the Web Push protocol (RFC 8030 + RFC 8291) using
 * Deno's built-in crypto APIs — no npm dependencies needed.
 *
 * Usage:
 *   await sendWebPushNotification(subscription, { title, body, data }, vapidKeys);
 */

interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface WebPushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface VapidKeys {
  publicKey: string;
  privateKey: string;
}

/**
 * Send a Web Push notification to a single subscription.
 * Returns true on success, false if the subscription is expired/invalid.
 */
export async function sendWebPushNotification(
  subscription: WebPushSubscription,
  payload: WebPushPayload,
  vapid: VapidKeys,
): Promise<boolean> {
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));

  // Encrypt the payload using the subscription keys
  const encrypted = await encryptPayload(
    payloadBytes,
    subscription.keys.p256dh,
    subscription.keys.auth,
  );

  // Create VAPID authorization header
  const endpoint = new URL(subscription.endpoint);
  const vapidHeaders = await createVapidHeaders(
    endpoint.origin,
    vapid.publicKey,
    vapid.privateKey,
  );

  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      TTL: '86400',
      Urgency: 'high',
      ...vapidHeaders,
    },
    body: encrypted,
  });

  if (response.status === 201 || response.status === 200) {
    return true;
  }

  // 404 or 410 = subscription expired, should be removed
  if (response.status === 404 || response.status === 410) {
    console.warn(`[webpush] Subscription expired (${response.status})`);
    return false;
  }

  const body = await response.text();
  console.error(`[webpush] Push failed (${response.status}): ${body}`);
  return false;
}

// ── VAPID JWT ─────────────────────────────────────────────────────────────────

async function createVapidHeaders(
  audience: string,
  publicKey: string,
  privateKey: string,
): Promise<Record<string, string>> {
  const now = Math.floor(Date.now() / 1000);
  const header = { typ: 'JWT', alg: 'ES256' };
  const claims = {
    aud: audience,
    exp: now + 12 * 3600,
    sub: 'mailto:noreply@easel.app',
  };

  const headerB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const claimsB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(claims)));
  const unsignedToken = `${headerB64}.${claimsB64}`;

  const key = await importVapidPrivateKey(publicKey, privateKey);
  const signatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(unsignedToken),
  );

  // Convert DER signature to raw r||s format
  const rawSig = derToRaw(new Uint8Array(signatureBuffer));
  const signatureB64 = base64urlEncode(rawSig);
  const jwt = `${unsignedToken}.${signatureB64}`;

  return {
    Authorization: `vapid t=${jwt}, k=${publicKey}`,
  };
}

async function importVapidPrivateKey(
  publicKeyB64: string,
  privateKeyB64: string,
): Promise<CryptoKey> {
  const publicKeyBytes = base64urlDecode(publicKeyB64);
  const privateKeyBytes = base64urlDecode(privateKeyB64);

  // Build JWK from raw keys
  const jwk: JsonWebKey = {
    kty: 'EC',
    crv: 'P-256',
    x: base64urlEncode(publicKeyBytes.slice(1, 33)),
    y: base64urlEncode(publicKeyBytes.slice(33, 65)),
    d: base64urlEncode(privateKeyBytes),
  };

  return crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, [
    'sign',
  ]);
}

// ── Payload Encryption (RFC 8291) ─────────────────────────────────────────────

async function encryptPayload(
  payload: Uint8Array,
  p256dhB64: string,
  authB64: string,
): Promise<Uint8Array> {
  const clientPublicKey = base64urlDecode(p256dhB64);
  const authSecret = base64urlDecode(authB64);

  // Generate ephemeral ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits'],
  );

  const localPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey('raw', localKeyPair.publicKey),
  );

  // Import client's public key
  const clientKey = await crypto.subtle.importKey(
    'raw',
    clientPublicKey,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  );

  // Derive shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'ECDH', public: clientKey },
      localKeyPair.privateKey,
      256,
    ),
  );

  // HKDF to derive the content encryption key and nonce
  const ikm = await hkdf(
    authSecret,
    sharedSecret,
    createInfo('WebPush: info\0', clientPublicKey, localPublicKeyRaw),
    32,
  );
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hkdf(salt, ikm, createCEKInfo('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, createCEKInfo('Content-Encoding: nonce\0'), 12);

  // Encrypt with AES-128-GCM
  const key = await crypto.subtle.importKey('raw', prk, { name: 'AES-GCM' }, false, ['encrypt']);

  // Add padding delimiter
  const paddedPayload = new Uint8Array(payload.length + 1);
  paddedPayload.set(payload);
  paddedPayload[payload.length] = 2; // Padding delimiter

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, paddedPayload),
  );

  // Build aes128gcm header: salt(16) + rs(4) + idlen(1) + keyid(65) + ciphertext
  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, payload.length + 1 + 16 + 1); // +16 for tag, +1 for padding

  const result = new Uint8Array(16 + 4 + 1 + localPublicKeyRaw.length + ciphertext.length);
  let offset = 0;
  result.set(salt, offset); offset += 16;
  result.set(recordSize, offset); offset += 4;
  result[offset] = localPublicKeyRaw.length; offset += 1;
  result.set(localPublicKeyRaw, offset); offset += localPublicKeyRaw.length;
  result.set(ciphertext, offset);

  return result;
}

// ── Crypto Helpers ────────────────────────────────────────────────────────────

function createInfo(type: string, clientKey: Uint8Array, serverKey: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const result = new Uint8Array(typeBytes.length + clientKey.length + serverKey.length);
  let offset = 0;
  result.set(typeBytes, offset); offset += typeBytes.length;
  result.set(clientKey, offset); offset += clientKey.length;
  result.set(serverKey, offset);
  return result;
}

function createCEKInfo(type: string): Uint8Array {
  return new TextEncoder().encode(type);
}

async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', ikm, { name: 'HKDF' }, false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}

function derToRaw(der: Uint8Array): Uint8Array {
  // If it's already 64 bytes, it's raw format
  if (der.length === 64) return der;

  // Parse DER sequence
  const raw = new Uint8Array(64);
  let offset = 2; // Skip SEQUENCE tag and length

  // Read r
  const rLen = der[offset + 1];
  offset += 2;
  const rStart = rLen > 32 ? offset + (rLen - 32) : offset;
  const rDest = rLen < 32 ? 32 - rLen : 0;
  raw.set(der.slice(rStart, offset + rLen), rDest);
  offset += rLen;

  // Read s
  const sLen = der[offset + 1];
  offset += 2;
  const sStart = sLen > 32 ? offset + (sLen - 32) : offset;
  const sDest = sLen < 32 ? 64 - sLen : 32;
  raw.set(der.slice(sStart, offset + sLen), sDest);

  return raw;
}

// ── Base64url ─────────────────────────────────────────────────────────────────

function base64urlEncode(data: Uint8Array): string {
  let binary = '';
  for (const byte of data) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str: string): Uint8Array {
  const padding = '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + padding).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
