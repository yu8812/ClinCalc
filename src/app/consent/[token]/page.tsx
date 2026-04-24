"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Shield, UserCheck, AlertCircle, CheckCircle2, Stethoscope } from "lucide-react";

interface ConsentInfo {
  consent_id: string;
  doctor_name: string;
  institution: string | null;
  doctor_role: string | null;
  expires_at: string;
  is_valid: boolean;
}

const ROLE_LABEL: Record<string, string> = {
  doctor: "醫師",
  pharmacist: "藥師",
  nurse: "護理師",
  admin_staff: "行政人員",
  admin: "管理員",
};

export default function ConsentPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [info, setInfo] = useState<ConsentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();

      // 取得醫師資訊（用 RPC，不需登入）
      const { data, error: rpcErr } = await supabase.rpc("get_consent_by_token", { p_token: token });
      if (rpcErr || !data || data.length === 0) {
        setError("連結無效或已過期");
        setLoading(false);
        return;
      }
      setInfo(data[0] as ConsentInfo);

      // 取得當前登入用戶
      const { data: { user: u } } = await supabase.auth.getUser();
      if (u) setUser({ id: u.id, email: u.email ?? "" });
      setLoading(false);
    };
    init();
  }, [token]);

  const handleAccept = async () => {
    if (!user) {
      router.push(`/auth/login?next=/consent/${token}`);
      return;
    }
    setAccepting(true);
    setError("");
    const supabase = createClient();
    const { data: ok, error: rpcErr } = await supabase.rpc("accept_consent", { p_token: token });
    if (rpcErr || !ok) {
      setError("授權失敗，此連結可能已被使用或過期");
      setAccepting(false);
      return;
    }
    setDone(true);
    setAccepting(false);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ color: "var(--text-muted)", fontSize: 14 }}>載入中...</div>
    </div>
  );

  if (error && !info) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 24 }}>
      <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
        <AlertCircle size={48} color="#ef4444" style={{ margin: "0 auto 16px" }} />
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>連結無效</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>{error}</p>
        <Link href="/" style={{ display: "inline-block", padding: "10px 24px", background: "var(--accent)", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
          回到首頁
        </Link>
      </div>
    </div>
  );

  if (done) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 24 }}>
      <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
        <CheckCircle2 size={56} color="#22c55e" style={{ margin: "0 auto 16px" }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>授權成功</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 24 }}>
          您已授權 <strong>{info?.doctor_name}</strong> 查看您的 ClinCalc 健康記錄。<br />
          您可以隨時在個人設定中撤銷授權。
        </p>
        <Link href="/records" style={{ display: "inline-block", padding: "10px 24px", background: "var(--accent)", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
          查看我的記錄
        </Link>
      </div>
    </div>
  );

  const roleLabel = info?.doctor_role ? (ROLE_LABEL[info.doctor_role] ?? info.doctor_role) : "醫療人員";
  const expiresDate = info?.expires_at ? new Date(info.expires_at).toLocaleDateString("zh-TW") : "";

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 24 }}>
      <div style={{ maxWidth: 440, width: "100%" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(59,130,246,0.1)", border: "2px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Stethoscope size={28} color="var(--accent)" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>醫療授權請求</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>以下醫療人員希望查看您的健康記錄</p>
        </div>

        {/* Doctor info card */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "var(--accent)" }}>
              {info?.doctor_name?.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{info?.doctor_name}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{roleLabel}</div>
            </div>
          </div>

          {info?.institution && (
            <div style={{ padding: "8px 12px", background: "var(--bg)", borderRadius: 7, fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
              {info.institution}
            </div>
          )}

          {/* What they can see */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            授權後對方可查看
          </div>
          {[
            "您在 ClinCalc 儲存的健康分析記錄",
            "各項數值（血壓、血糖、膽固醇等）",
            "AI 分析結果",
          ].map(item => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 13, color: "var(--text)" }}>
              <CheckCircle2 size={13} color="#22c55e" style={{ flexShrink: 0 }} />
              {item}
            </div>
          ))}

          <div style={{ marginTop: 14, padding: "8px 12px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 7, fontSize: 12, color: "#d97706" }}>
            此連結有效至 {expiresDate}，您可隨時撤銷授權
          </div>
        </div>

        {/* Privacy note */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, padding: "10px 12px", background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 8 }}>
          <Shield size={14} color="var(--accent)" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
            授權僅限此醫師查看您的記錄，不影響其他功能。您的資料受 Supabase Row Level Security 保護。
          </p>
        </div>

        {/* Action */}
        {!info?.is_valid ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <AlertCircle size={20} color="#ef4444" style={{ margin: "0 auto 8px", display: "block" }} />
            <p style={{ fontSize: 13, color: "#ef4444" }}>此邀請連結已過期</p>
          </div>
        ) : !user ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>請先登入 ClinCalc 以確認授權</p>
            <Link
              href={`/auth/login?next=/consent/${token}`}
              style={{ display: "block", padding: "12px 0", background: "var(--accent)", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 15, textAlign: "center" }}
            >
              <UserCheck size={16} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
              登入並授權
            </Link>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 10 }}>
              還沒有帳號？<Link href={`/auth/register?next=/consent/${token}`} style={{ color: "var(--accent)" }}>免費註冊</Link>
            </p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginBottom: 12 }}>
              以 <strong>{user.email}</strong> 登入
            </div>
            {error && (
              <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, fontSize: 13, color: "#ef4444", marginBottom: 12 }}>
                {error}
              </div>
            )}
            <button
              onClick={handleAccept}
              disabled={accepting}
              style={{ display: "block", width: "100%", padding: "13px 0", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: accepting ? "not-allowed" : "pointer", opacity: accepting ? 0.7 : 1 }}
            >
              <UserCheck size={16} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
              {accepting ? "授權中..." : "同意授權"}
            </button>
            <Link href="/dashboard" style={{ display: "block", textAlign: "center", marginTop: 12, fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>
              拒絕，返回儀表板
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
