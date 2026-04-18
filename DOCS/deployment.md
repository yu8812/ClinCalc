# ClinCalc — 部署與 CI/CD

## 部署平台：Cloudflare Pages

| 設定項目 | 值 |
|---------|-----|
| 平台 | Cloudflare Pages |
| GitHub 倉庫 | RO883C/ClinCalc |
| Branch | main |
| Build command | `npx opennextjs-cloudflare build` |
| Build output directory | `.open-next/assets` |
| Next.js adapter | `@opennextjs/cloudflare` v1.19.1 |
| Wrangler | v4.83.0 |

## 為何選 Cloudflare Pages

| 比較項目 | Cloudflare Pages | Vercel | Netlify（已放棄）|
|---------|-----------------|--------|-----------------|
| 免費頻寬 | 無限制 | 100GB/月 | Credit 制（隨時停服）|
| 商業使用 | 允許 | 限制 | 限制 |
| Next.js 16 支援 | @opennextjs | 原生 | 不穩定 |
| Rate Limiting | 基礎設施層 | 需自建 | 需自建 |
| 私密倉庫 | 支援 | 支援 | 支援 |

## 環境變數設定

在 Cloudflare Pages → Settings → Environment variables 設定：

| 變數 | 說明 |
|------|------|
| `GEMINI_API_KEY` | Google Gemini API Key（Server only）|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL（`https://hsdysyoowfakdogevtdh.supabase.co`）|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key（在 Supabase → Settings → API 取得）|

## wrangler.toml

```toml
name = "clincalc"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".open-next/assets"

[vars]
NEXT_PUBLIC_SUPABASE_URL = ""
NEXT_PUBLIC_SUPABASE_ANON_KEY = ""
```

敏感變數（GEMINI_API_KEY）必須在 Cloudflare 後台設定，不放進 wrangler.toml。

## 本地開發指令

```bash
npm run dev           # 啟動開發伺服器 http://localhost:3000
npm run build         # 標準 Next.js build（檢查型別錯誤）
npm run cf:build      # Cloudflare build（opennextjs-cloudflare build）
npm run cf:preview    # 本地預覽 Cloudflare 版本
npm run cf:deploy     # 手動部署至 Cloudflare
npm run lint          # ESLint 程式碼品質
npx tsc --noEmit      # TypeScript 型別檢查
```

## Edge Runtime

`src/app/api/gemini/route.ts` 頂部需有：

```ts
export const runtime = 'edge'
```

Cloudflare Pages 使用 Edge Runtime，不支援部分 Node.js API，因此 rate limiter（使用 Map）已移除，改由 Cloudflare Rate Limiting 在基礎設施層處理。

## Cloudflare Rate Limiting 設定（待完成）

部署完成後，在 Cloudflare 後台設定：
- 路徑：`/api/gemini`
- 限制：依需求設定 requests/minute per IP

## GitHub Actions

### keep-alive.yml

- 觸發：每 3 天自動執行（防止 Supabase free tier 暫停）
- 功能：呼叫 Supabase REST API ping 資料庫
- 需要 GitHub Secrets：
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY`（Service Role Key，非 anon key）

設定路徑：RO883C/ClinCalc → Settings → Secrets and variables → Actions

## Supabase 設定

| 項目 | 值 |
|------|-----|
| 組織 | RO883C's Org |
| 專案 | RO883C's Project |
| 地區 | Northeast Asia (Tokyo) |
| Plan | Nano（免費）|
| URL | `https://hsdysyoowfakdogevtdh.supabase.co` |

Supabase Auth → URL Configuration：
- Site URL：設為 Cloudflare Pages 的正式網址
- Redirect URLs：加入 `{SITE_URL}/auth/callback`
