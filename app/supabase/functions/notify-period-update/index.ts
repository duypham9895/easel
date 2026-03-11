/**
 * Supabase Edge Function: notify-period-update
 *
 * Triggered by a Database Webhook on INSERT into public.period_logs.
 * Detects significant cycle deviation and sends a gentle push notification to Sun.
 *
 * This runs on Deno (not Node.js) — use jsr: imports for Supabase.
 *
 * Setup in Supabase Dashboard:
 *   Database -> Webhooks -> Create a new webhook
 *     Table: period_logs
 *     Events: INSERT
 *     Type: Supabase Edge Functions
 *     Function: notify-period-update
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { sendWebPushNotification } from '../_shared/webpush.ts';

interface WebhookPayload {
  type: 'INSERT';
  table: string;
  schema: string;
  record: {
    id: string;
    user_id: string;
    start_date: string;
    end_date: string | null;
    notes: string | null;
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

type Lang = 'en' | 'vi';

const DAY_MS = 86_400_000;
const SIGNIFICANT_THRESHOLD = 3; // |days| > 3 is considered significant

const COPY: Record<Lang, { title: string; body: string }> = {
  en: {
    title: 'Cycle Update',
    body: "Moon's period timing has shifted. A little extra care goes a long way \uD83D\uDC9B",
  },
  vi: {
    title: 'Cập nhật chu kỳ',
    body: 'Thời gian kỳ kinh của Moon đã thay đổi. Một chút quan tâm thêm sẽ rất ý nghĩa \uD83D\uDC9B',
  },
};

Deno.serve(async (req: Request) => {
  // Auth is handled by Supabase API gateway (JWT verification enabled by default).
  // Database Webhooks use the service_role key automatically.

  try {
    const payload: WebhookPayload = await req.json();
    const record = payload.record;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 1. Get Moon's cycle settings to compute predicted date
    const { data: cycleData, error: cycleErr } = await supabase
      .from('cycle_settings')
      .select('avg_cycle_length, last_period_start_date')
      .eq('user_id', record.user_id)
      .single();

    if (cycleErr || !cycleData) {
      console.log('No cycle settings for user — skipping deviation check.');
      return new Response('OK', { status: 200 });
    }

    // 2. Compute deviation
    const lastStart = new Date(cycleData.last_period_start_date + 'T00:00:00Z');
    const predicted = new Date(lastStart.getTime());
    predicted.setUTCDate(predicted.getUTCDate() + cycleData.avg_cycle_length);

    const actual = new Date(record.start_date + 'T00:00:00Z');
    const daysDifference = Math.round((actual.getTime() - predicted.getTime()) / DAY_MS);
    const isSignificant = Math.abs(daysDifference) > SIGNIFICANT_THRESHOLD;

    if (!isSignificant) {
      console.log(`notify-period-update: deviation of ${daysDifference} days is not significant — skipping.`);
      return new Response(
        JSON.stringify({ success: true, significant: false, daysDifference }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // 3. Find the boyfriend (Sun) via couples table
    const { data: couple, error: coupleErr } = await supabase
      .from('couples')
      .select('boyfriend_id')
      .eq('girlfriend_id', record.user_id)
      .eq('status', 'linked')
      .single();

    if (coupleErr || !couple?.boyfriend_id) {
      console.log('No linked partner — skipping push.');
      return new Response('OK', { status: 200 });
    }

    // 4. Fetch all push tokens for Sun
    const { data: tokens, error: tokenErr } = await supabase
      .from('push_tokens')
      .select('token, platform')
      .eq('user_id', couple.boyfriend_id);

    if (tokenErr || !tokens || tokens.length === 0) {
      console.log('No push tokens for partner — skipping push.');
      return new Response('OK', { status: 200 });
    }

    // 5. Get Sun's language preference
    const { data: prefData } = await supabase
      .from('user_preferences')
      .select('language')
      .eq('user_id', couple.boyfriend_id)
      .maybeSingle();

    const lang: Lang = prefData?.language === 'vi' ? 'vi' : 'en';
    const copy = COPY[lang];

    // 6. Split tokens into native (Expo) and web push
    const nativeTokens = tokens.filter((t) => t.platform !== 'web');
    const webTokens = tokens.filter((t) => t.platform === 'web');

    let sentCount = 0;

    // Send to native devices via Expo Push API
    if (nativeTokens.length > 0) {
      const messages: ExpoPushMessage[] = nativeTokens.map(({ token }) => ({
        to: token,
        sound: 'default',
        title: copy.title,
        body: copy.body,
        data: { type: 'period_update', moonId: record.user_id, daysDifference: String(daysDifference) },
        channelId: 'cycle',
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
      await expoRes.json();
      sentCount += messages.length;
    }

    // Send to web devices via Web Push API
    if (webTokens.length > 0) {
      const vapid = {
        publicKey: Deno.env.get('VAPID_PUBLIC_KEY')!,
        privateKey: Deno.env.get('VAPID_PRIVATE_KEY')!,
      };
      const webPayload = {
        title: copy.title,
        body: copy.body,
        data: { type: 'period_update', moonId: record.user_id, daysDifference: String(daysDifference) },
      };

      const results = await Promise.allSettled(
        webTokens.map(({ token }) => {
          const subscription = JSON.parse(token);
          return sendWebPushNotification(subscription, webPayload, vapid);
        }),
      );
      sentCount += results.filter((r) => r.status === 'fulfilled' && r.value).length;
    }

    console.log(`notify-period-update: deviation ${daysDifference} days, sent ${sentCount} push messages (${nativeTokens.length} native, ${webTokens.length} web)`);

    return new Response(
      JSON.stringify({ success: true, significant: true, daysDifference, sent: sentCount }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('notify-period-update error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
