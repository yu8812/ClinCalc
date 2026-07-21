# `src/app/` — App Router（民眾端）

| 目錄 | 路由 | 說明 |
|---|---|---|
| `check/detail` | 體檢解讀 | 35 項指標即時判讀（含 KDIGO 分期） |
| `check/simple` | 症狀自查 | 互動式身體地圖（17 區 / 44 症狀） |
| `scan` | 掃描 | 拍照上傳報告，Gemini OCR 辨識數值 |
| `translate` | 翻譯 | 中英醫療名詞雙向翻譯 |
| `analyze` | AI 分析 | Gemini 整體健康建議 |
| `meds` | 用藥提醒 | 本地通知排程 |
| `records` | 健康記錄 | 個人指標時序趨勢 |
| `reminders` | 提醒 | 追蹤提醒 |
| `consent/[token]` | 授權 | 一次性權杖授權醫師查閱 |
| `dashboard` / `profile` | 儀表板 / 個人檔案 | — |
| `auth/` | 登入註冊 | 見該資料夾 README |
| `api/` | 伺服器路由 | Gemini 代理等，見該資料夾 README |
