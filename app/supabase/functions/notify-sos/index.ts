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
import { sendWebPushNotification } from '../_shared/webpush.ts';

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

type Lang = 'en' | 'vi';
type CopyEntry = { title: string; body: string };

const SOS_COPY: Record<Lang, Record<string, CopyEntry>> = {
  en: {
    sweet_tooth:  { title: 'Moon needs you', body: "She's craving something sweet — bring her a little treat." },
    need_a_hug:   { title: 'Moon needs you', body: 'She needs a hug right now. Just hold her close.' },
    cramps_alert: { title: 'Moon needs you', body: 'Cramps alert — a hot water bottle and your presence means everything.' },
    quiet_time:   { title: 'Moon needs you', body: 'She needs some quiet time. Check in gently, softly.' },
  },
  vi: {
    sweet_tooth:  { title: 'Moon cần bạn', body: 'Cô ấy đang thèm đồ ngọt — mang cho cô ấy một món nhỏ nhé.' },
    need_a_hug:   { title: 'Moon cần bạn', body: 'Cô ấy cần một cái ôm ngay bây giờ. Hãy ôm cô ấy thật chặt.' },
    cramps_alert: { title: 'Moon cần bạn', body: 'Cô ấy bị đau bụng — túi nước nóng và sự hiện diện của bạn là tất cả.' },
    quiet_time:   { title: 'Moon cần bạn', body: 'Cô ấy cần không gian yên tĩnh. Hãy nhẹ nhàng hỏi thăm.' },
  },
};

const WHISPER_COPY: Record<Lang, Record<string, CopyEntry>> = {
  en: {
    // Menstrual
    hug:        { title: 'Moon needs you', body: 'She needs a hug right now — just hold her close.' },
    warmth:     { title: 'Moon needs you', body: 'She wants something warm. Bring a blanket or a hot drink.' },
    chocolate:  { title: 'Moon needs you', body: "Sweet tooth alert — she's craving something sweet." },
    quiet:      { title: 'Moon needs you', body: 'She needs peace and quiet. Tread softly.' },
    // Follicular
    plan:       { title: 'Moon is ready', body: "She's up for an adventure — surprise her with something fun." },
    cook:       { title: 'Moon wants you', body: "She'd love to cook together tonight." },
    walk:       { title: 'Moon wants you', body: "She's in the mood for a walk. Let's go outside." },
    movie:      { title: 'Moon wants you', body: "Movie night — she wants to watch something together." },
    // Ovulatory
    date:       { title: 'Moon is glowing', body: "Take her somewhere nice — she's ready for a date." },
    compliment: { title: 'Moon needs to hear it', body: "Say something kind. She needs to hear it from you." },
    dance:      { title: 'Moon wants to dance', body: "Put on a song and dance with her." },
    kiss:       { title: 'Moon wants a kiss', body: "She just wants a kiss." },
    // Luteal
    snacks:     { title: 'Moon has a craving', body: "Bring her favourite snacks — she'll love you for it." },
    space:      { title: 'Moon needs space', body: "Give her a little room today. Check in gently." },
    cuddle:     { title: 'Moon needs you', body: "Come cuddle. That's all she needs." },
    kind:       { title: 'Moon needs kind words', body: "Say something kind. Small words, big impact." },
  },
  vi: {
    // Menstrual
    hug:        { title: 'Moon cần bạn', body: 'Cô ấy cần một cái ôm — hãy ôm cô ấy thật chặt.' },
    warmth:     { title: 'Moon cần bạn', body: 'Cô ấy muốn một thứ gì đó ấm. Mang chăn hoặc đồ uống nóng nhé.' },
    chocolate:  { title: 'Moon cần bạn', body: 'Cô ấy đang thèm đồ ngọt — mang cho cô ấy một món nhỏ nhé.' },
    quiet:      { title: 'Moon cần bạn', body: 'Cô ấy cần yên tĩnh. Hãy nhẹ nhàng.' },
    // Follicular
    plan:       { title: 'Moon đã sẵn sàng', body: 'Cô ấy muốn phiêu lưu — hãy tạo bất ngờ cho cô ấy.' },
    cook:       { title: 'Moon muốn bạn', body: 'Cô ấy muốn cùng nấu ăn tối nay.' },
    walk:       { title: 'Moon muốn bạn', body: 'Cô ấy muốn đi dạo. Hãy ra ngoài cùng nhau.' },
    movie:      { title: 'Moon muốn bạn', body: 'Tối phim — cô ấy muốn xem phim cùng bạn.' },
    // Ovulatory
    date:       { title: 'Moon đang toả sáng', body: 'Đưa cô ấy đi đâu đó đẹp — cô ấy sẵn sàng cho một buổi hẹn.' },
    compliment: { title: 'Moon cần nghe điều đó', body: 'Hãy nói điều gì đó tốt đẹp. Cô ấy cần nghe từ bạn.' },
    dance:      { title: 'Moon muốn nhảy', body: 'Mở một bài hát và nhảy cùng cô ấy.' },
    kiss:       { title: 'Moon muốn một nụ hôn', body: 'Cô ấy chỉ muốn một nụ hôn.' },
    // Luteal
    snacks:     { title: 'Moon đang thèm ăn', body: 'Mang đồ ăn vặt yêu thích của cô ấy — cô ấy sẽ rất vui.' },
    space:      { title: 'Moon cần không gian', body: 'Hãy cho cô ấy một chút không gian. Hỏi thăm nhẹ nhàng.' },
    cuddle:     { title: 'Moon cần bạn', body: 'Hãy ôm cô ấy. Chỉ cần vậy thôi.' },
    kind:       { title: 'Moon cần lời dịu dàng', body: 'Hãy nói điều gì đó tử tế. Lời nhỏ, tác động lớn.' },
  },
};

Deno.serve(async (req: Request) => {
  // Auth is handled by Supabase API gateway (JWT verification enabled by default).
  // Database Webhooks use the service_role key automatically.

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
      .select('token, platform')
      .eq('user_id', couple.boyfriend_id);

    if (tokenError || !tokens || tokens.length === 0) {
      console.log('No push tokens for partner — skipping push.');
      return new Response('OK', { status: 200 });
    }

    // 2b. Fetch partner's language preference
    const { data: prefData } = await supabase
      .from('user_preferences')
      .select('language')
      .eq('user_id', couple.boyfriend_id)
      .maybeSingle();

    const lang: Lang = prefData?.language === 'vi' ? 'vi' : 'en';

    // 3. Build and send Expo push messages
    const copy =
      SOS_COPY[lang]?.[signal.type] ??
      WHISPER_COPY[lang]?.[signal.type] ?? {
        title: lang === 'vi' ? 'Moon đã thì thầm với bạn' : 'Moon whispered to you',
        body: signal.message ?? (lang === 'vi' ? 'Cô ấy gửi cho bạn một lời thì thầm.' : 'She sent you a whisper.'),
      };

    // Split tokens into native (Expo) and web push
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
        data: { type: signal.type, coupleId: signal.couple_id },
        channelId: 'whisper',
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
      const payload = {
        title: copy.title,
        body: copy.body,
        data: { type: signal.type, coupleId: signal.couple_id },
      };

      const results = await Promise.allSettled(
        webTokens.map(({ token }) => {
          const subscription = JSON.parse(token);
          return sendWebPushNotification(subscription, payload, vapid);
        }),
      );
      sentCount += results.filter((r) => r.status === 'fulfilled' && r.value).length;
    }

    console.log(`notify-sos: sent ${sentCount} push messages (${nativeTokens.length} native, ${webTokens.length} web)`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('notify-sos error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
