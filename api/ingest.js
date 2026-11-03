// 給 iPhone 捷徑用的「只能新增記帳」入口。密鑰：INGEST_KEY（捷徑裡只放這個，不放網頁登入密碼）
// 呼叫方式（密鑰放網址 ?key= 或標頭 x-ingest-key 皆可）：
//  診斷：  GET  /api/ingest?key=密鑰&ping=1                 → 逐層檢查 Vercel／Apps Script 是否連通
//  測試：  GET  /api/ingest?key=密鑰&text=刷卡消費 NT$1      → 直接在 Safari 網址列試
//  正式：  POST /api/ingest?key=密鑰[&source=App名稱]，本文 = 通知內文，或「使用模型」輸出的 JSON（檔案或文字皆可）
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const q = req.query || {};
  if (!process.env.INGEST_KEY || (req.headers['x-ingest-key'] || q.key) !== process.env.INGEST_KEY)
    return res.status(401).json({ status: 'error', message: 'unauthorized（密鑰不符，或 Vercel 沒設定 INGEST_KEY）' });
  const call = async (obj) => {
    const r = await fetch(process.env.APPS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({ token: process.env.API_TOKEN }, obj)) });
    return r.json();
  };
  try {
    if (q.ping) {
      const env = { APPS_URL: !!process.env.APPS_URL, API_TOKEN: !!process.env.API_TOKEN, INGEST_KEY: true };
      let apps; try { apps = await call({ action: 'ping' }); } catch (e) { apps = '呼叫 Apps Script 失敗：' + e; }
      return res.status(200).json({ vercel: 'ok', env, appsScript: apps });
    }
    // 1) 取出原始文字
    let raw = '', b = {};
    if (req.method === 'GET') { raw = q.text || q.data || ''; b = { source: q.source, title: q.title }; }
    else {
      let body = req.body;
      if (Buffer.isBuffer(body)) body = body.toString('utf8');
      if (body && typeof body === 'object') { b = body; raw = body.body || body.text || ''; }
      else raw = String(body || '');
    }
    // 2) 若是 JSON（模型輸出，可能夾在 ``` 或說明文字中）就拆開；否則當作通知原文
    let mode = 'text', s = String(raw).replace(/```json|```/g, '').trim();
    const m = s.match(/\{[\s\S]*\}/);
    if (m) { try {
      const d = JSON.parse(m[0]);
      if (d.amount !== undefined || d.merchant !== undefined || d.note !== undefined) {
        const amt = String(d.amount || '').replace(/[^\d.]/g, '');
        const out = !d.type || /expense|支出|消費/i.test(d.type);
        raw = (out ? '刷卡消費 NT$' : '入帳 NT$') + amt;                // 非消費（入帳、退款、轉帳）會進「待確認」
        b.merchant = d.merchant || d.note || ''; if (d.bank) b.source = d.bank; mode = 'model-json';
      } else if (d.body || d.text) { raw = d.body || d.text; b = Object.assign(b, d); mode = 'json'; }
    } catch (e) { /* 不是 JSON，當原文 */ } }
    if (mode === 'text') {                                               // 舊格式：第 1 行「自動」、第 2 行標題、其餘內文
      const L = String(raw).split(/\r?\n/);
      if (L.length >= 3 && L[0].trim() === '自動') { b.title = L[1].trim(); raw = L.slice(2).join(' ').trim(); }
    }
    const j = await call({ action: 'ingest', source: b.source || q.source || '自動', title: b.title || q.title || '', body: raw, time: b.time, merchant: b.merchant });
    j.echo = { mode, received: String(raw).slice(0, 80) };               // 手動執行捷徑時，可以在結果裡看到伺服器實際收到什麼
    return res.status(200).json(j);
  } catch (e) { return res.status(502).json({ status: 'error', message: String(e) }); }
};
