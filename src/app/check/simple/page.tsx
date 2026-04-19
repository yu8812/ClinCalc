"use client";

import { useState, useEffect } from "react";
import { Brain, AlertCircle, Check, Copy, ChevronLeft, Zap } from "lucide-react";
import Link from "next/link";
import { saveRecord, saveRecordCloud } from "@/lib/healthStore";
import { renderMarkdown } from "@/lib/renderMarkdown";

const SYMPTOM_CHIPS = [
  "頭痛", "頭暈", "發燒", "畏寒", "疲勞倦怠",
  "咳嗽", "喉嚨痛", "鼻塞流鼻水", "呼吸困難", "胸悶胸痛",
  "心悸", "腹痛", "噁心嘔吐", "腹瀉", "便秘",
  "食慾不振", "體重驟降", "水腫", "皮膚起疹", "關節痛",
  "腰背痛", "失眠", "視力模糊", "耳鳴", "尿量異常",
];

const DURATION_OPTIONS = [
  "今天才開始", "2~3 天", "1 週左右", "2~4 週", "1 個月以上", "超過 3 個月",
];

const URGENCY_LEVELS = [
  { emoji: "🔴", label: "立即就醫", color: "#ef4444", desc: "可能有緊急狀況" },
  { emoji: "🟠", label: "盡快就診", color: "#f97316", desc: "24~48 小時內" },
  { emoji: "🟡", label: "一般門診", color: "#eab308", desc: "1~2 週內" },
  { emoji: "🟢", label: "可自我觀察", color: "#22c55e", desc: "注意變化即可" },
];

export default function SimpleCheckPage() {
  const [chips, setChips] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState(0);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [temp, setTemp] = useState("");
  const [bpSys, setBpSys] = useState("");
  const [bpDia, setBpDia] = useState("");
  const [hr, setHr] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [urgency, setUrgency] = useState<typeof URGENCY_LEVELS[0] | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const bmi = height && weight
    ? (parseFloat(weight) / (parseFloat(height) / 100) ** 2).toFixed(1)
    : null;

  const toggleChip = (c: string) =>
    setChips((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  const canSubmit = chips.length > 0 || description.trim().length > 0;

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setResult("");
    setUrgency(null);

    const basicInfo = [
      age && `年齡 ${age} 歲`,
      gender && `性別 ${gender === "M" ? "男" : "女"}`,
      height && weight && `身高 ${height}cm / 體重 ${weight}kg${bmi ? ` / BMI ${bmi}` : ""}`,
      temp && `體溫 ${temp}°C`,
      bpSys && bpDia && `血壓 ${bpSys}/${bpDia} mmHg`,
      hr && `心跳 ${hr} 次/分`,
    ].filter(Boolean).join("，");

    const prompt = `
你是一位謹慎的醫療助手。請根據以下用戶資料評估健康狀況，不推薦任何藥物。

基本資料：${basicInfo || "未提供"}
勾選症狀：${chips.length > 0 ? chips.join("、") : "無"}
症狀描述：${description || "無"}
症狀持續：${duration || "未說明"}
不適程度：${severity > 0 ? `${severity}/10` : "未評估"}

請依序回覆：

【就醫緊急度】
從以下四個等級選一，只寫等級標籤：
🔴 立即就醫 / 🟠 盡快就診 / 🟡 一般門診 / 🟢 可自我觀察

【原因說明】
2~3 句說明為何給出此等級

【居家注意事項】
3~4 點具體建議（不要推薦任何藥物名稱）

【何時需要立即就醫】
列出 2~3 個「出現以下情況請立即就醫」的警示症狀

【免責聲明】
一句話

回答使用繁體中文，語氣親切，避免過度醫療術語。
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
        // Parse urgency
        if (text.includes("🔴")) setUrgency(URGENCY_LEVELS[0]);
        else if (text.includes("🟠")) setUrgency(URGENCY_LEVELS[1]);
        else if (text.includes("🟡")) setUrgency(URGENCY_LEVELS[2]);
        else if (text.includes("🟢")) setUrgency(URGENCY_LEVELS[3]);
        // Auto-save record
        const record = {
          date: new Date().toISOString(),
          source: "manual" as const,
          symptoms: `${chips.join("、")}${description ? "\n" + description : ""}`,
          aiAnalysis: text,
          data: { age, gender, height, weight, temp, bpSys, bpDia, hr },
        };
        saveRecord(record);
        saveRecordCloud(record);
        setSaved(true);
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/check" className="btn-ghost px-2 py-1.5">
          <ChevronLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            簡單自查
          </h1>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            描述你的症狀，AI 評估就醫緊急程度
          </p>
        </div>
      </div>

      {/* Symptom chips */}
      <div className="card p-4 mb-4">
        <label className="text-sm font-semibold block mb-3" style={{ color: "var(--text-primary)" }}>
          你有哪些不舒服？（可多選）
        </label>
        <div className="flex flex-wrap gap-2">
          {SYMPTOM_CHIPS.map((c) => (
            <button key={c} onClick={() => toggleChip(c)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: chips.includes(c) ? "var(--accent)" : "var(--bg-primary)",
                color: chips.includes(c) ? "#000" : "var(--text-secondary)",
                border: `1px solid ${chips.includes(c) ? "var(--accent)" : "var(--border)"}`,
              }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Free text description */}
      <div className="card p-4 mb-4">
        <label className="text-sm font-semibold block mb-2" style={{ color: "var(--text-primary)" }}>
          詳細描述你的狀況 <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>(選填)</span>
        </label>
        <textarea
          className="input-field"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="例如：最近三天一直頭痛，尤其是下午特別嚴重，吃完飯後感覺有點噁心..."
        />
      </div>

      {/* Duration + Severity */}
      <div className="card p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold block mb-2" style={{ color: "var(--text-primary)" }}>
            症狀持續多久？
          </label>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((d) => (
              <button key={d} onClick={() => setDuration(d)}
                className="px-3 py-1 rounded-full text-xs transition-all"
                style={{
                  background: duration === d ? "var(--accent)" : "var(--bg-primary)",
                  color: duration === d ? "#000" : "var(--text-secondary)",
                  border: `1px solid ${duration === d ? "var(--accent)" : "var(--border)"}`,
                }}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold block mb-2" style={{ color: "var(--text-primary)" }}>
            不適程度：<span style={{ color: "var(--accent)" }}>{severity > 0 ? `${severity}/10` : "未評估"}</span>
          </label>
          <input type="range" min={0} max={10} value={severity}
            onChange={(e) => setSeverity(parseInt(e.target.value))}
            className="w-full accent-[var(--accent)]"
          />
          <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
            <span>沒感覺</span><span>中等</span><span>非常痛苦</span>
          </div>
        </div>
      </div>

      {/* Basic vitals */}
      <div className="card p-4 mb-5">
        <label className="text-sm font-semibold block mb-3" style={{ color: "var(--text-primary)" }}>
          基本資料 <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>(選填，填越多分析越準確)</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>年齡</p>
            <input type="number" className="input-field text-sm" placeholder="歲"
              value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>性別</p>
            <select className="input-field text-sm" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">選擇</option>
              <option value="M">男</option>
              <option value="F">女</option>
            </select>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>體溫 (°C)</p>
            <input type="number" className="input-field text-sm" placeholder="36.5"
              step="0.1" value={temp} onChange={(e) => setTemp(e.target.value)} />
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>身高 (cm)</p>
            <input type="number" className="input-field text-sm" placeholder="170"
              value={height} onChange={(e) => setHeight(e.target.value)} />
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>體重 (kg)</p>
            <input type="number" className="input-field text-sm" placeholder="65"
              value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
          {bmi && (
            <div className="flex items-end pb-2">
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>BMI：</span>
              <span className="text-sm font-bold ml-1"
                style={{ color: parseFloat(bmi) >= 24 ? "var(--warning)" : parseFloat(bmi) < 18.5 ? "#60a5fa" : "var(--accent)" }}>
                {bmi}
              </span>
            </div>
          )}
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>收縮壓 (mmHg)</p>
            <input type="number" className="input-field text-sm" placeholder="120"
              value={bpSys} onChange={(e) => setBpSys(e.target.value)} />
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>舒張壓 (mmHg)</p>
            <input type="number" className="input-field text-sm" placeholder="80"
              value={bpDia} onChange={(e) => setBpDia(e.target.value)} />
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>心跳 (次/分)</p>
            <input type="number" className="input-field text-sm" placeholder="75"
              value={hr} onChange={(e) => setHr(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Submit */}
      <button onClick={submit} disabled={loading || !canSubmit}
        className="btn-primary w-full mb-6"
        style={{ opacity: loading || !canSubmit ? 0.6 : 1 }}>
        <span className="flex items-center justify-center gap-2">
          <Brain size={16} />
          AI 健康評估
        </span>
      </button>

      {/* Analyzing animation card */}
      {loading && (
        <div className="card p-6 mb-4 fade-in text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
            style={{ background: "var(--accent-dim)" }}>
            <Brain size={22} style={{ color: "var(--accent)" }} className="animate-pulse" />
          </div>
          <p className="font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>
            小C 正在分析中…
          </p>
          <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
            根據您的資料生成個人化建議
          </p>
          <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: "var(--border)" }}>
            <div className="analyzing-bar" style={{ background: "var(--accent)" }} />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg mb-4 fade-in"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertCircle size={16} color="var(--danger)" />
          <span className="text-sm" style={{ color: "var(--danger)" }}>{error}</span>
        </div>
      )}

      {/* Urgency badge + Result */}
      {result && (
        <div className="fade-in">
          {urgency && (
            <div className="flex items-center gap-3 p-4 rounded-xl mb-4"
              style={{ background: `${urgency.color}18`, border: `1px solid ${urgency.color}40` }}>
              <span className="text-3xl">{urgency.emoji}</span>
              <div>
                <p className="font-bold text-base" style={{ color: urgency.color }}>
                  {urgency.label}
                </p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {urgency.desc}
                </p>
              </div>
            </div>
          )}

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap size={16} style={{ color: "var(--accent)" }} />
                <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                  小C 的分析結果
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
                  {copied ? "已複製" : "複製"}
                </button>
              </div>
            </div>
            <div className="text-sm leading-relaxed">
              {renderMarkdown(result)}
            </div>
            <div className="mt-4 pt-3 text-xs"
              style={{ borderTop: "1px solid var(--border)", color: "var(--warning)" }}>
              ⚠️ 以上為 AI 參考資訊，不構成醫療診斷。如有疑慮請立即就醫。
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
