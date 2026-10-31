# 理財計畫 Webapp

Google Sheet（資料）＋ Apps Script（Code.gs）＋ GitHub（網頁）＋ Vercel（託管與 /api/data 代理）。

## Vercel 環境變數
APPS_URL（Apps Script /exec）、API_TOKEN（同 Apps Script 指令碼屬性）、APP_PASSWORD（網頁登入密碼）。

## 試算表「設定」分頁
| 位置 | 用途 |
|---|---|
| B2–B9 | 房貸月扣、過期提醒天數、提醒信間隔、異常變動 %、房貸扣款日、卡費代墊帳戶、賣股手續費折扣預設、每月固定支出 |
| D:E | 各帳戶信用卡每月扣款日（空白＝不自動扣） |
| G:I | 長期里程碑（名稱／目標淨資產／目標日期） |
| K:M | 持股的券商與手續費折扣（同券商共用折扣） |

## 其他工作表
- 交易紀錄：買進／賣出／股利流水帳（網頁「記一筆」寫入，可撤銷最新一筆）
- 歷史：每次儲存的快照　紀錄：錯誤與自動扣款紀錄
- 股票部位 H 欄：持股券商（自動維護）

## 自動化（執行一次 setupTriggers）
每月 1 日提醒與月報、每月 2 日備份、每天 06:00 信用卡自動扣款。

## 部署
Apps Script 貼上 Code.gs → 新版本部署；GitHub 推送 index.html、src.css 等 → Vercel 自動建置。
