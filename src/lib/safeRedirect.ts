// 只允許站內相對路徑，避免 open redirect 與 javascript: URL XSS（SEC001D-05）。
// 回傳安全的站內路徑，或在不安全時回退到 fallback。
export function safeInternalPath(raw: string | null | undefined, fallback = "/"): string {
  if (!raw) return fallback;
  // 必須是單一斜線開頭的站內路徑；擋掉 //host、\\、絕對 URL、javascript: 等
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  // 不允許控制字元或協定樣式
  if (/[\x00-\x1f]/.test(raw) || /^\/?\s*[a-z]+:/i.test(raw)) return fallback;
  return raw;
}
