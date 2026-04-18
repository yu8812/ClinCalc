"use client";

import { useState, useEffect, useRef } from "react";
import {
  REFERENCE_RANGES,
  CATEGORIES,
  getNormalRange,
  checkAbnormal,
  type ReferenceItem,
} from "@/lib/referenceRanges";
import { analyzeLocally, type AnalysisSummary } from "@/lib/localAnalysis";
import { saveRecord, saveRecordCloud, getProfile, type UserProfile } from "@/lib/healthStore";
import {
  ChevronDown, ChevronUp, Info, AlertTriangle,
  CheckCircle2, AlertCircle, Copy, Check, Trash2, Zap, Brain, ChevronLeft
} from "lucide-react";
import Link from "next/link";

interface FormData {
  [key: string]: string;
}

// Category presets: quick-jump shortcuts
const PRESETS = [
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

function StatusBadge({ status }: { status: "high" | "low" | "normal" | "unknown" }) {
  if (status === "normal") return (
    <span className="flex items-center gap-1 text-xs" style={{ color: "var(--accent)" }}>
      <CheckCircle2 size={12} /> 正常
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

  const [form, setForm] = useState<FormData>({});
  const [profile, setProfile] = useState<UserProfile>({});
  const [symptoms, setSymptoms] = useState("");
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({ body: true, vitals: true });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
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
        setResult(data.result);
      }
    } catch {
      setError("分析失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const record = {
      date: new Date().toISOString(),
      source: "manual" as const,
      symptoms,
      aiAnalysis: result,
      data: form,
    };
    saveRecord(record);
    await saveRecordCloud(record);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
            詳細分析
          </h1>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            輸入體檢報告數值，沒有的項目留空即可
          </p>
        </div>
      </div>

      {/* Preset quick-nav */}
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
                  background: filled > 0 ? "var(--accent)" : "var(--bg-card)",
                  color: filled > 0 ? "#fff" : "var(--text-primary)",
                  border: "1px solid var(--border)",
                }}>
                {p.label}
                {filled > 0 && (
                  <span className="opacity-80 font-normal">{filled}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

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

      {/* Category sections */}
      {grouped.filter(g => g.cat !== "body").map(({ cat, meta, items }) => (
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
                  {items.filter(i => form[i.key]).length} 項已填
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
                          borderColor: status === "high" ? "rgba(245,158,11,0.5)" :
                                       status === "low" ? "rgba(96,165,250,0.5)" : undefined,
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
            已填 {filledItems.length} 項數值
          </span>
          {abnormalCount > 0 && (
            <span className="flex items-center gap-1 text-sm" style={{ color: "var(--warning)" }}>
              <AlertTriangle size={14} /> {abnormalCount} 項異常
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
              即時數據分析
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
                異常項目詳情
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
                            background: item.status === "high" ? "rgba(245,158,11,0.15)" : "rgba(96,165,250,0.15)",
                            color: item.status === "high" ? "var(--warning)" : "#60a5fa",
                          }}>
                          {item.value} {item.unit} {item.status === "high" ? "↑ 偏高" : "↓ 偏低"}
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

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={submit}
          disabled={loading || (filledItems.length === 0 && !symptoms.trim())}
          className="btn-primary"
          style={{ opacity: loading || (filledItems.length === 0 && !symptoms.trim()) ? 0.6 : 1 }}>
          {loading ? (
            <>
              {[0, 1, 2].map((i) => (
                <span key={i} className="loading-dot"
                  style={{ animationDelay: `${i * 0.2}s`, background: "#000" }} />
              ))}
              <span className="ml-2">AI 分析中...</span>
            </>
          ) : (
            <><Brain size={15} /> AI 深度分析</>
          )}
        </button>
        <button onClick={clear} className="btn-ghost">
          <Trash2 size={14} /> 清除
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg mb-4 fade-in"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertCircle size={16} color="var(--danger)" />
          <span className="text-sm" style={{ color: "var(--danger)" }}>{error}</span>
        </div>
      )}

      {result && (
        <div className="card p-5 fade-in">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              AI 分析結果
            </span>
            <div className="flex gap-2">
              <button onClick={copy} className="btn-ghost text-xs px-2 py-1 gap-1">
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "已複製" : "複製"}
              </button>
              <button onClick={handleSave} className="btn-ghost text-xs px-2 py-1 gap-1"
                style={{ color: saved ? "var(--accent)" : undefined }}>
                {saved ? <Check size={13} /> : <CheckCircle2 size={13} />}
                {saved ? "已儲存" : "儲存記錄"}
              </button>
            </div>
          </div>
          <div className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: "var(--text-secondary)" }}>
            {result}
          </div>
          <div className="mt-4 pt-3 text-xs"
            style={{ borderTop: "1px solid var(--border)", color: "var(--warning)" }}>
            ⚠️ 以上為 AI 參考資訊，不構成醫療診斷。如有疑慮請就醫。
          </div>
        </div>
      )}
    </div>
  );
}
