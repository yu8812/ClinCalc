# ClinCalc — 精準計算臨床決策平台

面向一般民眾的醫療健康自查網站。輸入體檢數值或症狀，獲得 AI 輔助的健康解讀與就醫建議。

## 技術棧

- **Next.js 16.2.4** + TypeScript + Tailwind CSS v4
- **Supabase**（PostgreSQL + Auth + RLS）
- **Google Gemini API**（gemini-2.5-flash）
- **Cloudflare Pages**（@opennextjs/cloudflare）

## 文件

| 文件 | 說明 |
|------|------|
| [DOCS/overview.md](DOCS/overview.md) | 專案概覽、技術棧、帳號資訊 |
| [DOCS/architecture.md](DOCS/architecture.md) | 系統架構、目錄結構、資料庫結構 |
| [DOCS/pages.md](DOCS/pages.md) | 頁面地圖與功能詳細說明 |
| [DOCS/deployment.md](DOCS/deployment.md) | 部署流程、環境變數、CI/CD |
| [DOCS/todo.md](DOCS/todo.md) | 待辦事項與已完成清單 |
| [DOCS/notes.md](DOCS/notes.md) | 注意事項、安全設計、踩坑紀錄 |

## 本地開發

```bash
npm install
npm run dev        # http://localhost:3000
```

需要 `.env.local`：

```
GEMINI_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Cloudflare Pages 部署

```bash
npm run cf:build      # Cloudflare build
npm run cf:preview    # 本地預覽
npm run cf:deploy     # 手動部署
```
