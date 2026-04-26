# ClinCalc — 民眾健康自查與 AI 解讀平台

> 銘傳大學生物醫學工程學系專題研究 · 雙層醫療輔助系統之**民眾端**
> 醫事端對應專案：[ExClinCalc](https://github.com/RO883C/exclincalc)

ClinCalc 是針對台灣一般民眾設計的健康自查網站，提供 45 項常見體檢指標的本地即時解讀、KDIGO 2024 慢性腎臟病分期判讀、互動式身體地圖症狀問診、Google Gemini 1.5 Flash 影像 OCR 與中英醫療翻譯，以及個人健康記錄歷程追蹤。所有原始檢驗數值皆於瀏覽器內本地完成判讀，不上傳任何第三方 API。

## 核心功能

| 模組 | 路由 | 說明 |
|---|---|---|
| 互動式身體地圖 | `/check/simple` | 17 個身體區域、44 種症狀，搭配 Gemini 提供初步病因排序與紅旗症狀 |
| 本地即時分析引擎 | `/check/detail` | 45 項體檢指標即時判讀（10 大分類），KDIGO G1–G5（含 G3a/G3b 共六分期） |
| AI 醫療影像 OCR | `/scan` | 拍照上傳檢驗報告，Gemini 自動辨識指標、數值與單位 |
| 中英醫療翻譯 | `/translate` | 醫療專有名詞雙向翻譯，輔以底線粗體標示專業詞彙 |
| 用藥提醒 | `/meds` | 瀏覽器本地通知排程，支援跨裝置同步 |
| 健康記錄歷程 | `/records` | 過去 9 個月時序圖（Recharts），可切換顯示任一指標組合 |
| 病患授權 | `/consent/[token]` | 一次性權杖授權醫師查閱健康記錄（具時效，預設 7 天到期） |

## 技術棧

- **Next.js 16** App Router + React 19 + TypeScript
- **Tailwind CSS v4**（`@theme` 變數體系，支援明／暗主題）
- **Supabase**（PostgreSQL + Auth + Row Level Security）
- **Google Gemini 1.5 Flash**（醫療 OCR、症狀分析、雙語翻譯）
- **Cloudflare Workers**（OpenNext for Cloudflare 轉接器，全球 320+ 邊緣節點）
- **GitHub Actions**（自動部署、月度參考值同步、Supabase keep-alive）

## 知識庫優先的 Prompt 組裝策略

ClinCalc 在整合 Gemini 時採取「**先查知識庫、再交給 LLM**」的策略：

1. 使用者填完 45 項指標 → 前端逐一查 [`src/lib/referenceRanges.ts`](src/lib/referenceRanges.ts) 知識庫（中英文名、單位、男女參考區間、健康解讀、來源指引 KDIGO 2024 / ADA / ACC-AHA）
2. 對每個欄位呼叫 `checkAbnormal()` 判定為「正常 / 偏高 / 偏低 / 嚴重偏高 / 嚴重偏低」
3. 把**結構化判定結果**（不是原始數值）組成 prompt 交給 Gemini，僅讓它做整體性評估、生活建議與就醫時程
4. Gemini 不再需要記憶各項指標的正常範圍 → 降低幻覺、提升準確度與可追溯性

## 本地開發

### 前置需求
- Node.js 22+ (Windows 用戶請使用 webpack 模式：`npx next dev --webpack`)
- 一個 Supabase 專案（免費方案即可）
- 一個 Google AI Studio API Key（[aistudio.google.com](https://aistudio.google.com)）

### 步驟

```bash
# 1. 安裝依賴
npm install

# 2. 建立 .env.local（複製下方範本填入你的 keys）

# 3. 初始化資料庫：在 Supabase SQL Editor 依序執行
#    supabase/health_records.sql
#    supabase/medications.sql
#    supabase/seed_medications.sql       (選用)
#    supabase/add_role.sql                (角色與 is_pro)
#    supabase/seed_consumer_records.sql   (選用：示範用戶健康記錄趨勢)

# 4. 啟動 dev server
npm run dev                    # macOS / Linux
npx next dev --webpack         # Windows（避免 Turbopack WASM 問題）
# → http://localhost:3000
```

### `.env.local` 範本

```env
# Supabase（在 Dashboard → Settings → API 取得）
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY

# 僅伺服器端使用，繞過 RLS 用於 admin 操作
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# Google Gemini 1.5 Flash（aistudio.google.com）
GEMINI_API_KEY=YOUR_GEMINI_KEY
```

> ⚠️ `.env.local` 已列入 `.gitignore`，**絕對不要 commit**。`SUPABASE_SERVICE_ROLE_KEY` 擁有繞過 RLS 的完整資料庫存取權限，僅可在伺服器端使用。

## 部署到 Cloudflare Workers

```bash
# 本地建置 + 預覽
npm run cf:build
npm run cf:preview

# 手動部署（或 push main 自動觸發 GitHub Actions）
npm run cf:deploy
```

### GitHub Repository Secrets（Settings → Secrets and variables → Actions）
- `CLOUDFLARE_API_TOKEN`（Workers 部署權限）
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`（給月度同步 workflow）

### Cloudflare Workers Dashboard 環境變數（Settings → Variables and Secrets）
- `GEMINI_API_KEY`（runtime secret，**不能放在 GitHub**因為它需在 Worker 執行階段使用）
- `SUPABASE_SERVICE_ROLE_KEY`（同上）

## 自動化 Workflows

| Workflow | 觸發 | 功能 |
|---|---|---|
| `deploy.yml` | push main | 自動建置並部署到 Cloudflare Workers |
| `keep-alive.yml` | 每 3 天 | Ping Supabase REST API 防止 free tier 休眠 |
| `sync-references.yml` | 每月 1 日 08:00 (台灣時間) | 將 `referenceRanges.ts` 同步到 `medical_references` 表 |

## 資料庫架構

ClinCalc 與醫事端 ExClinCalc 共用同一份 Supabase PostgreSQL，總計 **14 張資料表 + 29 條 RLS policy**。ClinCalc 主要使用 `health_records`、`patient_consents`、`medications`、`medical_references` 四張表。

完整 schema 與 RLS 定義見 [`supabase/`](supabase/) 目錄與 [ExClinCalc](https://github.com/RO883C/exclincalc) 對應 SQL。

## 學術引用

本專題撰寫於 2026 年 2 月，相關論文：

> 江家寓，《醫療輔助系統的設計與實作——以慢性腎臟病評估為核心案例之雙層健康資訊平台》，銘傳大學生物醫學工程學系專題研究，2026。

## 授權

MIT License — 學術與非商業用途自由使用。商業使用請先聯絡作者。

本系統提供之健康解讀僅供參考，**不構成任何醫療診斷或處方**，使用者應諮詢合格醫師取得正式醫療建議。
