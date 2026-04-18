# ClinCalc 論文截圖與說明指南

> 本文件幫助你在撰寫論文時知道要截哪些圖、每張圖要說明什麼。

---

## 一、系統架構圖（自行繪製或截）

**建議工具**：draw.io / Figma / PowerPoint

說明要點：
- 用戶瀏覽器 → Cloudflare Workers（Edge Runtime）
- Workers 分流：靜態資產 ← .open-next/assets，動態請求 → worker.js
- worker.js → Supabase（資料庫 + Auth）
- worker.js → Gemini API（AI 分析）
- 本地分析引擎（localAnalysis.ts）完全離線，不需要網路

---

## 二、功能截圖清單

### 首頁 `/`
**截圖重點**：
- Landing page 整體外觀
- 深色/淺色主題切換按鈕（右上角）
- 中/英語言切換按鈕（右上角）
- 三大功能入口卡片（健康分析、掃描、翻譯）
- 免責聲明 Modal（首次進入時出現）

**論文說明**：說明 UX 設計原則，免責聲明是醫療系統必要的法律保護。

---

### 健康自查入口 `/check`
**截圖重點**：
- 選擇「簡單自查」vs「詳細分析」的入口頁

---

### 簡單自查 `/check/simple`
**截圖重點**：
- 症狀 chips 多選介面（25 種症狀）
- 不適程度滑桿（0–10）
- 基本生命徵象輸入欄位（體溫、血壓、心跳等）
- AI 緊急度評估結果（四色等級：🔴🟠🟡🟢）

**論文說明**：
- 說明四級緊急度分類（立即就醫 / 盡快就診 / 一般門診 / 可自我觀察）
- AI 輸出明確不推薦藥物名稱（安全設計）
- 所有輸入不需帳號即可使用（降低使用門檻）

---

### 詳細分析 `/check/detail`
**截圖重點**：
- 頂部快速導航按鈕列（糖尿病、心血管、肝功能⋯，填入後顯示數字和顏色變化）
- 展開一個分類（例如「代謝功能」），顯示輸入框 + 即時正常/偏高/偏低判讀
- 分類標頭的「X 項已填」badge
- 本地分析結果卡片（正常X項、異常X項、風險標示）
- AI 深度分析結果（Gemini 生成的完整報告）

**論文說明**：
- **離線優先架構**：`localAnalysis.ts` 即時分析完全在本地執行，不需呼叫 API
- `referenceRanges.ts` 內建 30+ 種醫療參考值，含正常範圍、危急值、白話說明
- AI 為「補充層」而非核心依賴，Gemini API 配額用盡時本地分析仍可用

---

### 圖片掃描 `/scan`
**截圖重點**：
- 圖片上傳介面（拖曳 / 點擊 / 拍照）
- 上傳體檢報告圖後的 AI 分析結果（數值辨識 + 異常標示）
- 醫療翻譯功能（中英互譯）

**論文說明**：使用 Gemini Vision（multimodal），圖片以 Base64 傳送，Gemini 不長期儲存用戶資料。

---

### 藥物查詢 `/meds`
**截圖重點**：
- 搜尋框輸入中文/英文藥名
- 搜尋結果卡片（藥名、適應症、注意事項）

**論文說明**：資料來自 Supabase `medications` 資料表（30+ 種常用藥物種子資料）。

---

### 健康記錄 `/records`
**截圖重點**：
- 記錄列表（顯示 ☁️ 雲端 / 💾 本機 狀態）
- 展開一筆記錄的詳細內容
- 「一鍵同步至雲端」按鈕（未登入時有本機資料才出現）

**論文說明**：
- 未登入 → localStorage（資料主權在用戶端）
- 登入後 → Supabase（RLS 確保僅本人可讀寫）
- 一鍵遷移設計降低帳號登入的阻力

---

### 登入/註冊 `/auth/login` `/auth/register`
**截圖重點**：
- 登入頁面（Email + 密碼）
- 註冊頁面（含免責聲明 checkbox）

**論文說明**：使用 Supabase Auth，Email 驗證流程，callback 路由 `/auth/callback` 處理 token 交換。

---

### 個人設定 `/profile`
**截圖重點**：
- 名稱、性別、生日設定欄位
- 儲存成功提示

---

## 三、技術架構說明截圖

### Supabase Dashboard（可截給委員看）
- **Authentication** 頁面：顯示已有 N 位用戶
- **Table Editor → health_records**：顯示資料表結構
- **Table Editor → profiles**：顯示 role 欄位設計

### GitHub Actions
- **Actions 頁面**：顯示 `Deploy to Cloudflare Workers` 和 `Keep Supabase Alive` 兩個 workflow
- 點進一次成功的 Deploy workflow：顯示 build log（`OpenNext build complete` 和 `Deployed` 成功訊息）

### Cloudflare Workers Dashboard
- 顯示 Worker 名稱、URL、請求統計圖表

---

## 四、論文數據點（可在系統展示）

| 數據 | 在哪裡找 |
|------|---------|
| 支援醫療指標數量 | `src/lib/referenceRanges.ts`，REFERENCE_RANGES.length（約 30+ 項）|
| 藥物資料筆數 | Supabase → medications 表 count |
| AI 緊急度分級數 | 固定 4 級（程式碼中定義）|
| 症狀快選數量 | `/check/simple` 頁面的 SYMPTOMS 陣列長度（25 種）|
| 支援語言數 | 2（中文 / 英文，`src/lib/i18n.ts`）|

---

## 五、論文架構建議段落對應

| 論文章節 | 對應截圖/說明 |
|---------|-------------|
| 系統設計 | 架構圖、技術棧表格 |
| 功能實作 | 各頁面截圖 + 說明 |
| 安全設計 | RLS 說明、API Key 保護、免責聲明 |
| 離線優先 | localAnalysis.ts 設計、無網路可用截圖 |
| AI 整合 | Gemini API 代理設計、四色分級截圖 |
| 部署架構 | GitHub Actions log、Cloudflare Workers 截圖 |
| 資料隱私 | localStorage vs Supabase 雙層設計 |
