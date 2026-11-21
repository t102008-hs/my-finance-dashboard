// Vercel Serverless Function：代理 Apps Script，密鑰只存在環境變數
// 需要的環境變數：APPS_URL（Apps Script /exec 網址）、API_TOKEN（同 Apps Script 指令碼屬性）、APP_PASSWORD（你登入網頁用的密碼）
const crypto = require('crypto');
const same = (a, b) => { const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || '')); return x.length === y.length && crypto.timingSafeEqual(x, y); };
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const pw = process.env.APP_PASSWORD, base = process.env.APPS_URL, tok = process.env.API_TOKEN;
  // 任何一個環境變數沒設定，就一律拒絕（避免「沒設密碼＝任何人都能進」）
  if (!pw || !base || !tok) return res.status(500).json({ status: 'error', message: '伺服器設定不完整' });
  if (!same(req.headers['x-pass'], pw)) {
    await new Promise(r => setTimeout(r, 800));                       // 密碼錯誤時刻意延遲，拖慢暴力猜測
    return res.status(401).json({ status: 'error', message: 'unauthorized' });
  }
  try {
    let r;
    if (req.method === 'GET') {
      r = await fetch(base + '?token=' + encodeURIComponent(tok));
    } else if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      b.token = tok;
      r = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(b) });
    } else return res.status(405).end();
    res.status(200).json(await r.json());
  } catch (e) {
    res.status(502).json({ status: 'error', message: '後端暫時無法連線' });
  }
};
