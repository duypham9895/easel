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

interface PushMessage {
  to: string;
  sound: 'default';
  title: string;
  body: string;
  data: Record<string, string>;
  channelId: string;
}

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

Deno.serve(async (req: Request) => {
  // Validate authorization — only pg_cron or admin should call this
  const authHeader = req.headers.get('Authorization');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!authHeader || !serviceKey || authHeader !== `Bearer ${serviceKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

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

    const allMessages: PushMessage[] = [];

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

      let moonTitle = '';
      let moonBody = '';
      let sunTitle = '';
      let sunBody = '';

      if (doApproaching && daysUntil === notifyDaysBefore) {
        const d = daysUntil;
        moonTitle = 'Your period is coming';
        moonBody = `Your period may start in ${d} day${d === 1 ? '' : 's'}. Take care of yourself.`;
        sunTitle = "Moon's period is approaching";
        sunBody = `Moon's period may start in ${d} day${d === 1 ? '' : 's'} — be extra gentle today.`;
      } else if (doStarted && daysUntil === 0) {
        moonTitle = 'Your period may have started';
        moonBody = 'Day 1 of your cycle. Be kind to yourself today.';
        sunTitle = "Moon's period may have started";
        sunBody = "It's day 1 of Moon's cycle. Show extra love today.";
      } else if (doEnded && daysUntil === -avgPeriodLen) {
        moonTitle = 'Your period is ending';
        moonBody = "Your cycle is wrapping up. Energy is returning — you've got this.";
        sunTitle = "Moon's period is ending";
        sunBody = "Moon's cycle is finishing up. She'll be feeling more like herself soon.";
      }

      if (!moonTitle) continue;

      const { data: moonTokens } = await supabase
        .from('push_tokens').select('token').eq('user_id', moon.id);

      for (const { token } of moonTokens ?? []) {
        allMessages.push({
          to: token, sound: 'default',
          title: moonTitle, body: moonBody,
          data: { type: 'cycle', userId: moon.id },
          channelId: 'cycle',
        });
      }

      const { data: couple } = await supabase
        .from('couples')
        .select('boyfriend_id')
        .eq('girlfriend_id', moon.id)
        .eq('status', 'linked')
        .maybeSingle();

      if (couple?.boyfriend_id) {
        const { data: sunTokens } = await supabase
          .from('push_tokens').select('token').eq('user_id', couple.boyfriend_id);

        for (const { token } of sunTokens ?? []) {
          allMessages.push({
            to: token, sound: 'default',
            title: sunTitle, body: sunBody,
            data: { type: 'cycle_partner', moonId: moon.id },
            channelId: 'cycle',
          });
        }
      }
    }

    await sendPush(allMessages);
    console.log(`notify-cycle: sent ${allMessages.length} messages to ${moonUsers.length} Moon users`);

    return new Response(
      JSON.stringify({ success: true, sent: allMessages.length }),
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
