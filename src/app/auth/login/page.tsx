"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Eye, EyeOff, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { safeInternalPath } from "@/lib/safeRedirect";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [next, setNext] = useState("/dashboard");
  const [notice, setNotice] = useState<{ ok: boolean; msg: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // SEC001D-05：只接受站內路徑，避免 open redirect / javascript: XSS
    setNext(safeInternalPath(params.get("next"), "/dashboard"));
    // SEC001D-06：顯示信箱驗證結果
    if (params.get("verified") === "1") setNotice({ ok: true, msg: "信箱已驗證成功，請登入。" });
    else {
      const e = params.get("error");
      if (e === "verification_failed") setNotice({ ok: false, msg: "驗證連結無效或已過期，請重新註冊或索取新驗證信。" });
      else if (e === "invalid_link") setNotice({ ok: false, msg: "驗證連結不完整，請點擊信中完整連結。" });
      else if (e === "missing_code") setNotice({ ok: false, msg: "驗證流程有誤，請重新操作。" });
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message.includes("Invalid login") ? "電子郵件或密碼錯誤" : err.message);
      setLoading(false);
    } else {
      router.push(next);
      router.refresh();
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg mx-auto mb-3"
            style={{ background: "var(--brand)", color: "var(--on-brand)" }}>
            C+
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            登入帳號
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Sign in to your ClinCalc account
          </p>
        </div>

        <div className="card p-6">
          <form onSubmit={submit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-sm font-medium block mb-1.5"
                style={{ color: "var(--text-primary)" }}>
                電子郵件 / Email
              </label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}>
                  密碼 / Password
                </label>
                <Link href="/auth/forgot-password"
                  className="text-xs"
                  style={{ color: "var(--accent)" }}>
                  忘記密碼？
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  className="input-field pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-secondary)" }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* URL notice（驗證結果） */}
            {notice && !error && (
              <div className="flex items-center gap-2 p-3 rounded-lg text-sm"
                style={notice.ok
                  ? { background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", color: "#16a34a" }
                  : { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)" }}>
                <AlertCircle size={14} />
                {notice.msg}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg text-sm"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)" }}>
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center"
              style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? (
                <>
                  <span className="loading-dot" />
                  <span className="loading-dot" style={{ animationDelay: "0.2s" }} />
                  <span className="loading-dot" style={{ animationDelay: "0.4s" }} />
                </>
              ) : (
                <>
                  <LogIn size={15} />
                  登入 / Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>還沒有帳號？</span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          <Link href="/auth/register"
            className="btn-ghost w-full justify-center text-sm">
            立即註冊 / Create Account
          </Link>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs mt-4 leading-relaxed"
          style={{ color: "var(--text-secondary)" }}>
          登入即表示您同意我們的
          <Link href="/about" className="mx-1 underline" style={{ color: "var(--accent)" }}>
            使用條款與免責聲明
          </Link>
        </p>
      </div>
    </div>
  );
}
