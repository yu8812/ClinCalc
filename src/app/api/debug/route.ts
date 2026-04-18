import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  return NextResponse.json({
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    keyPrefix: process.env.GEMINI_API_KEY?.slice(0, 8) ?? "undefined",
    nodeEnv: process.env.NODE_ENV,
  });
}
