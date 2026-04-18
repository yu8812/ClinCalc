# ClinCalc — 注意事項與踩坑紀錄

## 安全設計重點

1. **API Key 保護**
   - `GEMINI_API_KEY` 絕對不加 `NEXT_PUBLIC_` 前綴
   - 所有 Gemini 呼叫透過 `/api/gemini` 代理，客戶端無法取得 key

2. **Row Level Security（RLS）**
   - `profiles`、`health_records` 均啟用 RLS
   - 用戶只能讀寫自己的資料，即使用 anon key 也無法越權

3. **Rate Limiting**
   - 程式碼層（in-memory Map）已移除，不相容 Edge Runtime
   - 改由 Cloudflare Rate Limiting 在基礎設施層針對 `/api/gemini` 處理

4. **免責聲明**
   - 首次進入強制全螢幕 Modal
   - 所有 AI 分析結果底部固定聲明
   - 簡單自查明確標示不推薦藥物名稱

5. **角色權限**
   - `profiles.role` 欄位：`'user'` | `'doctor'` | `'admin'`
   - RLS 政策阻止用戶自行升級 role（防止權限提升攻擊）
   - `medications` 和 `medical_references` 寫入限制為 doctor/admin

## 已知踩坑

### Netlify 停用（2026-04）
- Netlify 更改為 Credit 制，當月 15 天就用盡被停用
- 教訓：選部署平台要先看清楚限制條款，不只看初始免費方案
- 解決：遷移至 Cloudflare Pages（無限頻寬，明確商業使用允許）

### @cloudflare/next-on-pages 不支援 Next.js 16
- `@cloudflare/next-on-pages` 只支援 Next.js ≤15.5.2
- 正確做法：使用 `@opennextjs/cloudflare`（支援 ≥16.2.3）
- 版本：Next.js 16.2.4 + @opennextjs/cloudflare 1.19.1

### Windows 路徑長度限制
- wrangler 安裝失敗：`TAR_ENTRY_ERROR`（路徑超過 260 字元）
- 解決：以管理員 PowerShell 執行以下指令啟用長路徑支援：
  ```powershell
  Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1
  ```
  重啟後重新安裝

### in-memory Rate Limiter 不相容 Edge Runtime
- Edge Runtime 每次請求是獨立的，無法共享記憶體中的 Map
- 移除 in-memory rate limiter，改用 Cloudflare 基礎設施層處理

### Supabase Email 驗證跳轉 localhost
- 問題：驗證信點擊後跳轉到 `localhost:3000`
- 原因：Supabase Auth 的 Site URL 設定為 localhost
- 修復：
  1. Supabase → Authentication → URL Configuration → Site URL 改為正式網址
  2. `auth/register/page.tsx` 加入 `emailRedirectTo: \`${window.location.origin}/auth/callback\``

### Supabase Project Transfer
- Transfer 需要發起人同時是來源和目標 organization 的成員
- 流程：在目標 Supabase org 先邀請來源帳號為 Owner/Admin，接受邀請後才能 Transfer

## 開發環境

| 項目 | 說明 |
|------|------|
| OS | Windows 11 Pro |
| Node.js | 需支援 Next.js 16（v18+ 建議）|
| 長路徑支援 | 已啟用（LongPathsEnabled = 1）|
| 本地 Supabase | 未使用，直接連雲端 |

## Gemini API 配額（免費層）

| 模型 | RPM | RPD |
|------|-----|-----|
| gemini-2.5-flash | 10 | 250 |

- RPM = Requests per Minute
- RPD = Requests per Day
- 超過回傳 429，程式碼有友善錯誤訊息提示

## 資料隱私設計

- 未登入用戶資料只存在瀏覽器 localStorage
- 登入用戶可選擇性同步至 Supabase
- 圖片掃描：圖片以 Base64 傳送至 Gemini API，Gemini 不長期儲存用戶資料
- 體檢數值不與第三方分享，僅用於 Gemini AI 分析
