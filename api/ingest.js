// 給 iPhone 捷徑用的「只能新增記帳」入口。密鑰：INGEST_KEY（捷徑裡只放這個，不放網頁登入密碼）
// 支援三種呼叫方式：
//  1) GET  ?key=密鑰&text=通知內文[&title=標題][&source=來源]        ← 最簡單，捷徑只需要一個「取得 URL 內容」
//  2) GET  ?key=密鑰&data={"amount":..,"note":..}                    ← 沿用「Cloud 模型」輸出的 JSON
//  3) POST 標頭 x-ingest-key，本文為 JSON 或純文字（第 1 行來源、第 2 行標題、其餘為內文）
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).end();
  const q = req.query || {};
  if ((req.headers['x-ingest-key'] || q.key) !== process.env.INGEST_KEY || !process.env.INGEST_KEY)
    return res.status(401).json({ status: 'error', message: 'unauthorized' });
  try {
    let b = {};
    if (req.method === 'GET') {
      b = { source: q.source || '自動', title: q.title || '', body: q.text || '' };
      if (!b.body && q.data) {                       // Cloud 模型輸出：{"amount":..,"note":..}（可能被包在 ``` 裡）
        const s = String(q.data).replace(/```json|```/g, '').trim();
        try { const d = JSON.parse(s); b.body = '刷卡消費 NT$' + (d.amount || '') + ' ' + (d.note || ''); b.merchant = d.note || ''; }
        catch (e) { b.body = s; }
      }
    } else {
      b = req.body || {};
      if (typeof b === 'string') {
        try { b = JSON.parse(b); } catch (e) {
          const L = b.split(/\r?\n/);
          b = { source: (L[0] || '').trim(), title: (L[1] || '').trim(), body: L.slice(2).join(' ').trim() };
        }
      }
    }
    const r = await fetch(process.env.APPS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'ingest', token: process.env.API_TOKEN, source: b.source, title: b.title, body: b.body, time: b.time, merchant: b.merchant }) });
    res.status(200).json(await r.json());
  } catch (e) { res.status(502).json({ status: 'error', message: String(e) }); }
};
