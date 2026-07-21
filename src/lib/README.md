# `src/lib/` — 判讀引擎與共用邏輯

| 檔案 | 用途 |
|---|---|
| `referenceRanges.ts` | **核心知識庫**：35 項指標中英名、單位、男女參考區間、健康解讀、來源指引（KDIGO 2024 / ADA / ACC-AHA） |
| `localAnalysis.ts` | 本地判讀引擎：`checkAbnormal()` 判定正常/偏高/偏低 |
| `healthStore.ts` | 個人健康記錄存取 |
| `medReminders.ts` | 用藥提醒排程（本地通知） |
| `i18n.ts` | 中英雙語字串 |
| `renderMarkdown.tsx` | Markdown 渲染 |
| `supabase.ts` / `supabase-server.ts` | Supabase client |
| `safeRedirect.ts` | 擋 open-redirect / `javascript:` XSS |
| `rateLimit.ts` / `utils.ts` | 速率限制 / 工具 |

策略：**先查知識庫、再交給 LLM**——前端先用 `referenceRanges` + `localAnalysis` 得出結構化判定，才組 prompt 給 Gemini。
