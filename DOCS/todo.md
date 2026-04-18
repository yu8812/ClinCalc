# ClinCalc — 待辦事項

> 最後更新：2026-04-18

## 🔴 部署（依序執行）

- [ ] **Cloudflare Pages 建立**
  - 登入 Cloudflare → Workers & Pages → Create → Pages → Connect to Git
  - 選 RO883C/ClinCalc
  - Build command：`npx opennextjs-cloudflare build`
  - Output directory：`.open-next/assets`
  - 環境變數：`GEMINI_API_KEY`、`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`

- [ ] **更新 Supabase Auth Site URL**
  - 部署完成後，到 Supabase → Authentication → URL Configuration
  - Site URL 改為 Cloudflare Pages 的正式網址（`https://clincalc.pages.dev` 或自訂域名）
  - Redirect URLs 加入 `{SITE_URL}/auth/callback`

- [ ] **Cloudflare Rate Limiting 設定**
  - 部署完成後在 Cloudflare 後台設定
  - 針對 `/api/gemini` 路徑限制每 IP 請求頻率

- [ ] **GitHub Actions Secrets 設定**
  - RO883C/ClinCalc → Settings → Secrets and variables → Actions
  - 新增：`SUPABASE_URL`、`SUPABASE_SERVICE_KEY`
  - 完成後 keep-alive workflow 才能正常執行

## 🟡 功能開發

- [ ] 健康趨勢圖表（多次記錄後的數值趨勢折線圖）
  - 資料來源：`healthStore.getRecords()` + `getRecordsCloud()`，按 `date` 排序
  - 元件：純 SVG 折線圖（參考 ExClinCalc 的 patient 趨勢圖做法）
  - 入口：`/records` 頁面，有 ≥2 筆同類型記錄時顯示「查看趨勢」按鈕
  - 顯示邏輯：使用者選擇指標（如血壓、血糖），圖表顯示歷史數值 + 正常值色帶
  - 異常點標紅，X 軸為日期，Y 軸為數值
  - 建議新檔：`src/components/TrendChart.tsx`

- [x] 詳細分析快速導航補強（PRESET 按鈕顯示已填入數，填有資料時改為 accent 背景色）

- [ ] 英文版翻譯補齊（i18n.ts 擴充缺漏的字串）
  - `check/detail`、`check/simple`、`records`、`meds`、`dashboard` 頁面仍有大量硬編碼中文
  - 做法：在 `i18n.ts` 補充對應 key，各頁面改用 `t()` 或 `translations[locale]` 取值

- [ ] 用藥提醒功能（Notification API，需用戶授權）
  - 流程：用戶在 `/meds` 頁面點選藥物 → 設定提醒時間（每日 N 次）→ 瀏覽器推播
  - 技術：`Notification.requestPermission()` + `localStorage` 儲存提醒設定
  - 限制：PWA 未安裝時 iOS Safari 不支援，需顯示說明
  - 備選：若推播支援不佳，改為頁面內倒數提示（`setInterval`）
  - 建議新檔：`src/lib/reminderStore.ts` 管理提醒資料

## ✅ 已完成

### 基礎設施
- [x] GitHub 倉庫轉移至 RO883C/ClinCalc
- [x] Supabase 專案轉移至 RO883C's Org
- [x] @opennextjs/cloudflare 安裝完成
- [x] wrangler.toml 建立
- [x] Edge Runtime 設定（/api/gemini）
- [x] Rate limiter 從程式碼移除（改由 Cloudflare 基礎設施處理）
- [x] keep-alive GitHub Action 建立（每 3 天）

### 功能
- [x] 首頁 Landing Page + 免責聲明 Modal
- [x] 深色/淺色主題切換（CSS 變數系統）
- [x] 中英雙語切換（LanguageContext）
- [x] Supabase Auth（Email 登入/註冊/Email 驗證）
- [x] Email 驗證 callback（emailRedirectTo 修正）
- [x] Navbar 登入狀態（頭像 + 名稱 + 登出）
- [x] 健康自查入口頁（簡單 / 詳細 選擇）
- [x] 簡單自查（症狀 chips + 基本數據 + AI 緊急度 🔴🟠🟡🟢）
- [x] 詳細分析（30+ 項 + 快速導航 + 本地即時分析 + AI 深度分析）
- [x] 本地分析引擎（離線可用，不消耗 Gemini 配額）
- [x] 圖片掃描 + 拍照 + 醫療翻譯（Gemini Vision）
- [x] 健康記錄（localStorage + 雲端雙層 + 一鍵遷移）
- [x] 藥物查詢（Supabase medications 表，30+ 種）
- [x] 個人設定頁（名稱 / 性別 / 生日）
- [x] Role 權限系統（user/doctor/admin + RLS）
- [x] 醫療參考值資料庫（30+ 項，8 分類，含白話說明）
