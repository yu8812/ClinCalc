# ClinCalc — 部署與 CI/CD

## 部署架構（最終版）

| 設定項目 | 值 |
|---------|-----|
| 平台 | Cloudflare Workers（非 Pages）|
| GitHub 倉庫 | RO883C/ClinCalc |
| Branch | main |
| CI/CD | GitHub Actions（`.github/workflows/deploy.yml`）|
| Next.js adapter | `@opennextjs/cloudflare` v1.19.1 |
| Wrangler | v4.83.0 |

> ⚠️ **注意**：`@opennextjs/cloudflare` 設計給 Cloudflare **Workers**，不是 Pages。
> 使用 `pages_build_output_dir` 的 Pages 模式只上傳靜態資產，Worker 無法運作。

## 為何選 Cloudflare Workers

| 比較項目 | Cloudflare Workers | Vercel | Netlify（已放棄）|
|---------|-------------------|--------|-----------------|
| 免費頻寬 | 無限制 | 100GB/月 | Credit 制（ClinCalc 曾被停服）|
| 商業使用 | 允許 | 限制 | 限制 |
| Next.js 16 支援 | @opennextjs/cloudflare | 原生 | 不穩定 |
| Edge Runtime | ✓ | ✓ | 不穩定 |
| 自動部署 | GitHub Actions | 原生 Git 整合 | 原生 Git 整合 |

## wrangler.toml（Workers 模式）

```toml
name = "clincalc"
main = ".open-next/worker.js"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

[assets]
directory = ".open-next/assets"
binding = "ASSETS"
```

## 環境變數

### Build time（GitHub Actions Secrets）
Next.js 在 build 時會把 `NEXT_PUBLIC_*` 嵌入靜態資產，所以需要在 GitHub Actions 環境中設定：

| GitHub Secret | 說明 |
|------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token（Edit Workers 權限）|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

### Runtime（Cloudflare Workers 後台）
在 Cloudflare → Workers & Pages → clincalc → Settings → Variables and Secrets：

| 變數 | 說明 |
|------|------|
| `GEMINI_API_KEY` | Google Gemini API Key（只在 server 端讀取，不可加 NEXT_PUBLIC_）|

### Keep-alive（GitHub Actions Secrets，keep-alive.yml 用）

| GitHub Secret | 說明 |
|------|------|
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service_role key |

## CI/CD 流程

```
git push main
    ↓
GitHub Actions: deploy.yml
    ↓
npm ci
    ↓
npx opennextjs-cloudflare build   ← Next.js build + Cloudflare adapter
    ↓
npx opennextjs-cloudflare deploy  ← wrangler deploy 到 Cloudflare Workers
    ↓
https://<worker-name>.<account>.workers.dev
```

## 本地開發指令

```bash
npm run dev           # 啟動開發伺服器 http://localhost:3000
npm run build         # 標準 Next.js build（型別/錯誤檢查）
npm run cf:build      # Cloudflare build（opennextjs-cloudflare build）
npm run cf:preview    # 本地預覽 Cloudflare 版本
npm run lint          # ESLint
npx tsc --noEmit      # TypeScript 型別檢查
```

## Supabase 設定

| 項目 | 值 |
|------|-----|
| 組織 | RO883C's Org |
| 地區 | Northeast Asia (Tokyo) |
| Plan | Nano（免費）|

Supabase Auth → URL Configuration：
- Site URL：設為 Worker 正式網址
- Redirect URLs 需包含：`{SITE_URL}/auth/callback`

## 已知踩坑

1. **@cloudflare/next-on-pages 不支援 Next.js 16** → 必須用 @opennextjs/cloudflare
2. **@opennextjs/cloudflare 設計給 Workers 不是 Pages** → `pages_build_output_dir` 只上傳靜態檔，Worker 根本不跑
3. **package-lock.json 與 npm 版本差異** → 本機 npm 11 vs CI npm 10，`@swc/helpers` 版本衝突，需加為 devDependency
4. **open-next.config.ts 缺失** → CI 環境無互動式輸入，build 直接失敗退出
5. **wrangler.toml [vars] 空字串** → 會蓋掉 Cloudflare dashboard 設定的環境變數
