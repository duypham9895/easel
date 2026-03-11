/**
 * Supabase Edge Function: notify-cycle
 *
 * Sends period approach / start / end push notifications to Moon and Sun.
 * Intended to be called once daily via pg_cron or a scheduled webhook.
 *
 * pg_cron setup (run once in Supabase SQL editor after enabling pg_cron extension):
 *   SELECT cron.schedule(
 *     'notify-cycle-daily',
 *     '0 8 * * *',
 *     $$SELECT net.http_post(
 *       url := 'https://[project-ref].supabase.co/functions/v1/notify-cycle',
 *       headers := '{"Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb,
 *       body := '{}'::jsonb
 *     ) AS request_id;$$
 *   );
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { sendWebPushNotification } from '../_shared/webpush.ts';

interface PushMessage {
  to: string;
  sound: 'default';
  title: string;
  body: string;
  data: Record<string, string>;
  channelId: string;
}

type Lang = 'en' | 'vi';

const CYCLE_COPY: Record<Lang, {
  approaching: { moonTitle: string; moonBody: (d: number) => string; sunTitle: string; sunBody: (d: number) => string };
  started: { moonTitle: string; moonBody: string; sunTitle: string; sunBody: string };
  ended: { moonTitle: string; moonBody: string; sunTitle: string; sunBody: string };
}> = {
  en: {
    approaching: {
      moonTitle: 'Your period is coming',
      moonBody: (d) => `Your period may start in ${d} day${d === 1 ? '' : 's'}. Take care of yourself.`,
      sunTitle: "Moon's period is approaching",
      sunBody: (d) => `Moon's period may start in ${d} day${d === 1 ? '' : 's'} — be extra gentle today.`,
    },
    started: {
      moonTitle: 'Your period may have started',
      moonBody: 'Day 1 of your cycle. Be kind to yourself today.',
      sunTitle: "Moon's period may have started",
      sunBody: "It's day 1 of Moon's cycle. Show extra love today.",
    },
    ended: {
      moonTitle: 'Your period is ending',
      moonBody: "Your cycle is wrapping up. Energy is returning — you've got this.",
      sunTitle: "Moon's period is ending",
      sunBody: "Moon's cycle is finishing up. She'll be feeling more like herself soon.",
    },
  },
  vi: {
    approaching: {
      moonTitle: 'Kỳ kinh sắp đến',
      moonBody: (d) => `Kỳ kinh có thể bắt đầu trong ${d} ngày nữa. Hãy chăm sóc bản thân nhé.`,
      sunTitle: 'Kỳ kinh của Moon sắp đến',
      sunBody: (d) => `Kỳ kinh của Moon có thể bắt đầu trong ${d} ngày nữa — hãy nhẹ nhàng hơn hôm nay.`,
    },
    started: {
      moonTitle: 'Kỳ kinh có thể đã bắt đầu',
      moonBody: 'Ngày 1 của chu kỳ. Hãy dịu dàng với bản thân hôm nay.',
      sunTitle: 'Kỳ kinh của Moon có thể đã bắt đầu',
      sunBody: 'Ngày 1 trong chu kỳ của Moon. Hãy yêu thương cô ấy nhiều hơn hôm nay.',
    },
    ended: {
      moonTitle: 'Kỳ kinh sắp kết thúc',
      moonBody: 'Chu kỳ sắp hoàn tất. Năng lượng đang trở lại — bạn làm được mà.',
      sunTitle: 'Kỳ kinh của Moon sắp kết thúc',
      sunBody: 'Chu kỳ của Moon sắp xong. Cô ấy sẽ sớm cảm thấy như bình thường.',
    },
  },
};

function addDays(dateStr: string, days: number): Date {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function todayUTC(): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}

function daysDiff(future: Date, reference: Date): number {
  return Math.round((future.getTime() - reference.getTime()) / 86_400_000);
}

async function sendPush(messages: PushMessage[]): Promise<void> {
  if (messages.length === 0) return;
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(messages),
  });
  if (!res.ok) throw new Error(`Expo Push error ${res.status}: ${await res.text()}`);
}

Deno.serve(async (_req: Request) => {
  // Auth is handled by Supabase API gateway (JWT verification enabled by default).
  // Only valid JWTs (service_role or anon key) can reach this function.

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const today = todayUTC();

    const { data: moonUsers, error: moonErr } = await supabase
      .from('profiles')
      .select(`
        id,
        cycle_settings (
          last_period_start_date,
          avg_cycle_length,
          avg_period_length
        ),
        notification_preferences (
          period_approaching,
          period_started,
          period_ended,
          use_ai_timing,
          manual_days_before
        )
      `)
      .in('role', ['moon', 'girlfriend']);

    if (moonErr) throw moonErr;
    if (!moonUsers || moonUsers.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // --- Batch queries to avoid N+1 ---
    const moonIds = moonUsers.map((m) => m.id);

    // Batch 1: Get all couple records for Moon users
    const { data: couplesData } = await supabase
      .from('couples')
      .select('girlfriend_id, boyfriend_id')
      .eq('status', 'linked')
      .in('girlfriend_id', moonIds);

    const partnerByMoon = new Map<string, string>();
    for (const c of couplesData ?? []) {
      partnerByMoon.set(c.girlfriend_id, c.boyfriend_id);
    }

    // Batch 2: Get ALL push tokens for Moon users AND their partners
    const partnerIds = Array.from(partnerByMoon.values());
    const allUserIds = [...new Set([...moonIds, ...partnerIds])];
    const { data: allTokensData } = await supabase
      .from('push_tokens')
      .select('user_id, token, platform')
      .in('user_id', allUserIds);

    type TokenEntry = { token: string; platform: string };
    const tokensByUser = new Map<string, TokenEntry[]>();
    for (const { user_id, token, platform } of allTokensData ?? []) {
      if (!tokensByUser.has(user_id)) tokensByUser.set(user_id, []);
      tokensByUser.get(user_id)!.push({ token, platform: platform ?? 'ios' });
    }

    // Batch 3: Get language preferences for all users
    const { data: prefsData } = await supabase
      .from('user_preferences')
      .select('user_id, language')
      .in('user_id', allUserIds);

    const langByUser = new Map<string, Lang>();
    for (const { user_id, language } of prefsData ?? []) {
      langByUser.set(user_id, (language === 'vi' ? 'vi' : 'en') as Lang);
    }

    // --- Build notification messages using lookup maps ---
    const allMessages: PushMessage[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const webMessages: { subscription: any; payload: { title: string; body: string; data: Record<string, string> } }[] = [];

    for (const moon of moonUsers) {
      const cs = Array.isArray(moon.cycle_settings)
        ? moon.cycle_settings[0]
        : moon.cycle_settings;
      const np = Array.isArray(moon.notification_preferences)
        ? moon.notification_preferences[0]
        : moon.notification_preferences;

      if (!cs?.last_period_start_date) continue;

      const predictedPeriod = addDays(cs.last_period_start_date, cs.avg_cycle_length);
      const daysUntil = daysDiff(predictedPeriod, today);
      const avgPeriodLen: number = cs.avg_period_length ?? 5;

      const notifyDaysBefore = np?.use_ai_timing !== false ? 3 : (np?.manual_days_before ?? 3);
      const doApproaching = np?.period_approaching !== false;
      const doStarted = np?.period_started !== false;
      const doEnded = np?.period_ended !== false;

      let eventType: 'approaching' | 'started' | 'ended' | null = null;

      if (doApproaching && daysUntil === notifyDaysBefore) {
        eventType = 'approaching';
      } else if (doStarted && daysUntil === 0) {
        eventType = 'started';
      } else if (doEnded && daysUntil === -avgPeriodLen) {
        eventType = 'ended';
      }

      if (!eventType) continue;

      // Use batch lookup instead of per-user query
      const moonLang = langByUser.get(moon.id) ?? 'en';
      const moonCopy = CYCLE_COPY[moonLang][eventType];
      const moonTitle = moonCopy.moonTitle;
      const moonBody = eventType === 'approaching'
        ? (moonCopy as typeof CYCLE_COPY['en']['approaching']).moonBody(daysUntil)
        : (moonCopy as typeof CYCLE_COPY['en']['started']).moonBody;

      const moonTokens = tokensByUser.get(moon.id) ?? [];
      for (const entry of moonTokens) {
        if (entry.platform === 'web') {
          webMessages.push({
            subscription: JSON.parse(entry.token),
            payload: { title: moonTitle, body: moonBody as string, data: { type: 'cycle', userId: moon.id } },
          });
        } else {
          allMessages.push({
            to: entry.token, sound: 'default',
            title: moonTitle, body: moonBody as string,
            data: { type: 'cycle', userId: moon.id },
            channelId: 'cycle',
          });
        }
      }

      // Use batch lookup instead of per-user query
      const partnerId = partnerByMoon.get(moon.id);
      if (partnerId) {
        const sunLang = langByUser.get(partnerId) ?? 'en';
        const sunCopy = CYCLE_COPY[sunLang][eventType];
        const sunTitle = sunCopy.sunTitle;
        const sunBody = eventType === 'approaching'
          ? (sunCopy as typeof CYCLE_COPY['en']['approaching']).sunBody(daysUntil)
          : (sunCopy as typeof CYCLE_COPY['en']['started']).sunBody;

        const sunTokens = tokensByUser.get(partnerId) ?? [];
        for (const entry of sunTokens) {
          if (entry.platform === 'web') {
            webMessages.push({
              subscription: JSON.parse(entry.token),
              payload: { title: sunTitle, body: sunBody as string, data: { type: 'cycle_partner', moonId: moon.id } },
            });
          } else {
            allMessages.push({
              to: entry.token, sound: 'default',
              title: sunTitle, body: sunBody as string,
              data: { type: 'cycle_partner', moonId: moon.id },
              channelId: 'cycle',
            });
          }
        }
      }
    }

    // Send native push via Expo
    await sendPush(allMessages);

    // Send web push via Web Push API
    let webSent = 0;
    if (webMessages.length > 0) {
      const vapid = {
        publicKey: Deno.env.get('VAPID_PUBLIC_KEY')!,
        privateKey: Deno.env.get('VAPID_PRIVATE_KEY')!,
      };
      const results = await Promise.allSettled(
        webMessages.map((m) => sendWebPushNotification(m.subscription, m.payload, vapid)),
      );
      webSent = results.filter((r) => r.status === 'fulfilled' && r.value).length;
    }

    const totalSent = allMessages.length + webSent;
    console.log(`notify-cycle: sent ${totalSent} messages (${allMessages.length} native, ${webSent} web) to ${moonUsers.length} Moon users`);

    return new Response(
      JSON.stringify({ success: true, sent: totalSent }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('notify-cycle error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
