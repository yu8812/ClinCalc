# Security Policy

> ClinCalc 處理的是個人健康資料。安全性是核心設計原則，不是可選 feature。

## Reporting Vulnerabilities

如果你發現潛在漏洞，**請不要在 GitHub 開 public issue**。

請以 email 通報：**yuyulsc881209@icloud.com**

我會在 **7 個工作天**內回應。如果問題嚴重（例如可能洩漏使用者資料），我會在 24 小時內回應並先把修補補丁部署上線。

通報請附：

- 漏洞描述（一段話即可）
- 重現步驟（如果可以）
- 影響範圍評估（你認為可能洩漏什麼）
- 你的聯絡方式（如果你希望被公開致謝）

## Implemented Security Measures

ClinCalc 在多個層級實作安全控制：

### 應用層

- **本地優先判讀**：45 項體檢指標的判讀邏輯**完全在瀏覽器執行**，原始檢驗數值不上傳第三方
- **HTTPS only**：透過 Cloudflare Workers 強制 HTTPS
- **CSP headers**：限制可載入的外部資源
- **無 client-side AI key**：所有 Gemini 呼叫透過後端代理

### 資料庫層

- **PostgreSQL Row Level Security**：所有讀寫個人資料的 query 自動套用 RLS policy
- **JWT-based authentication**：使用者身份由 Supabase Auth 簽發 JWT
- **Service role key 隔離**：`SUPABASE_SERVICE_ROLE_KEY` 僅在 server-side 使用，不暴露於前端

### Repository 層

- **Secret Scanning**：GitHub 啟用，commit 含密鑰會立刻被 block
- **Push Protection**：阻止意外 commit secrets
- **Dependabot**：自動偵測依賴漏洞並開 PR
- **Branch Protection**：main 分支需通過 CI 才能 merge

## What's Not in Scope

- **使用者裝置安全**（如使用者瀏覽器被 malware 感染）── 我們無法防禦
- **第三方服務的漏洞**（如 Supabase 或 Cloudflare 自身）── 由各服務商負責
- **使用者自願分享的資料**（例如使用者把自己的健康記錄截圖貼到社群）── 屬於使用者責任

## Disclosure Policy

我採用 **coordinated disclosure**：

1. 你回報 → 我確認 + 修補
2. 修補部署上線
3. 與你協調公開時間（通常修補後 30 天）
4. 公開漏洞細節 + 致謝（如你願意）

## Acknowledgments

感謝負責任的安全研究者讓 ClinCalc 更安全。回報過漏洞的研究者會列在這裡（除非你選擇匿名）：

_目前無公開回報紀錄。_

---

最後更新：2026-05-08
