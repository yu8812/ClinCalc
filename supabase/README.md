# `supabase/` — 資料庫 schema（民眾端）

民眾端使用的資料表定義。與醫事端 ExClinCalc **共用同一份 Supabase**；完整的安全 migration（RLS / MFA / 角色矩陣）集中在 ExClinCalc 的 `supabase/migrations/`。

民眾端主要表：`health_records`、`patient_consents`、`medications`、`medical_references`。個人健康記錄以 RLS 綁 `auth.uid()`，僅本人與經一次性同意書授權的醫師可讀。
