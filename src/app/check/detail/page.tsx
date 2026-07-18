"use client";

import { useState, useEffect, useRef } from "react";
import {
  REFERENCE_RANGES,
  CATEGORIES,
  getNormalRange,
  checkAbnormal,
  isHigh, isLow, isCritical,
  type ReferenceItem,
  type AbnormalStatus,
} from "@/lib/referenceRanges";
import { analyzeLocally, type AnalysisSummary } from "@/lib/localAnalysis";
import { saveRecord, saveRecordCloud, getProfile, type UserProfile } from "@/lib/healthStore";
import {
  ChevronDown, ChevronUp, Info, AlertTriangle,
  CheckCircle2, AlertCircle, Copy, Check, Trash2, Zap, Brain, ChevronLeft,
  Home, FlaskConical
} from "lucide-react";
import Link from "next/link";
import { renderMarkdown } from "@/lib/renderMarkdown";
import { useLang } from "@/contexts/LanguageContext";

interface FormData {
  [key: string]: string;
}

// 在家量測的項目 keys（家用血壓計、體溫計、血糖機、血氧機、體重計可量）
const HOME_KEYS = ["systolic", "diastolic", "pulse", "temperature", "weight", "height", "glucose", "spo2"] as const;

// Category presets: quick-jump shortcuts
const PRESETS = [
  { label: "慢性腎臟病", cats: ["kidney", "metabolism"], keys: ["egfr", "creatinine", "bun", "uric_acid", "glucose", "hba1c"], highlight: true },
  { label: "糖尿病", cats: ["metabolism"], keys: ["glucose", "hba1c", "insulin"] },
  { label: "心血管", cats: ["blood", "vitals"], keys: ["cholesterol", "ldl", "hdl", "triglycerides", "bp_sys", "bp_dia"] },
  { label: "肝功能", cats: ["liver"], keys: [] },
  { label: "腎功能", cats: ["kidney"], keys: [] },
  { label: "甲狀腺", cats: ["thyroid"], keys: [] },
  { label: "腫瘤指標", cats: ["tumor"], keys: [] },
  { label: "全套血液", cats: ["blood"], keys: [] },
];

const grouped = Object.entries(CATEGORIES).map(([cat, meta]) => ({
  cat,
  meta,
  items: REFERENCE_RANGES.filter((r) => r.category === cat),
}));

function CKDStageCard({ egfr }: { egfr: number }) {
  type Stage = { label: string; color: string; bg: string; desc: string; action: string };
  const stage: Stage =
    egfr >= 90 ? { label: "G1", color: "#16a34a", bg: "rgba(22,163,74,0.08)", desc: "正常或偏高", action: "維持健康生活習慣，建議每年追蹤一次" } :
    egfr >= 60 ? { label: "G2", color: "#16a34a", bg: "rgba(22,163,74,0.08)", desc: "輕度下降", action: "控制血壓與血糖，每 6 個月追蹤" } :
    egfr >= 45 ? { label: "G3a", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", desc: "輕至中度下降", action: "建議至腎臟科評估，控制飲食蛋白質攝取" } :
    egfr >= 30 ? { label: "G3b", color: "#ea580c", bg: "rgba(234,88,12,0.08)", desc: "中至重度下降", action: "積極腎臟科追蹤，評估腎臟保護藥物" } :
    egfr >= 15 ? { label: "G4", color: "#dc2626", bg: "rgba(220,38,38,0.08)", desc: "重度下降", action: "準備透析或移植評估，嚴格限制飲食" } :
                 { label: "G5", color: "#9f1239", bg: "rgba(159,18,57,0.08)", desc: "腎衰竭", action: "需立即腎臟科評估透析或腎臟移植" };

  return (
    <div className="rounded-xl p-4 mb-4" style={{ background: stage.bg, border: `1px solid ${stage.color}30` }}>
      <div className="flex items-start gap-3">
        <div className="text-center shrink-0">
          <div className="text-2xl font-black" style={{ color: stage.color }}>{stage.label}</div>
          <div className="text-xs font-medium mt-0.5" style={{ color: stage.color }}>CKD 分期</div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            慢性腎臟病 KDIGO 分期：{stage.desc}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{stage.action}</p>
          <p className="text-xs mt-2 opacity-60" style={{ color: "var(--text-secondary)" }}>
            eGFR {egfr} mL/min/1.73m² · 來源：KDIGO 2024 · 僅供參考，不構成診斷
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: AbnormalStatus }) {
  if (status === "normal") return (
    <span className="flex items-center gap-1 text-xs" style={{ color: "var(--accent)" }}>
      <CheckCircle2 size={12} /> 正常
    </span>
  );
  if (status === "critical_high") return (
    <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#ef4444" }}>
      <AlertTriangle size={12} /> 嚴重偏高
    </span>
  );
  if (status === "critical_low") return (
    <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#ef4444" }}>
      <AlertTriangle size={12} /> 嚴重偏低
    </span>
  );
  if (status === "high") return (
    <span className="flex items-center gap-1 text-xs" style={{ color: "var(--warning)" }}>
      <AlertTriangle size={12} /> 偏高
    </span>
  );
  if (status === "low") return (
    <span className="flex items-center gap-1 text-xs" style={{ color: "#60a5fa" }}>
      <AlertTriangle size={12} /> 偏低
    </span>
  );
  return null;
}

function ItemDetail({ item, gender }: { item: ReferenceItem; gender?: "M" | "F" }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs mt-1"
        style={{ color: "var(--text-secondary)" }}>
        <Info size={11} />
        {open ? "收起說明" : "什麼是這個？"}
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>
      {open && (
        <div className="mt-2 p-3 rounded-lg text-xs leading-relaxed"
          style={{ background: "var(--bg-primary)", color: "var(--text-secondary)" }}>
          <p>{item.explanation_zh}</p>
          <p className="mt-1 font-medium" style={{ color: "var(--text-primary)" }}>
            參考範圍：{getNormalRange(item, gender)} {item.unit}
          </p>
          {item.source && (
            <p className="mt-1 opacity-60">來源：{item.source}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function DetailCheckPage() {
  const { t } = useLang();
  const [dataTab, setDataTab] = useState<"home" | "lab">("home");

  const [form, setForm] = useState<FormData>({});
  const [profile, setProfile] = useState<UserProfile>({});
  const [symptoms, setSymptoms] = useState("");
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({ body: true, vitals: true });
  const [subject, setSubject] = useState("self");
  const [subjectName, setSubjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [rotatedWarning, setRotatedWarning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [localResult, setLocalResult] = useState<AnalysisSummary | null>(null);

  const catRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    setProfile(getProfile());
  }, []);

  const set = (key: string, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const toggleCat = (cat: string) =>
    setOpenCats((prev) => ({ ...prev, [cat]: !prev[cat] }));

  // Preset quick-jump: open target categories and scroll to first one
  const applyPreset = (preset: typeof PRESETS[0]) => {
    setOpenCats((prev) => {
      const next = { ...prev };
      preset.cats.forEach((c) => { next[c] = true; });
      return next;
    });
    // Scroll to first target category after state update
    setTimeout(() => {
      const firstCat = preset.cats[0];
      catRefs.current[firstCat]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  useEffect(() => {
    const h = parseFloat(form.height || "");
    const w = parseFloat(form.weight || "");
    if (h > 0 && w > 0) {
      const bmi = (w / ((h / 100) ** 2)).toFixed(1);
      setForm((prev) => ({ ...prev, bmi }));
    }
  }, [form.height, form.weight]);

  useEffect(() => {
    const numericForm: Record<string, number> = {};
    for (const [k, v] of Object.entries(form)) {
      const n = parseFloat(v);
      if (!isNaN(n)) numericForm[k] = n;
    }
    if (Object.keys(numericForm).length > 0) {
      setLocalResult(analyzeLocally(numericForm, profile.gender));
    } else {
      setLocalResult(null);
    }
  }, [form, profile.gender]);

  const filledItems = REFERENCE_RANGES.filter(
    (r) => form[r.key] !== undefined && form[r.key] !== ""
  );

  const submit = async () => {
    if (filledItems.length === 0 && !symptoms.trim()) return;
    setLoading(true);
    setError("");
    setResult("");

    const dataLines = filledItems.map((item) => {
      const val = form[item.key];
      const status = checkAbnormal(item, parseFloat(val), profile.gender);
      const range = getNormalRange(item, profile.gender);
      return `${item.label_zh} (${item.label_en}): ${val} ${item.unit} [參考: ${range}, 狀態: ${status}]`;
    }).join("\n");

    const profileInfo = [
      profile.age ? `年齡: ${profile.age} 歲` : "",
      profile.gender ? `性別: ${profile.gender === "M" ? "男" : "女"}` : "",
    ].filter(Boolean).join(", ");

    const prompt = `
用戶基本資料：${profileInfo || "未提供"}

填寫的健康數值：
${dataLines || "（未填）"}

自述症狀/其他：
${symptoms || "（無）"}

請：
1. 分析各項數值是否在正常範圍內，重點說明異常項目
2. 根據整體數據評估健康狀況
3. 提出具體的建議（飲食、生活習慣、是否需要就醫），不推薦任何藥物名稱
4. 用一般人看得懂的語言，避免過度醫療術語
5. 結尾附上免責聲明
    `.trim();

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "analyze", text: prompt }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.message || "分析失敗，請稍後再試");
      } else {
        const text: string = data.result;
        setResult(text);
        // Auto-save
        const subjectValue = subject === "self" ? "self" : (subjectName.trim() || "家人");
        const record = {
          date: new Date().toISOString(),
          source: "manual" as const,
          subject: subjectValue,
          symptoms,
          aiAnalysis: text,
          data: form,
        };
        saveRecord(record);
        const cloudResult = await saveRecordCloud(record);
        if (cloudResult.id) {
          setSaved(true);
          if (cloudResult.rotated) setRotatedWarning(true);
        }
      }
    } catch {
      setError("分析失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clear = () => {
    setForm({});
    setSymptoms("");
    setResult("");
    setError("");
  };

  const abnormalCount = filledItems.filter(
    (item) => checkAbnormal(item, parseFloat(form[item.key]), profile.gender) !== "normal"
  ).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/check" className="btn-ghost px-2 py-1.5">
          <ChevronLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            {t.check.detail_title}
          </h1>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {t.check.detail_subtitle}
          </p>
        </div>
      </div>

      {/* Tab 切換：在家量測 vs 體檢報告 */}
      <div className="flex rounded-xl overflow-hidden mb-5" style={{ border: "1px solid var(--border)" }}>
        <button
          onClick={() => setDataTab("home")}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all"
          style={{
            background: dataTab === "home" ? "var(--accent)" : "var(--bg-card)",
            color: dataTab === "home" ? "#000" : "var(--text-secondary)",
          }}>
          <Home size={15} /> 在家量測
        </button>
        <button
          onClick={() => setDataTab("lab")}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all"
          style={{
            background: dataTab === "lab" ? "var(--accent)" : "var(--bg-card)",
            color: dataTab === "lab" ? "#000" : "var(--text-secondary)",
          }}>
          <FlaskConical size={15} /> 體檢報告
        </button>
      </div>

      {/* 體檢報告 tab：快速導航 */}
      {dataTab === "lab" && (
        <div className="mb-5">
          <p className="text-xs mb-2 font-medium" style={{ color: "var(--text-secondary)" }}>
            快速導航 — 點擊跳到對應區塊
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => {
              const filled = REFERENCE_RANGES.filter(
                r => p.cats.includes(r.category) && form[r.key]
              ).length;
              return (
                <button key={p.label} onClick={() => applyPreset(p)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80 flex items-center gap-1.5"
                  style={{
                    background: filled > 0 ? "var(--accent)" : p.highlight ? "rgba(0,212,170,0.12)" : "var(--bg-card)",
                    color: filled > 0 ? "#fff" : p.highlight ? "var(--accent)" : "var(--text-primary)",
                    border: p.highlight ? "1px solid var(--accent)" : "1px solid var(--border)",
                    fontWeight: p.highlight ? 600 : undefined,
                  }}>
                  {p.highlight && <span>🫘</span>}
                  {p.label}
                  {filled > 0 && (
                    <span className="opacity-80 font-normal">{filled}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick profile */}
      <div className="card p-4 mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--text-secondary)" }}>年齡</label>
          <input type="number" className="input-field text-sm" placeholder="歲"
            value={profile.age || ""}
            onChange={(e) => setProfile((p) => ({ ...p, age: parseInt(e.target.value) || undefined }))}
          />
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--text-secondary)" }}>性別</label>
          <select className="input-field text-sm" value={profile.gender || ""}
            onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value as "M" | "F" || undefined }))}>
            <option value="">選擇</option>
            <option value="M">男</option>
            <option value="F">女</option>
          </select>
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--text-secondary)" }}>身高 (cm)</label>
          <input type="number" className="input-field text-sm" placeholder="cm"
            value={form.height || ""}
            onChange={(e) => set("height", e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--text-secondary)" }}>體重 (kg)</label>
          <input type="number" className="input-field text-sm" placeholder="kg"
            value={form.weight || ""}
            onChange={(e) => set("weight", e.target.value)}
          />
        </div>
        {form.bmi && (
          <div className="col-span-2 sm:col-span-4">
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>BMI 自動計算：</span>
            <span className="text-sm font-bold ml-1"
              style={{
                color: parseFloat(form.bmi) >= 24 ? "var(--warning)" :
                       parseFloat(form.bmi) < 18.5 ? "#60a5fa" : "var(--accent)"
              }}>
              {form.bmi} kg/m²
            </span>
          </div>
        )}
      </div>

      {/* 在家量測面板 */}
      {dataTab === "home" && (() => {
        const homeItems = HOME_KEYS.map(k => REFERENCE_RANGES.find(r => r.key === k)).filter(Boolean) as typeof REFERENCE_RANGES;
        // 血壓兩欄並排
        const bpItems = homeItems.filter(i => i.key === "systolic" || i.key === "diastolic");
        const otherItems = homeItems.filter(i => i.key !== "systolic" && i.key !== "diastolic");
        return (
          <div className="mb-5">
            <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
              📱 家用設備可量測的項目，填寫後可立即分析趨勢
            </p>
            {/* 血壓並排 */}
            <div className="card p-4 mb-3">
              <p className="text-xs font-semibold mb-3 flex items-center gap-2"
                style={{ color: "var(--text-primary)" }}>
                🩸 血壓 <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>Blood Pressure</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                {bpItems.map((item) => {
                  const val = form[item.key];
                  const status = val ? checkAbnormal(item, parseFloat(val), profile.gender) : "unknown";
                  return (
                    <div key={item.key}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                          {item.label_zh}
                        </label>
                        {val && <StatusBadge status={status} />}
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" step="any" className="input-field text-sm flex-1"
                          placeholder={`正常 < ${item.key === "systolic" ? "120" : "80"}`}
                          value={val || ""}
                          style={{ borderColor: isHigh(status) ? "rgba(245,158,11,0.5)" : isLow(status) ? "rgba(96,165,250,0.5)" : undefined }}
                          onChange={(e) => set(item.key, e.target.value)} />
                        <span className="text-xs shrink-0 w-14 text-right" style={{ color: "var(--text-secondary)" }}>
                          {item.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* 其餘項目 2x2 grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {otherItems.map((item) => {
                const val = form[item.key];
                const status = val ? checkAbnormal(item, parseFloat(val), profile.gender) : "unknown";
                const icons: Record<string, string> = {
                  pulse: "💓", temperature: "🌡️", weight: "⚖️",
                  height: "📏", glucose: "🍬", spo2: "🫁",
                };
                return (
                  <div key={item.key} className="card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold flex items-center gap-1.5"
                        style={{ color: "var(--text-primary)" }}>
                        <span>{icons[item.key] || "📊"}</span>
                        {item.label_zh}
                      </label>
                      {val && <StatusBadge status={status} />}
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" step="any" className="input-field text-sm flex-1"
                        placeholder={`參考: ${getNormalRange(item, profile.gender)}`}
                        value={val || ""}
                        style={{ borderColor: isHigh(status) ? "rgba(245,158,11,0.5)" : isLow(status) ? "rgba(96,165,250,0.5)" : undefined }}
                        onChange={(e) => set(item.key, e.target.value)}
                        readOnly={item.key === "bmi"}
                      />
                      <span className="text-xs shrink-0 w-14 text-right" style={{ color: "var(--text-secondary)" }}>
                        {item.unit}
                      </span>
                    </div>
                    <ItemDetail item={item} gender={profile.gender} />
                  </div>
                );
              })}
            </div>
            {/* BMI 自動計算顯示 */}
            {form.bmi && (
              <div className="mt-3 p-3 rounded-lg flex items-center gap-2"
                style={{ background: "var(--accent-dim)", border: "1px solid rgba(0,212,170,0.2)" }}>
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>BMI 自動計算：</span>
                <span className="font-bold text-sm"
                  style={{ color: parseFloat(form.bmi) >= 24 ? "var(--warning)" : parseFloat(form.bmi) < 18.5 ? "#60a5fa" : "var(--accent)" }}>
                  {form.bmi} kg/m²
                </span>
              </div>
            )}
          </div>
        );
      })()}

      {/* 體檢報告 tab：完整分類手風琴 */}
      {dataTab === "lab" && grouped.filter(g => g.cat !== "body").map(({ cat, meta, items }) => (
        <div key={cat} className="card mb-3"
          ref={(el) => { catRefs.current[cat] = el; }}>
          <button
            className="w-full flex items-center justify-between p-4"
            onClick={() => toggleCat(cat)}>
            <div className="flex items-center gap-2">
              <span>{meta.icon}</span>
              <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                {meta.label_zh}
              </span>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {meta.label_en}
              </span>
              {items.filter(i => form[i.key]).length > 0 && (
                <span className="badge">
                  {items.filter(i => form[i.key]).length}{t.check.items_filled}
                </span>
              )}
            </div>
            {openCats[cat]
              ? <ChevronUp size={16} style={{ color: "var(--text-secondary)" }} />
              : <ChevronDown size={16} style={{ color: "var(--text-secondary)" }} />}
          </button>

          {openCats[cat] && (
            <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4"
              style={{ borderTop: "1px solid var(--border)" }}>
              {items.map((item) => {
                const val = form[item.key];
                const numVal = parseFloat(val || "");
                const status = val ? checkAbnormal(item, numVal, profile.gender) : "unknown";
                return (
                  <div key={item.key} className="pt-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                        {item.label_zh}
                      </label>
                      {val && <StatusBadge status={status} />}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" step="any"
                        className="input-field text-sm flex-1"
                        placeholder={`參考: ${getNormalRange(item, profile.gender)} ${item.unit}`}
                        value={val || ""}
                        style={{
                          borderColor: isHigh(status) ? "rgba(245,158,11,0.5)" :
                                       isLow(status) ? "rgba(96,165,250,0.5)" : undefined,
                        }}
                        onChange={(e) => set(item.key, e.target.value)}
                        readOnly={item.key === "bmi"}
                      />
                      <span className="text-xs shrink-0 w-16 text-right"
                        style={{ color: "var(--text-secondary)" }}>
                        {item.unit}
                      </span>
                    </div>
                    <ItemDetail item={item} gender={profile.gender} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Symptoms */}
      <div className="card p-4 mb-5">
        <label className="text-sm font-semibold block mb-2" style={{ color: "var(--text-primary)" }}>
          💬 自述症狀 / 其他說明
        </label>
        <textarea
          className="input-field"
          rows={4}
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder="描述您的症狀、不適、或任何想讓 AI 參考的資訊..."
        />
      </div>

      {/* Summary bar */}
      {filledItems.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg mb-4"
          style={{ background: "var(--accent-dim)", border: "1px solid rgba(0,212,170,0.2)" }}>
          <CheckCircle2 size={16} style={{ color: "var(--accent)" }} />
          <span className="text-sm" style={{ color: "var(--text-primary)" }}>
            {filledItems.length}{t.check.items_filled}
          </span>
          {abnormalCount > 0 && (
            <span className="flex items-center gap-1 text-sm" style={{ color: "var(--warning)" }}>
              <AlertTriangle size={14} /> {abnormalCount}{t.check.items_abnormal}
            </span>
          )}
        </div>
      )}

      {/* Local instant analysis */}
      {localResult && localResult.items.length > 0 && (
        <div className="card p-5 mb-5 fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} style={{ color: "var(--accent)" }} />
            <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              {t.check.instant_analysis}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
              參考值資料庫
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: "正常", count: localResult.normalCount, color: "var(--accent)" },
              { label: "偏高", count: localResult.highCount, color: "var(--warning)" },
              { label: "偏低", count: localResult.lowCount, color: "#60a5fa" },
            ].map(({ label, count, color }) => (
              <div key={label} className="rounded-lg p-3 text-center"
                style={{ background: "var(--bg-base)" }}>
                <div className="text-xl font-bold" style={{ color }}>{count}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{label}</div>
              </div>
            ))}
          </div>

          {localResult.riskFlags.length > 0 && (
            <div className="space-y-2 mb-4">
              {localResult.riskFlags.map((flag, i) => (
                <div key={i} className="text-sm p-2 rounded-lg"
                  style={{ background: "rgba(245,158,11,0.07)", color: "var(--text-primary)" }}>
                  {flag}
                </div>
              ))}
            </div>
          )}

          {localResult.items.filter(i => i.status !== "normal").length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                {t.check.abnormal_details}
              </p>
              <div className="space-y-2">
                {localResult.items.filter(i => i.status !== "normal" && i.status !== "unknown").map(item => (
                  <div key={item.key} className="flex items-start gap-3 p-3 rounded-lg"
                    style={{ background: "var(--bg-base)", border: "1px solid var(--border)" }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {item.label_zh}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            background: isCritical(item.status) ? "rgba(239,68,68,0.15)" : isHigh(item.status) ? "rgba(245,158,11,0.15)" : "rgba(96,165,250,0.15)",
                            color: isCritical(item.status) ? "#ef4444" : isHigh(item.status) ? "var(--warning)" : "#60a5fa",
                          }}>
                          {item.value} {item.unit} {
                            item.status === "critical_high" ? "↑↑ 嚴重偏高" :
                            item.status === "critical_low" ? "↓↓ 嚴重偏低" :
                            isHigh(item.status) ? "↑ 偏高" : "↓ 偏低"
                          }
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        參考範圍：{item.normalRange} {item.unit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1">
            {localResult.suggestions.map((s, i) => (
              <p key={i} className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{s}</p>
            ))}
          </div>

          <div className="mt-3 pt-3 flex items-center gap-2"
            style={{ borderTop: "1px solid var(--border)" }}>
            <Brain size={13} style={{ color: "var(--accent)" }} />
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              想要更深入的個人化分析？點下方「AI 深度分析」
            </p>
          </div>
        </div>
      )}

      {/* CKD KDIGO Staging — shown when eGFR is entered */}
      {form.egfr && !isNaN(parseFloat(form.egfr)) && (
        <CKDStageCard egfr={parseFloat(form.egfr)} />
      )}

      {/* Subject selector */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>這是誰的記錄：</span>
        {[{ value: "self", label: "本人" }, { value: "family", label: "家人" }].map((opt) => (
          <button key={opt.value} onClick={() => setSubject(opt.value)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-all"
            style={{
              background: subject === opt.value ? "var(--accent)" : "var(--bg-card)",
              color: subject === opt.value ? "#fff" : "var(--text-primary)",
              border: "1px solid var(--border)",
            }}>
            {opt.label}
          </button>
        ))}
        {subject === "family" && (
          <input type="text" className="input-field text-xs" style={{ width: "110px" }}
            placeholder="稱呼（媽媽）"
            value={subjectName} onChange={(e) => setSubjectName(e.target.value)} />
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={submit}
          disabled={loading || (filledItems.length === 0 && !symptoms.trim())}
          className="btn-primary"
          style={{ opacity: loading || (filledItems.length === 0 && !symptoms.trim()) ? 0.6 : 1 }}>
          <><Brain size={15} /> {loading ? t.check.analyzing : t.check.ai_deep}</>
        </button>
        <button onClick={clear} className="btn-ghost">
          <Trash2 size={14} /> {t.common.clear}
        </button>
      </div>

      {/* Analyzing animation card */}
      {loading && (
        <div className="card p-6 mb-4 fade-in text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
            style={{ background: "var(--accent-dim)" }}>
            <Brain size={22} style={{ color: "var(--accent)" }} className="animate-pulse" />
          </div>
          <p className="font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>
            {t.check.ai_deep_analyzing}
          </p>
          <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
            逐一比對 {filledItems.length} 項數值與參考範圍
          </p>
          <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: "var(--border)" }}>
            <div className="analyzing-bar" style={{ background: "var(--accent)" }} />
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg mb-4 fade-in"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertCircle size={16} color="var(--danger)" />
          <span className="text-sm" style={{ color: "var(--danger)" }}>{error}</span>
        </div>
      )}
      {rotatedWarning && (
        <div className="flex items-center gap-2 p-3 rounded-lg mb-4"
          style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)" }}>
          <AlertCircle size={15} style={{ color: "#eab308", flexShrink: 0 }} />
          <span className="text-xs" style={{ color: "#eab308" }}>已達 100 筆上限，自動刪除了最舊一筆記錄</span>
        </div>
      )}

      {result && (
        <div className="card p-5 fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap size={16} style={{ color: "var(--accent)" }} />
              <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                {t.check.ai_result}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {saved && (
                <span className="text-xs flex items-center gap-1" style={{ color: "var(--accent)" }}>
                  <Check size={12} /> 已儲存
                </span>
              )}
              <button onClick={copy} className="btn-ghost text-xs px-2 py-1 gap-1">
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? t.common.copied : t.common.copy}
              </button>
            </div>
          </div>
          <div className="text-sm leading-relaxed">
            {renderMarkdown(result)}
          </div>
          <div className="mt-4 pt-3 text-xs"
            style={{ borderTop: "1px solid var(--border)", color: "var(--warning)" }}>
            ⚠️ {t.common.aiDisclaimer}
          </div>
        </div>
      )}
    </div>
  );
}
