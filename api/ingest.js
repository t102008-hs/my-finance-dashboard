// 給 iPhone 捷徑用的「只能新增記帳」入口；密鑰：INGEST_KEY（捷徑裡只放這個，不放網頁登入密碼）
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  if (req.headers['x-ingest-key'] !== process.env.INGEST_KEY) return res.status(401).json({ status: 'error', message: 'unauthorized' });
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const r = await fetch(process.env.APPS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'ingest', token: process.env.API_TOKEN, source: b.source, title: b.title, body: b.body, time: b.time, merchant: b.merchant }) });
    res.status(200).json(await r.json());
  } catch (e) { res.status(502).json({ status: 'error', message: String(e) }); }
};
