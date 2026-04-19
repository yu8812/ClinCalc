import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const MAX_TEXT_LENGTH = 8000;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB in base64 chars ≈ 13.3M

// In-memory rate limiter: max 10 requests / user / minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

const SYSTEM_PROMPT = `你是 ClinCalc 的 AI 健康助理，名字叫「小C」。幫助一般民眾理解健康數據、翻譯醫療文件、分析體檢報告。

核心原則：
1. 所有分析僅供參考，不構成醫療診斷或處方建議
2. 如有異常數值或嚴重症狀，必須建議就醫
3. 用淺顯易懂的語言，避免過度術語
4. 每次回應結尾加上：「⚠️ 本回應為 AI 參考資訊，不構成醫療診斷，如有疑慮請諮詢醫師。」
5. 不得提供具體藥物劑量建議或診斷結論`;

export async function POST(req: NextRequest) {
  // Content-Type check
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "INVALID_CONTENT_TYPE" }, { status: 400 });
  }

  // Auth check — must be logged in to use AI
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "請先登入帳號才能使用 AI 分析功能" },
        { status: 401 }
      );
    }
    // Per-user rate limit: 10 requests / minute
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "請求過於頻繁，請等待 1 分鐘後再試" },
        { status: 429 }
      );
    }
  } catch {
    return NextResponse.json({ error: "AUTH_ERROR", message: "驗證失敗，請重新整理頁面" }, { status: 500 });
  }

  // API key check
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "NO_API_KEY", message: "Gemini API Key 尚未設定，請聯絡管理員" },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const { type, text, imageBase64, imageMimeType, question, direction } = body as {
    type?: string;
    text?: string;
    imageBase64?: string;
    imageMimeType?: string;
    question?: string;
    direction?: string;
  };

  // Validate type
  if (!["analyze", "translate", "scan"].includes(type || "")) {
    return NextResponse.json({ error: "INVALID_TYPE" }, { status: 400 });
  }

  // Validate input sizes
  if (text && text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: "TEXT_TOO_LONG", message: "文字超過長度限制" }, { status: 400 });
  }
  if (imageBase64 && imageBase64.length > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: "IMAGE_TOO_LARGE", message: "圖片超過 10MB 限制" }, { status: 400 });
  }

  // Validate allowed MIME types
  const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (imageMimeType && !allowedMimes.includes(imageMimeType)) {
    return NextResponse.json({ error: "INVALID_MIME_TYPE" }, { status: 400 });
  }

  // Helper: call Gemini with retry on 503
  async function callWithRetry(fn: () => Promise<string>, retries = 2): Promise<string> {
    for (let i = 0; i <= retries; i++) {
      try { return await fn(); }
      catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("503") && i < retries) {
          await new Promise(r => setTimeout(r, 2000 * (i + 1)));
          continue;
        }
        throw e;
      }
    }
    throw new Error("Max retries exceeded");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let prompt = "";

    if (type === "analyze") {
      if (!text?.trim()) return NextResponse.json({ error: "EMPTY_INPUT" }, { status: 400 });
      prompt = `${SYSTEM_PROMPT}\n\n用戶提供的健康資訊：\n${text}\n\n請分析並給出易懂的健康建議。`;
      const result = await callWithRetry(() => model.generateContent(prompt).then(r => r.response.text()));
      return NextResponse.json({ result });

    } else if (type === "translate") {
      if (!text?.trim()) return NextResponse.json({ error: "EMPTY_INPUT" }, { status: 400 });
      const dir = direction === "zh2en"
        ? "將以下繁體中文醫療文字精確翻譯為英文，並提供重要醫學術語中英對照表。"
        : "Translate the following English medical text to Traditional Chinese. Provide a glossary of important medical terms.";
      prompt = `${SYSTEM_PROMPT}\n\n${dir}\n\n原文：\n${text}`;
      const result = await callWithRetry(() => model.generateContent(prompt).then(r => r.response.text()));
      return NextResponse.json({ result });

    } else if (type === "scan") {
      if (!imageBase64 || !imageMimeType) {
        return NextResponse.json({ error: "MISSING_IMAGE" }, { status: 400 });
      }
      const q = typeof question === "string" && question.trim()
        ? question.trim()
        : "請分析報告內容，列出所有數值，標示異常項目，並用一般人看得懂的語言解釋，最後提出建議。";
      prompt = `${SYSTEM_PROMPT}\n\n用戶問題：${q}\n\n請分析上傳的醫療文件圖片。`;
      const result = await callWithRetry(() =>
        model.generateContent([
          { text: prompt },
          { inlineData: { mimeType: imageMimeType, data: imageBase64 } },
        ]).then(r => r.response.text())
      );
      return NextResponse.json({ result });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Gemini API error]", msg);
    if (msg.includes("429") || msg.includes("quota") || msg.includes("Too Many")) {
      return NextResponse.json(
        { error: "QUOTA_EXCEEDED", message: "API 配額已達上限，請稍後再試（免費版每分鐘限 15 次）" },
        { status: 429 }
      );
    }
    if (msg.includes("API_KEY_INVALID") || msg.includes("400")) {
      return NextResponse.json(
        { error: "INVALID_KEY", message: "API Key 無效，請檢查設定" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "GEMINI_ERROR", message: "AI 處理失敗，請稍後再試" },
      { status: 500 }
    );
  }
}
