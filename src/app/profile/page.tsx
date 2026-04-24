"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, LogOut, Check, AlertCircle, Shield, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Profile {
  name: string;
  gender: "M" | "F" | "";
  date_of_birth: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>({ name: "", gender: "", date_of_birth: "" });
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [consents, setConsents] = useState<Array<{ consent_id: string; doctor_name: string; institution: string | null; doctor_role: string | null; granted_at: string }>>([]);

  useEffect(() => {
    const supabase = createClient();

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setEmail(user.email ?? "");

      const { data } = await supabase
        .from("profiles")
        .select("name, gender, date_of_birth")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile({
          name: data.name ?? "",
          gender: data.gender ?? "",
          date_of_birth: data.date_of_birth ?? "",
        });
      }

      const { data: consentData } = await supabase.rpc("get_my_consents");
      setConsents(consentData || []);
      setLoading(false);
    };

    init();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: err } = await supabase
      .from("profiles")
      .update({
        name: profile.name.trim() || null,
        gender: profile.gender || null,
        date_of_birth: profile.date_of_birth || null,
      })
      .eq("id", user.id);

    setSaving(false);
    if (err) {
      setError("儲存失敗：" + err.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const handleRevoke = async (consentId: string) => {
    if (!confirm("確定撤銷此醫師的查看授權？")) return;
    const supabase = createClient();
    await supabase.rpc("revoke_consent", { p_consent_id: consentId });
    setConsents(prev => prev.filter(c => c.consent_id !== consentId));
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="loading-dot"
              style={{ animationDelay: `${i * 0.2}s`, background: "var(--accent)" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold"
          style={{ background: "var(--accent)", color: "#000" }}>
          {profile.name?.charAt(0)?.toUpperCase() || email.charAt(0).toUpperCase() || "U"}
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            個人設定
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{email}</p>
        </div>
      </div>

      {/* Form */}
      <div className="card p-5 space-y-5">
        {/* 姓名 */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
            顯示名稱
          </label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            placeholder="輸入你的名字"
            className="input-field w-full"
          />
        </div>

        {/* 性別 */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
            性別 <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>
              （影響健康數值參考範圍）
            </span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["M", "F", ""] as const).map((val) => {
              const label = val === "M" ? "男" : val === "F" ? "女" : "不設定";
              const active = profile.gender === val;
              return (
                <button key={val}
                  onClick={() => setProfile({ ...profile, gender: val })}
                  className="py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: active ? "var(--accent)" : "var(--bg-base)",
                    color: active ? "#000" : "var(--text-secondary)",
                    border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                  }}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 生日 */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
            生日
          </label>
          <input
            type="date"
            value={profile.date_of_birth}
            onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
            className="input-field w-full"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-sm p-3 rounded-xl"
            style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {saved ? <Check size={16} /> : <Save size={16} />}
          {saving ? "儲存中…" : saved ? "已儲存" : "儲存設定"}
        </button>
      </div>

      {/* 醫師授權管理 */}
      <div className="mt-4 card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={14} style={{ color: "var(--accent)" }} />
          <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
            醫師查看授權
          </p>
        </div>
        {consents.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            目前沒有醫師被授權查看您的記錄。
          </p>
        ) : (
          <div className="space-y-2">
            {consents.map(c => {
              const roleMap: Record<string, string> = { doctor: "醫師", pharmacist: "藥師", nurse: "護理師" };
              return (
                <div key={c.consent_id} className="flex items-center justify-between py-2 border-b last:border-0"
                  style={{ borderColor: "var(--border)" }}>
                  <div>
                    <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {c.doctor_name}
                      <span className="text-xs font-normal ml-1.5" style={{ color: "var(--text-secondary)" }}>
                        {roleMap[c.doctor_role ?? ""] ?? c.doctor_role}
                      </span>
                    </div>
                    {c.institution && (
                      <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{c.institution}</div>
                    )}
                    <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      授權於 {new Date(c.granted_at).toLocaleDateString("zh-TW")}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevoke(c.consent_id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs"
                    style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                  >
                    <XCircle size={11} />
                    撤銷
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Account actions */}
      <div className="mt-4 card p-4">
        <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
          帳號操作
        </p>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{
            background: "rgba(248,113,113,0.08)",
            color: "#f87171",
            border: "1px solid rgba(248,113,113,0.2)",
          }}>
          <LogOut size={15} />
          登出帳號
        </button>
      </div>

      <p className="text-xs text-center mt-4" style={{ color: "var(--text-secondary)", opacity: 0.5 }}>
        你的資料僅用於個人化健康參考範圍，不會與第三方共享。
      </p>
    </div>
  );
}
