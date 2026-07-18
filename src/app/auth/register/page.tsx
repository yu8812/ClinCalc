"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Eye, EyeOff, AlertCircle, Mail, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("兩次密碼不一致"); return; }
    if (form.password.length < 8) { setError("密碼至少需要 8 個字元"); return; }
    if (!agreed) { setError("請閱讀並同意免責聲明"); return; }
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { name: form.name },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
    if (err) {
      setError(err.message.includes("already registered") ? "此電子郵件已被註冊" : err.message);
      setLoading(false);
    } else {
      // update profile name
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.from("profiles").update({ name: form.name }).eq("id", user.id);
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="card p-8 text-center max-w-sm w-full">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(0,212,170,0.1)" }}>
          <Mail size={28} style={{ color: "var(--accent)" }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>確認您的電子郵件</h2>
        <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
          我們已發送確認信至 <strong>{form.email}</strong>，請點擊信中的連結完成驗證。
        </p>
        <Link href="/auth/login" className="btn-primary w-full justify-center">前往登入</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg mx-auto mb-3"
            style={{ background: "var(--accent)", color: "#000" }}>
            C+
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            建立帳號
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Create your ClinCalc account
          </p>
        </div>

        <div className="card p-6">
          <form onSubmit={submit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--text-primary)" }}>
                姓名 / Name
              </label>
              <input type="text" required className="input-field"
                placeholder="您的姓名" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--text-primary)" }}>
                電子郵件 / Email
              </label>
              <input type="email" required className="input-field"
                placeholder="your@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--text-primary)" }}>
                密碼 / Password
              </label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} required className="input-field pr-10"
                  placeholder="至少 8 個字元" value={form.password} onChange={(e) => set("password", e.target.value)} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-secondary)" }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm */}
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--text-primary)" }}>
                確認密碼 / Confirm Password
              </label>
              <input type={showPw ? "text" : "password"} required className="input-field"
                placeholder="再輸入一次密碼" value={form.confirm} onChange={(e) => set("confirm", e.target.value)}
                style={{ borderColor: form.confirm && form.confirm !== form.password ? "rgba(239,68,68,0.5)" : undefined }} />
            </div>

            {/* Disclaimer checkbox */}
            <div className="p-3 rounded-lg" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  本平台提供之所有資訊及 AI 分析結果，僅供一般健康參考之用，不得作為醫療診斷或治療依據。緊急狀況請撥打 119。
                </p>
              </div>
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                  className="w-4 h-4 rounded" />
                <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                  我已閱讀並同意上述免責聲明
                </span>
              </label>
            </div>

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
                  <UserPlus size={15} />
                  建立帳號 / Register
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>已有帳號？</span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          <Link href="/auth/login" className="btn-ghost w-full justify-center text-sm">
            返回登入 / Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
