/**
 * Supabase Edge Function: notify-sos
 *
 * Triggered by a Database Webhook on INSERT into public.sos_signals.
 * Fetches the boyfriend's Expo push token and calls the Expo Push API.
 *
 * This runs on Deno (not Node.js) — use jsr: imports for Supabase.
 *
 * Setup in Supabase Dashboard:
 *   Database → Webhooks → Create a new webhook
 *     Table: sos_signals
 *     Events: INSERT
 *     Type: Supabase Edge Functions
 *     Function: notify-sos
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

interface WebhookPayload {
  type: 'INSERT';
  table: string;
  schema: string;
  record: {
    id: string;
    couple_id: string;
    sender_id: string;
    type: string;
    message: string | null;
    created_at: string;
  };
}

interface ExpoPushMessage {
  to: string;
  sound: 'default';
  title: string;
  body: string;
  data: Record<string, string>;
  channelId: string;
}

const SOS_COPY: Record<string, { title: string; body: string }> = {
  sweet_tooth: {
    title: '💗 She needs you',
    body: "She's craving something sweet. Bring her a little treat!",
  },
  need_a_hug: {
    title: '💗 She needs you',
    body: 'She needs a hug right now. Just be there for her.',
  },
  cramps_alert: {
    title: '💗 She needs you',
    body: 'Cramps alert — a hot water bottle would mean the world to her.',
  },
  quiet_time: {
    title: '💗 She needs you',
    body: 'She needs some quiet time. Check in gently later.',
  },
};

Deno.serve(async (req: Request) => {
  try {
    const payload: WebhookPayload = await req.json();
    const signal = payload.record;

    // Use the service role key so this function can read push_tokens
    // without being restricted by RLS (which uses auth.uid()).
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Find the boyfriend's user ID from the couple
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('boyfriend_id')
      .eq('id', signal.couple_id)
      .single();

    if (coupleError || !couple?.boyfriend_id) {
      console.log('No linked partner — skipping push.');
      return new Response('OK', { status: 200 });
    }

    // 2. Fetch all push tokens for the boyfriend (could be multiple devices)
    const { data: tokens, error: tokenError } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', couple.boyfriend_id);

    if (tokenError || !tokens || tokens.length === 0) {
      console.log('No push tokens for partner — skipping push.');
      return new Response('OK', { status: 200 });
    }

    // 3. Build and send Expo push messages
    const copy = SOS_COPY[signal.type] ?? {
      title: '💗 She needs you',
      body: signal.message ?? 'She sent you a signal.',
    };

    const messages: ExpoPushMessage[] = tokens.map(({ token }) => ({
      to: token,
      sound: 'default',
      title: copy.title,
      body: copy.body,
      data: { type: signal.type, coupleId: signal.couple_id },
      channelId: 'sos',
    }));

    const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages),
    });

    if (!expoRes.ok) {
      const body = await expoRes.text();
      throw new Error(`Expo Push API error ${expoRes.status}: ${body}`);
    }

    const result = await expoRes.json();
    console.log('Push sent:', JSON.stringify(result));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('notify-sos error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
