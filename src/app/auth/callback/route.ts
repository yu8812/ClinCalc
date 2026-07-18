import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { safeInternalPath } from "@/lib/safeRedirect";

// PKCE code 交換（主要用於 password recovery 的 callback）。
// SEC001D-05：require code、檢查 exchange error、next 只允許站內路徑，fail closed。
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeInternalPath(searchParams.get("next"), "/dashboard");

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/auth/login?error=verification_failed`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
