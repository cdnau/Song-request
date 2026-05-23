const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_MAILTO}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  // ตรวจสอบ secret จาก Supabase Webhook
  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { record, type } = req.body;
  if (type !== 'INSERT') return res.status(200).json({ ok: true });

  const db = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: subs } = await db.from('push_subscriptions').select('*');

  const payload = JSON.stringify({
    title: '🎵 คำขอเพลงใหม่!',
    body: `${record.song}\nขอโดย ${record.name || 'ไม่ระบุชื่อ'}`
  });

  for (const sub of subs || []) {
    try {
      await webpush.sendNotification(sub.subscription, payload);
    } catch (e) {
      // ลบ subscription ที่หมดอายุ
      if (e.statusCode === 410) {
        await db.from('push_subscriptions').delete().eq('id', sub.id);
      }
    }
  }

  return res.status(200).json({ ok: true });
};
