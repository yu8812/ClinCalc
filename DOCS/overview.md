# ClinCalc — 專案概覽

## 是什麼

ClinCalc（精準計算臨床決策平台）是一個面向一般民眾的醫療健康自查網站。
使用者無需帳號即可使用核心功能，登入後可同步雲端記錄。

目標：讓普通人能快速理解自己的體檢數值，並知道何時需要就醫。

## 技術棧

| 層面 | 技術 |
|------|------|
| 前端框架 | Next.js 16.2.4 + TypeScript |
| 樣式 | Tailwind CSS v4 + CSS 變數系統 |
| 動畫 | Framer Motion |
| 資料庫 / 認證 | Supabase (PostgreSQL + Auth + RLS) |
| AI | Google Gemini API (gemini-2.5-flash) |
| 部署 | Cloudflare Pages + @opennextjs/cloudflare |
| 國際化 | 自建 LanguageContext（中/英） |
| 主題 | 自建 ThemeContext（深/淺色） |

## 帳號與倉庫

| 項目 | 位置 |
|------|------|
| GitHub 倉庫 | RO883C/ClinCalc |
| Supabase 組織 | RO883C's Org（Tokyo，Nano plan）|
| Cloudflare Pages | 連接 RO883C/ClinCalc，`main` branch |

## 兩個專案計畫

| 專案 | 倉庫 | 對象 | 說明 |
|------|------|------|------|
| ClinCalc | RO883C/ClinCalc | 一般民眾 | 現在開發中 |
| ExClinCalc | RO883C/exclincalc | 醫師 / 進階版 | 未來開發，共用同一個 Supabase DB |

共用同一個 Supabase 資料庫，透過 `profiles.role` 欄位（user/doctor/admin）做角色權限區分。

## 設計原則

1. **離線優先**：本地參考值資料庫 + 本地分析引擎，無網路可執行基本分析
2. **AI 輔助**：Gemini API 為補充層，非核心依賴
3. **資料主權**：未登入存 localStorage，登入後一鍵同步 Supabase
4. **免責優先**：所有 AI 輸出明確標示非醫療診斷，不推薦藥物名稱
