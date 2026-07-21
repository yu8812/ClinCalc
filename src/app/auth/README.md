# `src/app/auth/` — 認證（民眾端）

| 目錄 | 用途 |
|---|---|
| `login` / `register` | 帳密登入 / 註冊（`safeInternalPath` 擋 open-redirect） |
| `forgot-password` / `reset-password` | 密碼重設 |
| `callback` / `confirm` | OAuth / email 驗證回呼 |

民眾端為一般帳號（`is_pro=false`），無需 MFA；醫事人員請用 ExClinCalc Pro。
