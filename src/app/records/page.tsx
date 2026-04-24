"use client";

import { useState, useEffect } from "react";
import {
  getRecords, deleteRecord,
  getRecordsCloud, deleteRecordCloud,
  getProfile,
  type HealthRecord,
} from "@/lib/healthStore";
import { REFERENCE_RANGES } from "@/lib/referenceRanges";
import { createClient } from "@/lib/supabase";
import { Trash2, ChevronDown, ChevronUp, Brain, ScanLine, CalendarDays, ClipboardList, Cloud, HardDrive, Upload, TrendingUp } from "lucide-react";
import TrendChart from "@/components/TrendChart";
import type { User } from "@supabase/supabase-js";
import { useLang } from "@/contexts/LanguageContext";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("zh-TW", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function RecordCard({ record, onDelete }: { record: HealthRecord; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const { t } = useLang();
  const filledKeys = Object.entries(record.data || {}).filter(([, v]) => v !== "" && v !== undefined);
  const itemMap = Object.fromEntries(REFERENCE_RANGES.map((r) => [r.key, r]));

  return (
    <div className="card mb-3">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {record.source === "scan" ? (
              <ScanLine size={16} style={{ color: "var(--accent)" }} />
            ) : (
              <Brain size={16} style={{ color: "var(--accent)" }} />
            )}
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {record.source === "scan" ? t.records.scan_type : t.records.analysis_type}
                </p>
                {record.subject && record.subject !== "self" && (
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "var(--bg-base)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                    {record.subject}
                  </span>
                )}
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                <CalendarDays size={11} className="inline mr-1" />
                {formatDate(record.date)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {filledKeys.length > 0 && (
              <span className="badge">{filledKeys.length}{t.records.items}</span>
            )}
            <button onClick={onDelete}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/10"
              style={{ color: "var(--text-secondary)" }}>
              <Trash2 size={14} />
            </button>
            <button onClick={() => setOpen(!open)}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ color: "var(--text-secondary)" }}>
              {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4" style={{ borderTop: "1px solid var(--border)" }}>
          {filledKeys.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 mb-3">
              {filledKeys.map(([key, val]) => {
                const item = itemMap[key];
                if (!item) return null;
                return (
                  <div key={key} className="p-2 rounded-lg text-xs"
                    style={{ background: "var(--bg-base)" }}>
                    <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                      {item.label_zh}
                    </p>
                    <p style={{ color: "var(--accent)" }}>
                      {val} {item.unit}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {record.symptoms && (
            <div className="mb-3">
              <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                {t.records.symptoms_label}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-primary)" }}>
                {record.symptoms}
              </p>
            </div>
          )}

          {record.aiAnalysis && (
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                {t.records.ai_title}
              </p>
              <div className="text-xs leading-relaxed whitespace-pre-wrap p-3 rounded-lg"
                style={{ background: "var(--bg-base)", color: "var(--text-secondary)", maxHeight: "200px", overflowY: "auto" }}>
                {record.aiAnalysis}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getTrendableMetrics(records: HealthRecord[], subjectFilter?: string) {
  const counts: Record<string, { date: string; value: number }[]> = {};
  const target = subjectFilter ?? "self";
  const sorted = [...records]
    .filter((r) => (r.subject ?? "self") === target)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  for (const r of sorted) {
    for (const [key, val] of Object.entries(r.data || {})) {
      const num = typeof val === "number" ? val : parseFloat(val as string);
      if (!isNaN(num) && isFinite(num)) {
        if (!counts[key]) counts[key] = [];
        counts[key].push({ date: r.date, value: num });
      }
    }
  }
  return Object.entries(counts)
    .filter(([, pts]) => pts.length >= 2)
    .map(([key, pts]) => ({ key, points: pts }));
}

export default function RecordsPage() {
  const { t } = useLang();
  const [user, setUser] = useState<User | null>(null);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [localRecords, setLocalRecords] = useState<HealthRecord[]>([]);
  const [isCloud, setIsCloud] = useState(false);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>("self");
  const [gender, setGender] = useState<"M" | "F" | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user;
      setUser(u);
      const local = getRecords();
      setLocalRecords(local);

      if (u) {
        setIsCloud(true);
        const cloud = await getRecordsCloud();
        setRecords(cloud);
      } else {
        setRecords(local);
      }
      setLoading(false);
    });

    const profile = getProfile();
    if (profile.gender === "M" || profile.gender === "F") setGender(profile.gender);
  }, []);

  const handleDelete = async (id: string) => {
    if (isCloud) {
      await deleteRecordCloud(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } else {
      deleteRecord(id);
      setRecords(getRecords());
    }
  };

  // Migrate local records to cloud
  const handleMigrate = async () => {
    if (!user || localRecords.length === 0) return;
    setMigrating(true);
    const supabase = createClient();

    const rows = localRecords.map((r) => ({
      user_id: user.id,
      type: r.source,
      data: { ...r.data, _symptoms: r.symptoms ?? null },
      ai_analysis: r.aiAnalysis ?? null,
      created_at: r.date,
    }));

    await supabase.from("health_records").upsert(rows, { onConflict: "id" });
    localStorage.removeItem("cc-health-records");
    setLocalRecords([]);

    const cloud = await getRecordsCloud();
    setRecords(cloud);
    setMigrating(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* TrendChart modal */}
      {selectedMetric && (() => {
        const trendable = getTrendableMetrics(records, selectedSubject);
        const found = trendable.find((t) => t.key === selectedMetric);
        if (!found) return null;
        return (
          <TrendChart
            metricKey={found.key}
            points={found.points}
            gender={gender}
            onClose={() => setSelectedMetric(null)}
          />
        );
      })()}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {t.records.title}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {loading ? t.common.loading : `${records.length} ${t.records.count_unit}`}
            {isCloud && (
              <span className="ml-2 inline-flex items-center gap-1" style={{ color: "var(--accent)" }}>
                <Cloud size={11} /> {t.records.cloud}
              </span>
            )}
            {!isCloud && !loading && (
              <span className="ml-2 inline-flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                <HardDrive size={11} /> {t.records.local}
              </span>
            )}
          </p>
        </div>
        <ClipboardList size={24} style={{ color: "var(--accent)" }} />
      </div>

      {/* Migration prompt */}
      {isCloud && localRecords.length > 0 && (
        <div className="mb-4 p-4 rounded-xl flex items-center justify-between gap-3"
          style={{ background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.2)" }}>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--accent)" }}>
              {localRecords.length} {t.records.found_local}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {t.records.migrate_sub}
            </p>
          </div>
          <button onClick={handleMigrate} disabled={migrating}
            className="btn-primary flex items-center gap-1.5 text-xs px-3 py-2 shrink-0">
            <Upload size={13} />
            {migrating ? t.records.syncing : t.records.sync_cloud}
          </button>
        </div>
      )}

      {/* Trend analysis section */}
      {!loading && records.length > 0 && (() => {
        const trendable = getTrendableMetrics(records);
        if (trendable.length === 0) return null;
        return (
          <div className="card mb-5 p-4">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <TrendingUp size={15} style={{ color: "var(--accent)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {t.records.trend}
              </span>
              {/* Subject tabs */}
              {(() => {
                const subjects = [...new Set(records.map((r) => r.subject ?? "self"))];
                if (subjects.length <= 1) return null;
                return (
                  <div className="flex gap-1 ml-auto">
                    {subjects.map((s) => (
                      <button key={s}
                        onClick={() => { setSelectedSubject(s); setSelectedMetric(null); }}
                        className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                        style={{
                          background: selectedSubject === s ? "var(--accent)" : "var(--bg-base)",
                          color: selectedSubject === s ? "#fff" : "var(--text-primary)",
                          border: "1px solid var(--border)",
                        }}>
                        {s === "self" ? t.records.self : s}
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
            <div className="flex flex-wrap gap-2">
              {trendable.map(({ key, points }) => {
                const ref = REFERENCE_RANGES.find((r) => r.key === key);
                const last = points[points.length - 1];
                const normalRange =
                  (gender === "M" ? ref?.normal?.male : gender === "F" ? ref?.normal?.female : undefined) ??
                  ref?.normal?.general;
                const abnormal =
                  (normalRange?.min != null && last.value < normalRange.min) ||
                  (normalRange?.max != null && last.value > normalRange.max);
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedMetric(key)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80 flex items-center gap-1.5"
                    style={{
                      background: abnormal ? "rgba(239,68,68,0.1)" : "var(--bg-base)",
                      color: abnormal ? "#ef4444" : "var(--text-primary)",
                      border: `1px solid ${abnormal ? "rgba(239,68,68,0.3)" : "var(--border)"}`,
                    }}
                  >
                    {ref?.label_zh ?? key}
                    <span style={{ color: abnormal ? "#ef4444" : "var(--accent)", opacity: 0.8 }}>
                      {points.length}筆
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {loading ? (
        <div className="text-center py-16">
          <div className="flex justify-center gap-1 mb-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="loading-dot"
                style={{ animationDelay: `${i * 0.2}s`, background: "var(--accent)" }} />
            ))}
          </div>
        </div>
      ) : records.length === 0 ? (
        <div className="card p-12 text-center">
          <ClipboardList size={40} className="mx-auto mb-3"
            style={{ color: "var(--text-secondary)", opacity: 0.4 }} />
          <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            {t.records.no_records}
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {t.records.no_records_sub}
          </p>
        </div>
      ) : (
        records.map((r) => (
          <RecordCard key={r.id} record={r} onDelete={() => handleDelete(r.id)} />
        ))
      )}

      {!user && (
        <div className="mt-6 p-3 rounded-lg text-xs text-center"
          style={{ background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
          {t.records.local_notice}
          <a href="/auth/login" style={{ color: "var(--accent)", marginLeft: "4px" }}>
            {t.records.login_cta}
          </a>
          {" "}{t.records.login_sub}
        </div>
      )}
    </div>
  );
}
