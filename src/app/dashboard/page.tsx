"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Activity, ScanLine, ClipboardList, User, LogOut, ChevronRight, Bell, Brain, TrendingUp, Stethoscope } from "lucide-react";
import { getRecords, getRecordsCloud, type HealthRecord } from "@/lib/healthStore";
import { getReminders, type MedReminder } from "@/lib/medReminders";
import { useLang } from "@/contexts/LanguageContext";

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (h < 1) return "剛剛";
  if (h < 24) return `${h} 小時前`;
  if (d < 7) return `${d} 天前`;
  return new Date(iso).toLocaleDateString("zh-TW", { month: "2-digit", day: "2-digit" });
}

function todaysReminders(reminders: MedReminder[]): MedReminder[] {
  const today = new Date().getDay();
  return reminders.filter(r => r.days.length === 0 || r.days.includes(today));
}

export default function DashboardPage() {
  const router = useRouter();
  const { locale } = useLang();
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [recentRecords, setRecentRecords] = useState<HealthRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [reminders, setReminders] = useState<MedReminder[]>([]);
  const [isCloud, setIsCloud] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/auth/login"); return; }

      const { data: prof } = await supabase.from("profiles").select("name").eq("id", user.id).single();
      setUserName(prof?.name || user.email?.split("@")[0] || "用戶");

      let records: HealthRecord[];
      try {
        records = await getRecordsCloud();
        setIsCloud(true);
      } catch {
        records = getRecords();
      }
      setTotalRecords(records.length);
      setRecentRecords(records.slice(0, 3));
      setReminders(getReminders());
      setLoading(false);
    });
  }, [router]);

  const signOut = async () => {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  };

  const todayRems = todaysReminders(reminders);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "早安" : hour < 18 ? "午安" : "晚安";

  const quickLinks = [
    { href: "/check",     icon: Stethoscope,   label: locale === "zh" ? "健康自查" : "Check",     color: "#6366f1" },
    { href: "/scan",      icon: ScanLine,      label: locale === "zh" ? "掃描報告" : "Scan",       color: "#00d4aa" },
    { href: "/meds",      icon: Activity,      label: locale === "zh" ? "藥物查詢" : "Meds",       color: "#f59e0b" },
    { href: "/reminders", icon: Bell,          label: locale === "zh" ? "服藥提醒" : "Remind",     color: "#8b5cf6" },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-sm" style={{ color: "var(--text-secondary)" }}>載入中...</div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm mb-0.5" style={{ color: "var(--text-secondary)" }}>{greeting}，</p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{userName}</h1>
        </div>
        <button onClick={signOut} className="btn-ghost text-sm gap-1.5" style={{ color: "var(--text-secondary)" }}>
          <LogOut size={14} /> {locale === "zh" ? "登出" : "Logout"}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: locale === "zh" ? "健康記錄" : "Records", value: totalRecords, icon: ClipboardList, color: "var(--accent)" },
          { label: locale === "zh" ? "服藥提醒" : "Reminders", value: reminders.length, icon: Bell, color: "#8b5cf6" },
          { label: locale === "zh" ? (isCloud ? "雲端同步" : "本機儲存") : (isCloud ? "Cloud" : "Local"), value: isCloud ? "✓" : "—", icon: TrendingUp, color: isCloud ? "var(--accent)" : "var(--text-secondary)" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4 flex flex-col gap-1">
            <Icon size={16} style={{ color }} />
            <p className="text-xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>{value}</p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Today's reminders */}
      {todayRems.length > 0 && (
        <div className="card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell size={14} style={{ color: "#8b5cf6" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {locale === "zh" ? "今日服藥提醒" : "Today's Reminders"}
              </span>
            </div>
            <Link href="/reminders" style={{ fontSize: 11, color: "var(--accent)" }}>
              {locale === "zh" ? "管理" : "Manage"}
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {todayRems.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                style={{ background: "var(--bg-base)" }}>
                <span className="text-sm font-bold" style={{ color: "#8b5cf6", minWidth: 40 }}>{r.time}</span>
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>{r.medName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent records */}
      {recentRecords.length > 0 && (
        <div className="card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain size={14} style={{ color: "var(--accent)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {locale === "zh" ? "最近記錄" : "Recent Records"}
              </span>
            </div>
            <Link href="/records" style={{ fontSize: 11, color: "var(--accent)" }}>
              {locale === "zh" ? "查看全部" : "View All"} →
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {recentRecords.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                style={{ background: "var(--bg-base)" }}>
                {r.source === "scan"
                  ? <ScanLine size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
                  : <Brain size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {r.source === "scan"
                      ? (locale === "zh" ? "圖片掃描分析" : "Image Scan")
                      : (locale === "zh" ? "健康數值分析" : "Health Analysis")}
                    {r.subject && r.subject !== "self" && (
                      <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                        style={{ background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                        {r.subject}
                      </span>
                    )}
                  </p>
                  {r.symptoms && (
                    <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      {r.symptoms.split("\n")[0]}
                    </p>
                  )}
                </div>
                <span className="text-xs shrink-0" style={{ color: "var(--text-secondary)" }}>
                  {formatRelative(r.date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {quickLinks.map(({ href, icon: Icon, label, color }) => (
          <Link key={href} href={href}
            className="card p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${color}18` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{label}</span>
            <ChevronRight size={13} className="ml-auto" style={{ color: "var(--text-secondary)" }} />
          </Link>
        ))}
      </div>

      {/* Profile link */}
      <Link href="/profile" className="card p-4 flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(139,92,246,0.12)" }}>
          <User size={18} style={{ color: "#8b5cf6" }} />
        </div>
        <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
          {locale === "zh" ? "個人設定" : "Profile"}
        </span>
        <ChevronRight size={13} className="ml-auto" style={{ color: "var(--text-secondary)" }} />
      </Link>

      <div className="mt-6 p-3 rounded-lg text-xs text-center"
        style={{ background: "rgba(245,158,11,0.06)", color: "var(--warning)", border: "1px solid rgba(245,158,11,0.12)" }}>
        ⚠️ {locale === "zh" ? "本平台僅供健康參考，不構成醫療診斷。如有不適請就醫。" : "For reference only. Not a substitute for medical advice."}
      </div>
    </div>
  );
}
