# ClinCalc — 頁面地圖與功能說明

## 主要頁面

| 路由 | 檔案 | 功能 | 需登入 |
|------|------|------|--------|
| `/` | `app/page.tsx` | 首頁 Landing Page，平台介紹 + CTA | 否 |
| `/dashboard` | `app/dashboard/page.tsx` | 登入後首頁，四大功能入口 + 登出 | 是 |
| `/check` | `app/check/page.tsx` | 自查入口，選擇簡單或詳細 | 否 |
| `/check/simple` | `app/check/simple/page.tsx` | 簡單自查 — 症狀 + 基本數據 + AI 緊急度 | 否 |
| `/check/detail` | `app/check/detail/page.tsx` | 詳細分析 — 30+ 體檢數值 + 本地 + AI 分析 | 否 |
| `/scan` | `app/scan/page.tsx` | 圖片掃描 / 拍照 / 醫療翻譯（Gemini Vision）| 否 |
| `/records` | `app/records/page.tsx` | 健康記錄歷史（localStorage + 雲端）| 否 |
| `/meds` | `app/meds/page.tsx` | 藥物查詢（搜尋中英文藥名）| 否 |
| `/profile` | `app/profile/page.tsx` | 個人設定（名稱 / 性別 / 生日）| 是 |

## 認證頁面

| 路由 | 檔案 | 功能 |
|------|------|------|
| `/auth/login` | `app/auth/login/page.tsx` | Email + 密碼登入，跳轉 `/dashboard` |
| `/auth/register` | `app/auth/register/page.tsx` | 註冊 + 免責聲明 checkbox，發驗證信 |
| `/auth/callback` | `app/auth/callback/route.ts` | Email 驗證 callback，換取 session |

## 廢棄路由（舊連結相容）

| 路由 | 重定向至 |
|------|---------|
| `/analyze` | `/check` |
| `/translate` | `/scan` |

---

## 功能詳細說明

### 簡單自查（`/check/simple`）

適合：沒有體檢報告，只是身體不舒服的一般民眾

- **症狀快選**：25 個常見症狀 chip 按鈕（頭痛、發燒、咳嗽、胸痛、心悸等），多選
- **自由描述**：文字框讓用戶用自己語言描述
- **症狀持續時間**：6 個選項（今天才開始 → 超過 3 個月）
- **不適程度**：0~10 滑桿
- **基本生命徵象**：年齡、性別、體溫、身高/體重（自動算 BMI）、血壓（收縮/舒張）、心跳
- **AI 緊急度評估**：Gemini 輸出四級評估
  - 🔴 立即就醫（可能有緊急狀況）
  - 🟠 盡快就診（24~48 小時內）
  - 🟡 一般門診（1~2 週內）
  - 🟢 可自我觀察
- **安全限制**：AI 明確不推薦任何藥物名稱

### 詳細分析（`/check/detail`）

適合：有體檢報告數值的用戶

- **快速導航**：頂部 7 個分類跳轉（糖尿病 / 心血管 / 肝功能 / 腎功能 / 甲狀腺 / 腫瘤指標 / 全套血液），點擊自動 scroll
- **30+ 醫療數值輸入**：依分類折疊顯示
- **即時本地分析**（`localAnalysis.ts`）：輸入後立即比對，顯示正常/偏高/偏低，不需 AI
- **異常項目說明**：每個異常值附白話說明和參考範圍
- **AI 深度分析**：整合所有數值送 Gemini，生成個人化解讀報告
- **儲存記錄**：可存至 localStorage 或 Supabase（登入後）

### 本地分析引擎（`src/lib/localAnalysis.ts`）

完全離線，不消耗 API 配額

- 輸入：`{ [key: string]: number }` + 性別
- 輸出：`AnalysisSummary`
  - `items[]`：每項指標狀態（normal/high/low）
  - `normalCount / highCount / lowCount`
  - `riskFlags[]`：特殊風險警示（三高組合、貧血+心跳過快等）
  - `suggestions[]`：一般性建議語句
  - `bmi`：自動計算

### 醫療參考值資料庫（`src/lib/referenceRanges.ts`）

| 分類 | 代表指標 |
|------|---------|
| `blood` | WBC、Hb、PLT、RBC、HCT、MCV、MCH |
| `liver` | AST、ALT、ALP、T-Bil、Albumin |
| `kidney` | BUN、Creatinine、eGFR、Uric Acid、Na/K |
| `metabolism` | Glucose、HbA1c、Cholesterol、LDL、HDL、TG |
| `vitals` | 血壓收縮/舒張、心跳、體溫 |
| `body` | 身高、體重、BMI |
| `thyroid` | TSH、Free T4、Free T3 |
| `tumor` | AFP、CEA、PSA、CA-125 |

每個指標包含：中英文名稱、單位、白話說明、正常範圍（男女可分開）、危急值、資料來源

### Gemini API 代理（`src/app/api/gemini/route.ts`）

`export const runtime = 'edge'`（Cloudflare Edge Runtime）

| 模式（type）| 用途 |
|-------------|------|
| `analyze` | 健康分析（簡單自查 + 詳細分析）|
| `translate` | 醫療文字翻譯（zh2en / en2zh）|
| `scan` | 圖片 OCR 識別（Gemini Vision）|

- Rate limiting 由 Cloudflare Rate Limiting 在基礎設施層處理
- Gemini 配額：gemini-2.5-flash（Google 免費層）
- 友善錯誤訊息：429 配額用盡 / 401 Key 無效

### 健康記錄系統（`src/lib/healthStore.ts`）

| 情境 | 儲存 |
|------|------|
| 未登入 | localStorage（`cc-health-records`）|
| 已登入 | Supabase `health_records` |

- 一鍵遷移：`/records` 偵測 localStorage 有資料，顯示同步按鈕
- 顯示 ☁️ 雲端同步 / 💾 本機儲存 狀態

### Navbar（`src/components/Navbar.tsx`）

- 桌面版：Logo + 導航連結 + 語言切換 + 主題切換 + 登入狀態
- 行動版頂部：Logo + 語言 + 主題 + 頭像
- 行動版底部 Nav：5 個 Tab（首頁 / 自查 / 掃描 / 藥物 / 記錄）
- 登入狀態：`onAuthStateChange` 即時訂閱，頭像顯示名稱首字母
