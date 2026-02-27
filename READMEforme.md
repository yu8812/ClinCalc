# ClinCalc 開發者文件
> 給自己看的完整技術說明。

---

## 一、專案全貌

**ClinCalc** 是一個台灣醫療臨床決策輔助平台，由兩個完全獨立的部分組成：

| 部分 | 檔案 | 說明 |
|------|------|------|
| 前端網站 | `index.html` | 單一 HTML 檔，無需後端，可直接在瀏覽器開啟 |
| 文件庫系統 | `scripts/` + GitHub Actions | Python 腳本定期抓取醫療指引，生成搜尋索引 |

**部署位置：** `https://yu8812.github.io/ClinCalcc/medai_v7.html`

---

## 二、前端網站架構（medai_v7.html）

### 整體結構
整個網站是**一支 HTML 檔案**，包含：
- CSS（`<style>` 在 head）
- HTML（頁面結構）
- JavaScript（`<script>` 在 body 尾）

頁面分為四個主要區塊（Tab），由頂部導覽列切換：

```
計算工具 (s-calc)  →  多個計算器
AI 症狀評估 (s-ai)  →  症狀選擇 + AI 分析
醫師專區 (s-dr)    →  健檢資料輸入 + 判讀報告
資料專區 (s-ref)   →  醫療指引搜尋
```

### CSS 設計系統
所有顏色和樣式都透過 CSS 變數定義，在 `:root` 區塊裡：

```css
:root {
  --c0: #060810;   /* 最深背景 */
  --c1: #0d1220;   /* 卡片背景 */
  --teal: #00c9a7; /* 主色（綠色） */
  --amber: #f59e0b; /* 警告色 */
  --rose: #f43f5e;  /* 危險色 */
  --sky: #38bdf8;   /* 資訊色 */
  --violet: #a78bfa; /* 醫師專區色 */
}
```

**想改顏色**：只改 `:root` 裡的變數，全站自動更新。

### JS 模組架構（ClinCalc 命名空間）

所有功能掛在 `ClinCalc` 全域物件下，避免命名衝突：

```
ClinCalc
├── .Config        設定管理：AI provider、保留天數、DeID 規則
│                  → 讀取/寫入 localStorage
│
├── .AI            統一 AI 呼叫入口
│   ├── .call()    根據 provider 自動派發
│   ├── ._callClaude()
│   ├── ._callOpenAI()
│   ├── ._callGemini()
│   └── ._callSupabaseAI()
│
├── .DeID          去識別化引擎
│   ├── .sanitize()   移除 PII 欄位，假名化 PID
│   ├── .audit()      掃描潛在敏感資料
│   └── .diff()       對比去識別化前後差異
│
├── .Retention     資料保留管理
│   ├── .purgeLocalDrafts()   清除過期本機記錄
│   └── .buildSupabaseCleanupSQL()   生成 pg_cron SQL
│
├── .SupabaseAI    免費 AI（Groq + Llama 3.1）
│   ├── .test()
│   └── .getEdgeFunctionCode()
│
├── .Components    組件註冊表（目前未大量使用）
└── .UI            UI 工具（provider badge 渲染等）
```

### 計算工具（s-calc）

每個計算器都是獨立的面板（`.cp`），結構完全一致：

```
HTML:
<div class="cp" id="cp-ckd">
  輸入欄位...
  <button onclick="calcCKD()">計算</button>
  <div class="rp" id="rp-ckd">結果區</div>
</div>

JS:
function calcCKD() {
  // 1. 讀取欄位值
  // 2. 計算
  // 3. 渲染結果到 #rp-ckd
  // 4. document.getElementById('rp-ckd').classList.add('on')
}
```

**現有計算器：**

| ID | 功能 | 主要公式/標準 |
|----|------|--------------|
| `ckd` | 慢性腎臟病 eGFR | CKD-EPI 2021 race-free |
| `dm` | 糖尿病評估 | ADA 2026 診斷標準 |
| `cv` | 心血管風險 | PCE (Pooled Cohort Equations) + 代謝症候群 |
| `anemia` | 貧血分析 | WHO 定義 + MCV/Mentzer 指數 |
| `liver` | 肝功能 | FIB-4、APRI、NAFLD LFS |
| `thyroid` | 甲狀腺 | TSH/T4 異常判讀 |
| `bone` | 骨礦物質 | KDIGO CKD-MBD 準則 |
| `sens` | 靈敏度/特異度 | 混淆矩陣、LR+/LR−、Youden J |

**新增計算器的方法：**
1. 在計算工具 Tab 的 HTML 新增一個 `<div class="cp" id="cp-xxx">` 面板
2. 在頂部加入 `<button class="ctab" onclick="showCalc('xxx')">名稱</button>`
3. 新增對應的 `function calcXXX()` 函數
4. 結果放入 `<div class="rp" id="rp-xxx">`

### 醫師專區（s-dr）詳細說明

這是最複雜的區塊，分為上下兩部分：

**上方 Tab（系統設定）：**
- `drt-api`：AI 提供商設定（四家廠商切換）
- `drt-supabase`：Supabase 連線設定 + 免費 AI 部署
- `drt-privacy`：去識別化設定 + 資料保留設定

**下方：健檢資料輸入區塊（drblock）**

每個 `drblock` 對應一個檢查項目：

```
📋 受檢者基本資料  → 年齡（日期選擇器）、性別、空腹時間、症狀、既往病史
📏 身體檢查        → 身高體重BMI（自動）、血壓、腰圍、理想體重（自動）
🩺 理學檢查        → 視力、聽力、PE 異常發現
📸 特殊檢查        → 心電圖、X光、口腔
🍬 血糖 & 代謝     → FPG、飯後血糖、HbA1c、胰島素、HOMA-IR（自動）
🩸 血脂            → TC、TG、LDL、HDL、非HDL（自動）
🫀 肝腎功能        → AST/ALT、Cr、eGFR（自動）、尿酸、BUN、UACR
🔬 CBC             → Hb、WBC、PLT、MCV
🦠 肝炎 & 甲狀腺   → HBsAg、Anti-HCV、TSH、Free T4
🦴 骨礦物質        → Ca、P、PTH、Vit D
🧪 尿液常規        → 外觀、pH、比重、尿糖、尿酮、WBC/RBC
🔬 腫瘤標記        → CEA、AFP、CA-125、CA 19-9、PSA
💊 健保降血脂病史  → ACS、CABG、CVD、DM、高血脂症等（用於 Statin 收案）
🏃 生活習慣        → 抽菸詳細、飲酒、檳榔、運動、飲食、睡眠
```

**資料流程：**
```
使用者填表
    ↓
getDRData()        → 收集所有欄位值，回傳一個大物件 d
    ↓
judgeDR(d)         → 規則判讀（健保收案資格：代謝症候群/CKD/Statin）
    ↓
generateHealthReport(d) → 生成健康建議報告（BMI/血壓/血糖/戒菸等）
    ↓
renderHealthReport(d)   → 渲染成 HTML 卡片（紅/黃/綠分級）
    ↓
[選擇] AI 分析     → 把 d 送給 AI，取得整體評估
    ↓
顯示到 #rp-dr
```

**自動計算欄位：**

| 欄位 ID | 由哪些欄位觸發 | 函數 |
|---------|---------------|------|
| `dr_age` | `dob_y/m/d` + `dr_exam_date` | `calcAgeFromPicker()` |
| `dr_bmi` | `dr_ht` + `dr_wt` | `autoBMI()` |
| `dr_ibw` | `dr_ht` + `dr_sex` | `autoIBW()` |
| `dr_egfr` | `dr_cr` + `dr_age` + `dr_sex` | `autoEGFR()` |
| `dr_homa` | `dr_fpg` + `dr_ins` | `autoHOMA()` |
| `dr_whr` | `dr_waist` + `dr_hip` | `autoWHR()` |
| `dr_nhdl` | `dr_tc` + `dr_hdl` | `autoNHDL()` |

### 年齡輸入雙模式（v7 新增）

```
模式 A（預設）：年月日下拉選擇器
  ├── dob_y / dob_m / dob_d  → 選擇西元出生年月日
  ├── dr_exam_date            → type="date" 選擇檢查日期
  └── calcAgeFromPicker()     → 計算年齡，同步 dr_dob / dr_exam 隱藏欄位

模式 B：直接輸入
  ├── dr_dob_text             → YYYYMMDD（西元）
  ├── dr_exam_text            → YYYYMMDD（西元）
  └── calcAgeFromText()       → 計算年齡，同步到 dr_age / dr_dob / dr_exam
```

切換模式：`toggleDobMode('picker' | 'text')`

讀取當前模式：`getDobMode()`
讀取性別（兩模式共用）：`getDRSex()`
讀取年齡（兩模式共用）：`getDRAge()`

### 健保收案判讀（judgeDR）

回傳一個陣列，每個項目結構：
```js
{
  name: '計畫名稱',
  qualified: true/false,   // 符合/不符合
  partial: true/false,     // 部分符合
  items: [                 // 各條件細項
    { ok: true, text: '條件說明' },
    { ok: false, warn: true, text: '...' }
  ],
  note: '補充說明'
}
```

**目前有三個判讀：**
1. 健保代謝症候群防治計畫（腰圍必備 + 3項代謝異常）
2. 初期 CKD 照護計畫（eGFR 30-59 或蛋白尿+危險因子）
3. 健保 Statin 開立條件（四個條件任一符合）

**新增收案判讀方法：**
在 `judgeDR(d)` 函數的 `results.push(...)` 區段末尾，照格式新增一個物件即可。

### 健康判讀報告（generateHealthReport / v7 新增）

`generateHealthReport(d)` 根據數值自動生成建議項目：

```js
// 每個 item 格式：
{
  icon: '⚖️',
  title: 'BMI 28（過重）',
  rec: '建議每週150分鐘運動...',
  level: 'warn'  // 'ok' | 'warn' | 'danger'
}
```

**目前判讀項目：** BMI、血壓、血糖（FPG/HbA1c）、飯後血糖、LDL、TG、eGFR、抽菸、飲酒、檳榔、睡眠、運動、X光、ECG、腫瘤標記

**新增判讀建議方法：**
在 `generateHealthReport(d)` 函數裡，照格式 `items.push({...})` 加入即可。

### AI 功能

**AI 症狀評估（s-ai）：**
- 使用者選症狀 tag + 填基本資料
- `runAI()` 組 prompt → `callClaude()` → 解析 JSON 回應
- 輸出：緊急程度、可能診斷、居家建議、建議就醫情況

**AI 醫師（醫師專區）：**
- `runDR(true)` → 把整份健檢資料 JSON 送給 AI
- 輸出：整體評估、3大問題、生活建議、追蹤項目

**AI Prompt 格式（都要求回 JSON）：**
```
// 症狀評估
{"urgency":1-5,"label":"...","conditions":[...],"dept":"...","home":[...],"ai_see":[...],"follow":"..."}

// 醫師判讀
{"overall":"...","top3":[...],"lifestyle":[...],"follow_up":[...],"urgent":null}
```

**修改 AI 回應格式方法：**
找到對應的 `prompt` 字串，修改 JSON 欄位定義，同時修改後面的渲染邏輯。

### 資料專區（s-ref）

靜態資料，存在 `REFS` 陣列裡（約 20 筆醫療指引）。
每筆格式：`{id, title, cat, date, url, summary, status}`

**新增指引方法：** 在 `REFS` 陣列末尾 push 一個物件即可，頁面自動渲染。

---

## 三、文件庫系統（scripts/）

### 目錄結構
```
clincalc/
├── data/
│   ├── sources/
│   │   └── urls.yaml        ← 定義要爬的來源
│   ├── raw/                 ← ingest.py 的輸出（爬回來的原始文字）
│   └── processed/           ← process.py 的輸出（切好的 chunks）
├── scripts/
│   ├── ingest.py            ← 爬蟲
│   ├── process.py           ← 切 chunk
│   ├── build_index.py       ← 生成 corpus.json + index.json
│   └── validate.py          ← 驗證輸出格式
├── public/
│   ├── corpus.json          ← 前端搜尋用（chunk 全文）
│   ├── index.json           ← 搜尋索引
│   └── manifest.json        ← 版本資訊
├── .github/workflows/
│   └── update_weekly.yml    ← 每週日自動跑
└── requirements.txt
```

### 四支腳本各自做什麼

**`ingest.py`（Step 1：抓取）**
- 讀取 `urls.yaml` 裡的來源清單
- 用 `requests` + `BeautifulSoup` 爬取每個網頁
- 遇到 403/SSL 錯誤會標示失敗，不中斷整體流程
- 輸出：`data/raw/{id}.json`（含原始文字、URL、爬取時間）

**`process.py`（Step 2：切 chunk）**
- 讀取 `data/raw/*.json`
- 依標點符號和長度切成 chunk（每 chunk 約 300-500 字）
- 輸出：`data/processed/{id}.json`（chunk 陣列）

**`build_index.py`（Step 3：生成索引）**
- 合併所有 processed chunks → `public/corpus.json`
- 生成反向索引（關鍵字 → chunk ID）→ `public/index.json`
- 生成版本資訊 → `public/manifest.json`

**`validate.py`（Step 4：驗證）**
- 確認三個 JSON 格式正確、chunk 數量合理
- 輸出 `✅ 所有輸出驗證通過` 或具體錯誤

### 新增爬取來源方法

編輯 `data/sources/urls.yaml`，在末尾加入：

```yaml
new_source:
  id: new_source
  title: 來源標題
  url: https://example.com/guideline
  license: public_summary   # public / public_summary / open_access / restricted
  category: 醫療指引
```

`restricted` 來源只存 URL，不存文字（著作權合規）。

### GitHub Actions 自動更新

`.github/workflows/update_weekly.yml` 每週日 UTC 00:00 自動執行：
1. `ingest.py` → `process.py` → `build_index.py` → `validate.py`
2. 若有變更，自動 commit 並 push 到 main
3. GitHub Pages 自動更新

也可在 Actions 頁面手動觸發（Run workflow）。

---

## 四、localStorage 鍵值說明

前端用 localStorage 存設定，不需後端：

| 鍵 | 說明 |
|----|------|
| `cc_key` | Anthropic API Key |
| `cc_openai_key` | OpenAI API Key |
| `cc_gemini_key` | Gemini API Key |
| `cc_ai_provider` | 當前 AI 提供商（claude/openai/gemini/supabase） |
| `cc_openai_model` | 選擇的 GPT 模型 |
| `cc_sb_url` | Supabase Project URL |
| `cc_sb_key` | Supabase Anon Key |
| `cc_docid` | 醫師 ID |
| `cc_retention_days` | 資料保留天數（預設 365） |
| `cc_auto_delete` | 是否自動刪除過期記錄 |
| `cc_hash_salt` | 去識別化用的隨機 salt |
| `cc_last_cleanup` | 上次自動清理時間 |
| `cc_drafts` | 本機暫存的健檢資料（最多 20 筆） |
| `cc_custom_src` | 用戶自訂的醫療指引來源 |

---

## 五、Supabase 資料結構

```sql
CREATE TABLE patients (
  id uuid PRIMARY KEY,
  created_at timestamptz,
  doctor_id text,           -- 醫師 ID
  pid text,                 -- 假名化病患 ID（hash）
  exam_date text,           -- 檢查日期
  sex text,
  age integer,
  data jsonb,               -- 去識別化後的完整健檢資料
  qualify_result jsonb,     -- 收案資格判讀結果
  ai_summary jsonb,         -- AI 分析結果（若有）
  expires_at timestamptz    -- 資料到期日
);
```

存入前必須經過 `ClinCalc.DeID.sanitize()` 去識別化。

---

## 六、版本歷史

| 版本 | 主要更新 |
|------|---------|
| v1 | 初始版：計算工具、AI 症狀評估、醫師專區、資料專區、ClinCalc 模組架構 |
| v2 | 完善計算公式
| v3 | 完善AI的API功能
| v4 | 修改架構邏輯
| v5 | 完善症狀評估功能
| v6 | 完善AI分析功能
| v7 | 年齡輸入改為西元年日期選擇器（雙模式）、新增理想體重/理學檢查/ECG/X光/口腔/尿液常規/腫瘤標記欄位、新增健康判讀報告系統、詳細抽菸/喝酒/檳榔紀錄 |

---

## 七、常見修改任務速查

### 改 AI 系統提示（prompt）
位置：JS 裡搜尋 `const prompt=`，有兩個（症狀評估 + 醫師判讀）

### 新增健檢欄位
1. HTML：在對應 `drblock` 裡加 `<input>` 或 `<select>`，給一個 `id="dr_xxx"`
2. JS：在 `getDRData()` 的 return 物件裡加 `xxx: sv('dr_xxx')||null`
3. 判讀：視需要在 `generateHealthReport(d)` 或 `judgeDR(d)` 加判斷邏輯

### 新增計算工具頁籤
1. HTML：加 `<button class="ctab" onclick="showCalc('xxx')">名稱</button>`
2. HTML：加 `<div class="cp" id="cp-xxx">...</div>`
3. JS：寫 `function calcXXX(){...}` 函數
4. 清除：在 `clr(id)` 函數確認清除邏輯（通常自動處理）

### 新增醫療指引
位置：JS 裡的 `REFS` 陣列，直接 push 物件

### 修改健保收案判讀
位置：`function judgeDR(d)` 裡的 `results.push(...)` 段落

### 修改 AI 判讀建議
位置：`function generateHealthReport(d)` 裡的 `items.push(...)` 段落

### 新增 AI 提供商
位置：`ClinCalc.AI` 模組，仿照 `_callClaude()` 格式新增 `_callXXX()` 方法

---

## 八、部署狀態

```
網站     https://yu8812.github.io/ClinCalcc/index.html
Repo     https://github.com/yu8812/ClinCalcc
本機     D:\clin\clincalc\
Actions  每週日 UTC 00:00 自動更新文件庫
```

**更新網站流程：**
```powershell
cd D:\clin\clincalc
# 修改 medai_v7.html
git add medai_v7.html
git commit -m "feat: 說明修改內容"
git push
# GitHub Pages 約 1-2 分鐘後自動更新
```

---

## 九、提示
```
這是 ClinCalc 醫療臨床決策輔助平台的開發工作。
我會上傳 index.html（當前版本）和 READMEforme.md（架構說明）。
請先讀 READMEforme.md 理解架構，再看我的需求。
請使用繁體中文，。
環境：Windows / VSCode / GitHub Pages (yu8812/ClinCalcc)
```
