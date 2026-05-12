# Contributing to ClinCalc

歡迎貢獻！本專案是研究與學習用途，所有合理的改進都歡迎。

## 在貢獻之前

- 本專案是銘傳大學生物醫學工程學系專題研究的延伸
- 目前由作者一人維護
- 重大改動請先開 issue 討論，避免做白工

## 怎麼貢獻

### 報告 bug

1. 確認 issue 還沒被回報過（搜尋現有 issues）
2. 開新 issue，使用 bug template
3. 提供：
   - 重現步驟
   - 期待行為 vs 實際行為
   - 瀏覽器 / OS 環境
   - Console 錯誤訊息（如有）

### 提出新功能

1. 開新 issue，使用 feature request template
2. 說明：
   - 解決什麼問題
   - 預期使用者場景
   - 是否會影響現有 RLS 設計

### 提交 Pull Request

1. Fork 本 repo
2. Create branch：`git checkout -b feature/your-feature` 或 `fix/your-fix`
3. 修改 + 測試（手動或自動）
4. Commit：訊息建議用 [Conventional Commits](https://www.conventionalcommits.org/)：
   - `feat: 加入新功能 X`
   - `fix: 修正 Y bug`
   - `docs: 更新 README`
   - `refactor: 重構 Z 模組`
   - `test: 補上 X 測試`
5. Push 到你的 fork
6. 開 PR 到 main

PR 描述請包含：

- 解決的問題（連結到 issue 編號）
- 主要改動點
- 測試方式
- 截圖（如為 UI 改動）

## 開發環境

### 前置需求

- Node.js 22+
- 一個 Supabase 專案（免費 tier 即可）
- 一個 Google AI Studio API Key

### 本地啟動

```bash
git clone https://github.com/RO883C/clincalc.git
cd clincalc
npm install
cp .env.local.example .env.local  # 填入你的 keys
npm run dev                        # macOS/Linux
npx next dev --webpack             # Windows
```

詳細設定見 [README.md](README.md#本地開發)。

## 程式碼風格

- **TypeScript strict mode**：所有新檔案必須通過型別檢查
- **ESLint**：commit 前跑 `npm run lint`
- **Prettier**：commit 前跑 `npm run format`
- **檔案命名**：
  - React component: `PascalCase.tsx`
  - utility: `camelCase.ts`
  - API route: 依 Next.js App Router 規範

## 測試

```bash
# 跑所有測試
npm test

# 跑特定測試
npm test -- --grep "KDIGO"
```

新功能請附上測試。修 bug 請附上重現該 bug 的測試。

## 安全性貢獻

請看 [SECURITY.md](SECURITY.md)。**漏洞請以 email 通報，不要開 public issue**。

## 不接受的貢獻

- **改動 RLS policy 的 PR**（這是核心安全層，要本人審慎評估）
- **改動 Gemini prompt 結構**（這影響整體 AI 行為）
- **加入會洩漏個資的 features**（如把資料上傳到第三方）
- **加入打廣告 / SEO 操作**

## 行為準則

簡單規則：

- 互相尊重
- 對事不對人
- 不接受任何形式的歧視或騷擾
- 出現衝突時 → 我來協調

## 授權

提交 PR 即同意你的貢獻以 MIT License 發佈。

---

## 聯絡

有問題 / 想討論：

📧 yuyulsc881209@icloud.com
🌐 [GitHub: @RO883C](https://github.com/RO883C)

謝謝你考慮貢獻！
