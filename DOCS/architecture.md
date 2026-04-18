# ClinCalc — 系統架構

## 架構流程

```
用戶瀏覽器
  ↓
Next.js App Router（Cloudflare Pages / Edge Runtime）
  ├── Client Components → Supabase JS SDK（anon key，RLS 保護）
  ├── API Route /api/gemini → Gemini API（Edge Runtime，key 不外洩）
  └── 本地分析引擎（referenceRanges.ts + localAnalysis.ts，完全離線）
                          ↓
                  Supabase PostgreSQL（Tokyo）
                  ├── auth.users（Supabase Auth 內建）
                  ├── profiles（個人資料 + role 欄位）
                  ├── health_records（健康記錄，RLS 僅本人可讀寫）
                  ├── medications（藥物資料庫，所有人可讀）
                  └── medical_references（醫療參考值，所有人可讀）
```

## 目錄結構

```
clincalc/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── page.tsx                # 首頁
│   │   ├── layout.tsx              # 根 Layout（Provider 掛載點）
│   │   ├── globals.css             # 全域樣式 + CSS 變數
│   │   ├── dashboard/              # 登入後首頁
│   │   ├── check/                  # 健康自查（入口 + 簡單 + 詳細）
│   │   ├── scan/                   # 圖片掃描 + OCR + 翻譯
│   │   ├── records/                # 健康記錄歷史
│   │   ├── meds/                   # 藥物查詢
│   │   ├── profile/                # 個人設定
│   │   ├── auth/                   # 登入 / 註冊 / Email callback
│   │   └── api/gemini/             # Gemini AI 代理（Edge Runtime）
│   ├── components/
│   │   ├── Navbar.tsx              # 全站導航列
│   │   └── DisclaimerModal.tsx     # 首次免責聲明
│   ├── contexts/
│   │   ├── ThemeContext.tsx         # 深/淺色主題
│   │   └── LanguageContext.tsx      # 中/英語系
│   └── lib/
│       ├── supabase.ts             # Supabase 瀏覽器端 client
│       ├── supabase-server.ts      # Supabase 伺服器端 client
│       ├── referenceRanges.ts      # 醫療參考值資料庫（本地）
│       ├── localAnalysis.ts        # 本地即時分析引擎
│       ├── healthStore.ts          # 健康記錄讀寫（localStorage + Supabase）
│       ├── i18n.ts                 # 中英翻譯字串
│       └── utils.ts                # 工具函數
├── supabase/
│   ├── medications.sql             # 藥物資料表建表語法
│   ├── seed_medications.sql        # 藥物種子資料（30+ 種）
│   ├── health_records.sql          # 健康記錄表 + RLS
│   └── add_role.sql                # profiles.role 欄位 + 角色 RLS
├── scripts/
│   └── sync-references.mjs         # 同步本地參考值至 Supabase
├── .github/workflows/
│   └── keep-alive.yml              # 每 3 天 ping Supabase 防止暫停
├── DOCS/                           # 本文件資料夾
├── .env.local                      # 環境變數（不上 Git）
├── wrangler.toml                   # Cloudflare Pages 部署設定
└── IM.md                           # 詳細內部文件（不上 Git）
```

## Supabase 資料庫結構

### 資料表

| 表格 | 說明 | RLS |
|------|------|-----|
| `auth.users` | Supabase Auth 內建 | Supabase 管理 |
| `profiles` | 個人資料 + role | 僅本人讀寫 |
| `health_records` | 健康記錄 | 僅本人讀寫 |
| `medications` | 藥物資料庫 | 所有人可讀，doctor/admin 可寫 |
| `medical_references` | 醫療參考值 | 所有人可讀 |

### profiles 欄位

```
id            uuid  PRIMARY KEY  references auth.users(id)
name          text
gender        text  ('M' | 'F')
date_of_birth date
language      text  default 'zh'
role          text  default 'user'  -- 'user' | 'doctor' | 'admin'
created_at    timestamptz
updated_at    timestamptz
```

### health_records 欄位

```
id          uuid     PRIMARY KEY
user_id     uuid     references auth.users(id)
type        text     ('manual' | 'scan' | 'analyze')
data        jsonb    -- { key: value, _symptoms: "..." }
ai_analysis text     -- AI 分析全文
created_at  timestamptz
```

### 觸發器

- `on_auth_user_created`：新用戶註冊時自動在 `profiles` 建立空白記錄

## 環境變數

| 變數 | 說明 | 類型 |
|------|------|------|
| `GEMINI_API_KEY` | Google Gemini API Key | Server only（絕不加 NEXT_PUBLIC_）|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 專案 URL | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | Client + Server |

## CSS 變數系統（深/淺色）

| 變數 | 用途 |
|------|------|
| `--bg-base` | 頁面背景 |
| `--bg-card` | 卡片背景 |
| `--accent` | 主色調（青綠 #00D4AA）|
| `--text-primary` | 主要文字 |
| `--text-secondary` | 次要文字 |
| `--warning` | 警告色（黃）|
| `--danger` | 危險色（紅）|
