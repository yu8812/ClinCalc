# ClinCalc 精準計算臨床決策平台 — 專案內部文件 (Internal Map)

> 版本：2026-03 ｜ 技術棧：Next.js 14 + TypeScript + Tailwind CSS + Supabase + Gemini API + Netlify
>
> 本文件供開發者快速定位功能與檔案，同時作為系統架構說明文件。**IM.md 本身不上 Git。**

---

## 系統架構概述

ClinCalc 是一個面向一般民眾的醫療健康自查平台，核心設計原則：

1. **離線優先（Offline-first）**：本地參考值資料庫 + 本地分析引擎，無需網路即可執行基本分析
2. **AI 輔助（AI-assisted）**：Google Gemini API 提供深度解讀，為補充層而非必要依賴
3. **資料主權**：未登入用戶資料存 localStorage，登入後可一鍵同步至 Supabase 雲端
4. **免責優先**：所有分析頁面強制顯示免責聲明，AI 輸出明確標示非醫療診斷

### 架構流程圖（文字版）

```
用戶瀏覽器
  ↓
Next.js App Router (Netlify Edge)
  ├── Client Components → Supabase JS SDK (anon key, RLS 保護)
  ├── API Route /api/gemini → Gemini API (Server-side, key 不外洩)
  └── Static Assets (本地醫療參考值資料庫)
                          ↓
                  Supabase PostgreSQL
                  ├── auth.users (Supabase Auth)
                  ├── profiles (個人資料)
                  ├── health_records (健康記錄)
                  ├── medications (藥物資料庫)
                  └── medical_references (參考值，未來替換本地 JSON)
```

---

## 專案目錄結構

```
clincalc/
├── src/
│   ├── app/                        # Next.js App Router 頁面 & API
│   │   ├── page.tsx                # 首頁
│   │   ├── layout.tsx              # 根 Layout（Provider 掛載點）
│   │   ├── globals.css             # 全域樣式 + CSS 變數系統
│   │   ├── dashboard/              # 登入後首頁
│   │   ├── check/                  # 健康自我檢查（入口 + 簡單 + 詳細）
│   │   ├── scan/                   # 圖片掃描 + OCR + 翻譯
│   │   ├── records/                # 健康記錄歷史
│   │   ├── meds/                   # 藥物資料查詢
│   │   ├── profile/                # 個人設定
│   │   ├── auth/                   # 登入 / 註冊 / Email 驗證 callback
│   │   └── api/gemini/             # Gemini AI 代理 API Route
│   ├── components/
│   │   ├── Navbar.tsx              # 全站導航列
│   │   └── DisclaimerModal.tsx     # 首次使用免責聲明
│   ├── contexts/
│   │   ├── ThemeContext.tsx         # 深/淺色主題
│   │   └── LanguageContext.tsx      # 中/英語系
│   └── lib/
│       ├── supabase.ts             # Supabase 瀏覽器端客戶端
│       ├── supabase-server.ts      # Supabase 伺服器端客戶端
│       ├── referenceRanges.ts      # 醫療參考值資料庫（本地 JSON）
│       ├── localAnalysis.ts        # 本地即時分析引擎
│       ├── healthStore.ts          # 健康記錄讀寫（localStorage + Supabase）
│       ├── i18n.ts                 # 中英翻譯字串
│       └── utils.ts                # 通用工具函數
├── supabase/
│   ├── medications.sql             # 藥物資料表建表語法
│   ├── seed_medications.sql        # 藥物種子資料（30+ 種常見藥）
│   └── health_records.sql          # 健康記錄表 + RLS 政策
├── scripts/
│   └── sync-references.mjs         # 同步本地參考值至 Supabase 腳本
├── .github/workflows/
│   └── sync-references.yml         # GitHub Action：每月自動同步
├── .env.local                      # 環境變數（不上 Git）
├── netlify.toml                    # Netlify 部署設定
└── IM.md                           # 本文件（不上 Git）
```

---

## 頁面地圖 (`src/app/`)

### 主要功能頁面

| 路由 | 檔案 | 功能說明 | 需登入 |
|------|------|---------|--------|
| `/` | `page.tsx` | 首頁 Landing Page，平台功能介紹 + CTA 按鈕 | 否 |
| `/dashboard` | `dashboard/page.tsx` | 登入後首頁，顯示用戶名稱 + 四大功能入口卡片 + 登出 | 是 |
| `/check` | `check/page.tsx` | **自查入口** — 選擇「簡單自查」或「詳細分析」的導航頁 | 否 |
| `/check/simple` | `check/simple/page.tsx` | **簡單自查** — 症狀勾選 + 文字描述 + 基本數據 + AI 緊急度評估 | 否 |
| `/check/detail` | `check/detail/page.tsx` | **詳細分析** — 30+ 項體檢數值輸入 + 本地即時分析 + AI 深度解讀 | 否 |
| `/scan` | `scan/page.tsx` | **掃描報告** — 圖片上傳/拍照 + Gemini OCR 識別 + 醫療翻譯 | 否 |
| `/records` | `records/page.tsx` | **健康記錄** — 歷史記錄列表，未登入顯示 localStorage，登入後顯示雲端 | 否 |
| `/meds` | `meds/page.tsx` | **藥物查詢** — 搜尋藥名（中/英/通用名），查看用途、副作用、警示 | 否 |
| `/profile` | `profile/page.tsx` | **個人設定** — 修改姓名、性別、生日（存至 Supabase profiles 表） | 是 |

### 認證頁面

| 路由 | 檔案 | 功能說明 |
|------|------|---------|
| `/auth/login` | `auth/login/page.tsx` | Email + 密碼登入，呼叫 `supabase.auth.signInWithPassword()`，成功跳轉 `/dashboard` |
| `/auth/register` | `auth/register/page.tsx` | 新用戶註冊，含免責聲明 checkbox，成功後顯示「請到 Email 確認信箱」畫面 |
| `/auth/callback` | `auth/callback/route.ts` | Supabase Email 驗證 callback，使用 `exchangeCodeForSession()` 換取 session，跳轉 `/dashboard` |

### 廢棄路由（保留舊連結相容）

| 路由 | 說明 |
|------|------|
| `/analyze` | 重定向至 `/check`（原舊路由） |
| `/translate` | 重定向至 `/scan`（原舊路由） |

---

## 核心功能詳細說明

### 1. 健康自查系統（`/check`）

**設計理念**：普通民眾不一定有詳細體檢數據，因此分成兩個層級：

#### 簡單自查 (`/check/simple/page.tsx`)
- **症狀快選**：25 個常見症狀 chip 按鈕（頭痛、發燒、咳嗽、胸痛、心悸等），多選
- **自由描述**：文字框讓用戶用自己的語言描述感受
- **症狀持續時間**：6 個選項（今天才開始 → 超過 3 個月）
- **不適程度**：0~10 滑桿
- **基本生命徵象**：年齡、性別、體溫、身高/體重（自動算 BMI）、血壓（收縮/舒張）、心跳
- **AI 緊急度評估**：Gemini 分析後輸出四級評估
  - 🔴 立即就醫（可能有緊急狀況）
  - 🟠 盡快就診（24~48 小時內）
  - 🟡 一般門診（1~2 週內）
  - 🟢 可自我觀察（注意變化即可）
- **安全設計**：AI 明確被指示不推薦任何藥物名稱

#### 詳細分析 (`/check/detail/page.tsx`)
- **快速導航**：頂部 7 個分類快速跳轉按鈕（糖尿病 / 心血管 / 肝功能 / 腎功能 / 甲狀腺 / 腫瘤指標 / 全套血液），點擊自動 scroll 並展開對應區塊
- **30+ 醫療數值輸入**：依分類折疊顯示（血液常規 / 肝功能 / 腎功能 / 代謝 / 生命徵象 / 甲狀腺 / 腫瘤指標）
- **即時本地分析**（`localAnalysis.ts`）：輸入數值立即比對，顯示正常/偏高/偏低統計，不需 AI
- **異常項目說明**：每個異常值附上白話說明和參考範圍
- **AI 深度分析**：整合所有數值送至 Gemini，生成個人化解讀報告
- **儲存記錄**：分析結果可存至 localStorage 或 Supabase（登入後）

### 2. 本地分析引擎 (`src/lib/localAnalysis.ts`)

**完全離線，不消耗 API 配額**

- 輸入：`{ [key: string]: number }` 數值 Map + 性別
- 輸出：`AnalysisSummary`
  - `items[]`：每項指標狀態（normal/high/low），異常項目排前
  - `normalCount / highCount / lowCount`：統計數字
  - `riskFlags[]`：特殊風險警示（如三高組合、貧血+心跳過快等）
  - `suggestions[]`：一般性建議語句
  - `bmi`：自動計算

### 3. 醫療參考值資料庫 (`src/lib/referenceRanges.ts`)

**30+ 項目，8 大分類，設計可未來替換為 Supabase 查詢**

| 分類 (`category`) | 項目數 | 代表指標 |
|-------------------|--------|---------|
| `blood` | 7 | WBC、Hb、PLT、RBC、HCT、MCV、MCH |
| `liver` | 5 | AST、ALT、ALP、T-Bil、Albumin |
| `kidney` | 5 | BUN、Creatinine、eGFR、Uric Acid、Na/K |
| `metabolism` | 6 | Glucose、HbA1c、Cholesterol、LDL、HDL、Triglycerides |
| `vitals` | 4 | 血壓收縮/舒張、心跳、體溫 |
| `body` | 3 | 身高、體重、BMI（自動計算）|
| `thyroid` | 3 | TSH、Free T4、Free T3 |
| `tumor` | 4 | AFP、CEA、PSA、CA-125 |

每個指標包含：
- `label_zh / label_en`：中英文名稱
- `unit`：單位
- `explanation_zh`：白話說明（供一般民眾閱讀）
- `normal`：正常範圍（男女可分開設定）
- `warning_high / warning_low`：危急值閾值
- `source`：資料來源（長庚醫院 / WHO / ADA / ACC-AHA）

### 4. 圖片掃描 (`/scan/page.tsx`)

三個功能 Tab：
- **上傳掃描**：從裝置選取圖片（體檢報告、藥袋）→ 轉 Base64 → 送至 `/api/gemini`（`scan` 模式）→ Gemini Vision OCR 識別並解讀
- **相機拍照**：呼叫 `getUserMedia` 直接拍照（支援手機），特別適合拍紙本報告
- **醫療翻譯**：貼上文字，選擇翻譯方向（中→英 / 英→中），Gemini 翻譯並保留醫療術語準確性

### 5. 藥物查詢 (`/meds/page.tsx`)

- 從 Supabase `medications` 表查詢（RLS：任何人可讀）
- 支援中文藥名、英文藥名、通用學名搜尋
- 顯示：用途、副作用、警示事項、是否需處方
- 30+ 種常見藥：降血壓、降血糖、降血脂、抗血栓、抗生素、止痛、呼吸、精神科、甲狀腺、痛風等

### 6. 健康記錄系統

**雙層儲存設計**（`src/lib/healthStore.ts`）：

| 情境 | 儲存位置 | 說明 |
|------|---------|------|
| 未登入 | localStorage (`cc-health-records`) | 即時可用，清除瀏覽器資料會消失 |
| 已登入 | Supabase `health_records` | 永久保存、跨裝置同步 |

- **一鍵遷移**：已登入後，`/records` 頁面偵測到 localStorage 有資料，顯示「同步」按鈕，一鍵上傳至雲端
- **雲端標示**：顯示 ☁️ 雲端同步 / 💾 本機儲存 狀態

### 7. Gemini AI API 代理 (`src/app/api/gemini/route.ts`)

**Server-side 代理，防止 API Key 洩漏**

| 模式 (`type`) | 輸入 | 用途 |
|---------------|------|------|
| `analyze` | `text: string` | 健康分析（簡單自查、詳細分析）|
| `translate` | `text, direction` | 醫療文字翻譯（`zh2en` / `en2zh`）|
| `scan` | `imageBase64, imageMimeType, question?` | 圖片 OCR 識別 |

安全機制：
- Rate limiting：每個 IP 每分鐘最多 20 次請求
- Retry：503 服務暫時不可用時，自動重試 2 次（2s / 4s 延遲）
- 友善錯誤訊息：429（配額用盡）/ 401（Key 無效）各自提示
- Model：`gemini-2.5-flash`（Google 免費層：5 RPM / 20 RPD）

---

## API 路由

| 路由 | 方法 | 說明 |
|------|------|------|
| `/api/gemini` | `POST` | Gemini AI 代理，接收 `{ type, text?, imageBase64?, ... }` |

---

## 元件 (`src/components/`)

### `Navbar.tsx`

- **桌面版（md 以上）**：Logo + 導航連結 + 語言切換 + 主題切換 + 登入狀態
- **行動版頂部**：Logo + 語言 + 主題 + 頭像（登入）/ 登入圖示（未登入）
- **行動版底部 Nav**：5 個 Tab（首頁 / 自查 / 掃描 / 藥物 / 記錄）
- **登入狀態判斷**：`supabase.auth.getUser()` + `onAuthStateChange` 訂閱，即時更新
- **頭像顯示**：從 `profiles` 表取 `name`，顯示首字母；未有名稱則用 email 前綴
- **登出**：`supabase.auth.signOut()` + 跳轉 `/`

### `DisclaimerModal.tsx`

- 首次進入網站顯示全螢幕免責聲明 Modal
- 用戶點擊「我已了解並同意」後，寫入 `localStorage`（key: `cc-disclaimer-accepted`）
- 後續訪問不再顯示

---

## Context (`src/contexts/`)

### `ThemeContext.tsx`

- 提供 `theme`（`"dark"` | `"light"`）+ `toggleTheme()`
- 切換時修改 `<html>` 的 `data-theme` attribute，CSS 變數自動切換
- 偏好設定存入 `localStorage`（key: `cc-theme`）

### `LanguageContext.tsx`

- 提供 `locale`（`"zh"` | `"en"`）+ `setLocale()` + `t(key)` 翻譯函數
- 翻譯字串定義於 `src/lib/i18n.ts`
- 偏好設定存入 `localStorage`（key: `cc-locale`）

---

## 工具函數庫 (`src/lib/`)

| 檔案 | 主要 Export | 說明 |
|------|------------|------|
| `supabase.ts` | `createClient()` | Supabase 瀏覽器端客戶端（使用 `@supabase/ssr` 的 `createBrowserClient`）|
| `supabase-server.ts` | `createServerSupabaseClient()` | Supabase 伺服器端客戶端（使用 cookies，用於 API Routes / Server Components）|
| `referenceRanges.ts` | `REFERENCE_RANGES[]`, `CATEGORIES`, `checkAbnormal()`, `getNormalRange()` | 醫療參考值資料庫，詳見上方說明 |
| `localAnalysis.ts` | `analyzeLocally(values, gender)` | 本地即時分析，回傳 `AnalysisSummary` |
| `healthStore.ts` | `getRecords()`, `saveRecord()`, `deleteRecord()`, `getRecordsCloud()`, `saveRecordCloud()`, `deleteRecordCloud()`, `getProfile()`, `saveProfile()` | localStorage + Supabase 雙層讀寫 |
| `i18n.ts` | `translations` | 中英翻譯字串物件 |
| `utils.ts` | 通用工具 | 日期格式化等 |

---

## Supabase 資料庫結構

### 資料表一覽

| 表格名稱 | 說明 | RLS 政策 | SQL 來源 |
|---------|------|---------|---------|
| `auth.users` | Supabase Auth 內建，用戶帳號 | 由 Supabase 管理 | 自動建立 |
| `profiles` | 用戶個人資料 | 僅本人讀寫 | Supabase 介面建立 |
| `health_records` | 健康記錄 | 僅本人讀寫 | `supabase/health_records.sql` |
| `medications` | 藥物資料庫 | 所有人可讀，服務帳號可寫 | `supabase/medications.sql` |
| `medical_references` | 醫療參考值（未來替換本地 JSON）| 所有人可讀 | `supabase/medications.sql`（同檔）|

### 資料表欄位詳細

**`profiles`**
```
id            uuid  PRIMARY KEY  references auth.users(id)
name          text
gender        text  ('M' | 'F')
date_of_birth date
language      text  default 'zh'
created_at    timestamptz
updated_at    timestamptz
```

**`health_records`**
```
id          uuid     PRIMARY KEY  default gen_random_uuid()
user_id     uuid     references auth.users(id)
type        text     ('manual' | 'scan' | 'analyze')
data        jsonb    -- 所有數值，格式：{ key: value, _symptoms: "..." }
ai_analysis text     -- AI 分析結果全文
created_at  timestamptz
```

**`medications`**
```
id                  uuid
name_zh             text  -- 中文商品名（如：脂立清）
name_en             text  -- 英文商品名（如：Lipitor）
generic_name        text  -- 通用藥名（如：Atorvastatin）
category            text  -- 分類（降血脂 / 降血壓 / 降血糖...）
uses_zh             text  -- 用途說明（中文）
uses_en             text  -- 用途說明（英文）
side_effects_zh     text  -- 副作用
common_dosage       text  -- 常見劑量
warnings_zh         text  -- 警示事項
interactions        text[]-- 交互作用藥物清單
prescription_required boolean
source              text  default 'manual'
updated_at          timestamptz
```

### 觸發器

- `on_auth_user_created`：新用戶註冊時，自動在 `profiles` 建立對應一筆空白記錄

### Supabase Auth 設定

- 登入方式：Email + 密碼（Email 驗證啟用）
- Email 驗證 callback URL：`{SITE_URL}/auth/callback`
- Row Level Security：所有用戶資料表均啟用 RLS

---

## 樣式系統 (`src/app/globals.css`)

### CSS 變數（深/淺色自動切換）

| 變數名 | 深色值 | 淺色值 | 用途 |
|--------|--------|--------|------|
| `--bg-base` | `#0a0e1a` | `#f8fafc` | 頁面背景 |
| `--bg-card` | `#111827` | `#ffffff` | 卡片背景 |
| `--bg-primary` | `#1a2235` | `#f1f5f9` | 次級背景 |
| `--nav-bg` | `rgba(10,14,26,0.85)` | `rgba(255,255,255,0.85)` | 導航欄背景（含 blur）|
| `--border` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.08)` | 邊框 |
| `--accent` | `#00D4AA` | `#00b894` | 主色調（青綠）|
| `--accent-dim` | `rgba(0,212,170,0.1)` | `rgba(0,184,148,0.1)` | 主色調淡背景 |
| `--text-primary` | `#f1f5f9` | `#0f172a` | 主要文字 |
| `--text-secondary` | `#94a3b8` | `#64748b` | 次要文字 |
| `--warning` | `#f59e0b` | `#d97706` | 警告色（黃）|
| `--danger` | `#ef4444` | `#dc2626` | 危險色（紅）|

### 共用 CSS Class

| Class | 說明 |
|-------|------|
| `.card` | 標準卡片（背景 + 圓角 + 邊框）|
| `.btn-primary` | 主要操作按鈕（accent 背景）|
| `.btn-ghost` | 次要按鈕（透明背景 + hover）|
| `.input-field` | 輸入框標準樣式 |
| `.badge` | 小標籤（已填 N 項）|
| `.fade-in` | 淡入動畫（0.3s ease）|
| `.loading-dot` | 載入中三點動畫 |

---

## 環境變數 (`.env.local`)

| 變數名 | 說明 | 類型 |
|--------|------|------|
| `GEMINI_API_KEY` | Google Gemini API Key | Server only（絕不加 `NEXT_PUBLIC_`）|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 專案 URL | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Publishable/Anon Key | Client + Server |

Netlify 環境變數設定路徑：Site → Site settings → Environment variables

---

## 開發指令

```bash
cd D:\Clinclac\clincalc

npm run dev          # 啟動開發伺服器 http://localhost:3000
npm run build        # 建置生產版本（檢查型別錯誤）
npm run lint         # ESLint 程式碼品質檢查
npx tsc --noEmit     # TypeScript 型別檢查（不輸出檔案）

# 手動執行參考值同步
node scripts/sync-references.mjs
```

---

## 部署設定

- **平台**：Netlify（Free tier）
- **GitHub 倉庫**：`yu8812/ClinCalc`，`main` branch
- **自動部署**：Push 到 `main` → Netlify 自動 build + deploy（約 2~3 分鐘）
- **Next.js 轉接**：`netlify.toml` 使用 `@netlify/plugin-nextjs`
- **Edge Functions**：Netlify 自動處理 API Routes

---

## GitHub Actions 自動化 (`.github/workflows/`)

### `sync-references.yml` — 醫療參考值自動同步

- **觸發**：每月 1 日台灣時間 08:00（UTC 00:00）自動執行，或手動觸發
- **功能**：將 `src/lib/referenceRanges.ts` 的數據寫入 Supabase `medical_references` 表
- **執行腳本**：`node scripts/sync-references.mjs`
- **需要 GitHub Secrets**：
  - `SUPABASE_URL`：Supabase 專案 URL
  - `SUPABASE_SERVICE_KEY`：Service Role Key（非 anon key，有寫入權限）

---

## 安全設計重點

1. **API Key 保護**：Gemini API Key 僅存 server-side，透過 `/api/gemini` 代理，客戶端無法取得
2. **Row Level Security**：Supabase 所有用戶資料表（profiles, health_records）啟用 RLS，確保用戶只能存取自己的資料
3. **Supabase Anon Key**：即使公開於 client-side，因 RLS 保護仍無法越權存取他人資料
4. **Rate Limiting**：`/api/gemini` 每 IP 每分鐘 20 次上限，防止濫用
5. **免責聲明**：
   - 首次進入強制全螢幕 Modal
   - Navbar 頂部黃色警告橫幅
   - 所有 AI 分析結果底部固定聲明
   - 簡單自查頁明確標示不推薦藥物
6. **輸入清洗**：所有 number input 使用 `parseFloat`，不直接傳字串給 AI

---

## 待開發 (TODO)

- [ ] 設定 GitHub Secrets（`SUPABASE_SERVICE_KEY`）啟用每月自動同步
- [ ] `/check/detail` 快速導航補強（標記已輸入哪些分類的數量）
- [ ] 健康趨勢圖表（多次記錄後的數值趨勢）
- [ ] 用藥提醒功能（需要 Notification API）
- [ ] 英文版翻譯補齊（i18n.ts 擴充）

## 已完成功能清單

- [x] 首頁 Landing Page + 免責聲明 Modal
- [x] 深色/淺色主題切換（CSS 變數系統）
- [x] 中英雙語切換（LanguageContext）
- [x] Supabase Auth（Email 登入/註冊/Email 驗證）
- [x] Navbar 登入狀態顯示（頭像 + 名稱 + 登出）
- [x] 健康自查入口頁（簡單 / 詳細 選擇）
- [x] 簡單自查（症狀 chips + 基本數據 + AI 緊急度 🔴🟠🟡🟢）
- [x] 詳細分析（30+ 項 + 快速導航 + 本地即時分析 + AI 深度分析）
- [x] 本地分析引擎（離線可用，不消耗 Gemini 配額）
- [x] 圖片掃描 + 拍照 + 醫療翻譯（Gemini Vision）
- [x] 健康記錄（localStorage + 雲端雙層 + 一鍵遷移）
- [x] 藥物查詢（Supabase medications 表，30+ 種）
- [x] 個人設定頁（名稱 / 性別 / 生日）
- [x] Gemini API 代理（rate limit + retry + 友善錯誤）
- [x] 醫療參考值資料庫（30+ 項，8 分類，含白話說明）
- [x] 自動同步 GitHub Action（每月）
