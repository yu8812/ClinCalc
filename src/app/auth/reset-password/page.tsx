"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, CheckCircle, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("兩次輸入的密碼不一致");
      return;
    }
    if (password.length < 8) {
      setError("密碼至少需要 8 個字元");
      return;
    }
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      setDone(true);
      setTimeout(() => router.push("/dashboard"), 2500);
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
            設定新密碼
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Set a new password
          </p>
        </div>

        <div className="card p-6">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle size={40} className="mx-auto mb-3" style={{ color: "#22c55e" }} />
              <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                密碼已更新
              </p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                即將跳轉至首頁…
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {/* New password */}
              <div>
                <label className="text-sm font-medium block mb-1.5"
                  style={{ color: "var(--text-primary)" }}>
                  新密碼 / New Password
                </label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-secondary)" }} />
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    className="input-field pl-9 pr-10"
                    placeholder="至少 8 個字元"
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

              {/* Confirm */}
              <div>
                <label className="text-sm font-medium block mb-1.5"
                  style={{ color: "var(--text-primary)" }}>
                  確認密碼 / Confirm Password
                </label>
                <input
                  type={showPw ? "text" : "password"}
                  required
                  className="input-field"
                  placeholder="再次輸入新密碼"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
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
                ) : "更新密碼"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
