# `src/` — ClinCalc 民眾端原始碼

| 子目錄 | 用途 |
|---|---|
| `app/` | Next.js App Router：頁面、API routes、auth |
| `lib/` | 判讀引擎、知識庫、Supabase client、i18n… |
| `components/` | 共用 UI 元件（Navbar、Disclaimer、提醒排程…） |
| `contexts/` | React Context：主題（明/暗）、語言（中/英） |

核心理念：**35 項指標判讀全在瀏覽器本地完成**，原始數值不離開裝置；AI 只接結構化結果。
