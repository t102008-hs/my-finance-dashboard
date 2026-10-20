// Vercel Serverless Function：代理 Apps Script，密鑰只存在環境變數
// 需要的環境變數：APPS_URL（Apps Script /exec 網址）、API_TOKEN（同 Apps Script 指令碼屬性）、APP_PASSWORD（你登入網頁用的密碼）
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.headers['x-pass'] !== process.env.APP_PASSWORD)
    return res.status(401).json({ status: 'error', message: 'unauthorized' });
  const base = process.env.APPS_URL, tok = process.env.API_TOKEN;
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
    res.status(502).json({ status: 'error', message: String(e) });
  }
};
