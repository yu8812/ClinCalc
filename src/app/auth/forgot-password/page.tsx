"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg mx-auto mb-3"
            style={{ background: "var(--accent)", color: "#000" }}>
            C+
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            忘記密碼
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Reset your password
          </p>
        </div>

        <div className="card p-6">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle size={40} className="mx-auto mb-3" style={{ color: "#22c55e" }} />
              <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                重設信已寄出
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                請檢查 <span style={{ color: "var(--text-primary)" }}>{email}</span> 的收件匣，點擊信中連結重設密碼。
              </p>
              <p className="text-xs mt-3" style={{ color: "var(--text-secondary)" }}>
                沒收到？請確認 Email 是否正確，或檢查垃圾郵件。
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                輸入你的帳號 Email，我們會寄送密碼重設連結。
              </p>

              <div>
                <label className="text-sm font-medium block mb-1.5"
                  style={{ color: "var(--text-primary)" }}>
                  電子郵件 / Email
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-secondary)" }} />
                  <input
                    type="email"
                    required
                    className="input-field pl-9"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg text-sm"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)" }}>
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center"
                style={{ opacity: loading ? 0.7 : 1 }}>
                {loading ? (
                  <>
                    <span className="loading-dot" />
                    <span className="loading-dot" style={{ animationDelay: "0.2s" }} />
                    <span className="loading-dot" style={{ animationDelay: "0.4s" }} />
                  </>
                ) : "發送重設連結"}
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-4">
          <Link href="/auth/login"
            className="inline-flex items-center gap-1.5 text-sm"
            style={{ color: "var(--text-secondary)" }}>
            <ArrowLeft size={14} />
            返回登入
          </Link>
        </div>
      </div>
    </div>
  );
}
