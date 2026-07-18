import { NextRequest, NextResponse } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase-server";

// 共用 Supabase Auth 專案下，ClinCalc（民眾端）自己的 email 確認落點。
// 註冊時 emailRedirectTo 帶本站 /auth/confirm，信件模板用 {{ .RedirectTo }}，
// 因此民眾在 ClinCalc 註冊、點驗證信會回到民眾端，而非被導去醫事端。

function safeNext(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/auth/login?error=invalid_link`);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) {
    return NextResponse.redirect(`${origin}/auth/login?error=verification_failed`);
  }

  // 民眾端驗證成功即可使用，導向 dashboard（或指定的安全 next）。
  return NextResponse.redirect(`${origin}${next ?? "/dashboard"}`);
}
