"use client";

import { useState } from "react";
import { X, TrendingUp, TrendingDown, Brain } from "lucide-react";
import { REFERENCE_RANGES } from "@/lib/referenceRanges";
import { renderMarkdown } from "@/lib/renderMarkdown";

interface TrendPoint {
  date: string;
  value: number;
}

interface TrendChartProps {
  metricKey: string;
  points: TrendPoint[];
  gender?: "M" | "F";
  onClose: () => void;
}

export default function TrendChart({ metricKey, points, gender, onClose }: TrendChartProps) {
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const analyzeWithAI = async () => {
    setAiLoading(true);
    setAiResult("");
    const refItem = REFERENCE_RANGES.find((r) => r.key === metricKey);
    const trendText = points
      .map((p) => `${p.date.slice(0, 10)}：${p.value} ${refItem?.unit ?? ""}`)
      .join("\n");
    const normalRange = refItem
      ? (gender === "M" ? refItem.normal?.male : gender === "F" ? refItem.normal?.female : undefined) ??
        refItem.normal?.general
      : undefined;
    const rangeText = normalRange
      ? `正常範圍：${normalRange.min ?? ""}${normalRange.min && normalRange.max ? "–" : "≤"}${normalRange.max ?? ""}`
      : "";
    const prompt = `請分析以下健康指標的歷史趨勢，判斷趨勢是否健康，並給出具體建議（不推薦藥物名稱）：\n\n指標：${refItem?.label_zh ?? metricKey}\n${rangeText}\n\n歷史數值（由舊到新）：\n${trendText}`;
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "analyze", text: prompt }),
      });
      const data = await res.json();
      setAiResult(data.result ?? data.message ?? "分析失敗，請稍後再試");
    } catch {
      setAiResult("分析失敗，請稍後再試");
    } finally {
      setAiLoading(false);
    }
  };

  const ref = REFERENCE_RANGES.find((r) => r.key === metricKey);

  const normalRange =
    (gender === "M" ? ref?.normal?.male : gender === "F" ? ref?.normal?.female : undefined) ??
    ref?.normal?.general;

  const W = 480, H = 160;
  const PAD = { t: 24, r: 20, b: 36, l: 44 };

  const values = points.map((p) => p.value);
  const extValues = [...values];
  if (normalRange?.min != null) extValues.push(normalRange.min * 0.92);
  if (normalRange?.max != null) extValues.push(normalRange.max * 1.08);
  const yMin = Math.min(...extValues);
  const yMax = Math.max(...extValues);
  const yRange = yMax - yMin || 1;

  const toX = (i: number) =>
    PAD.l +
    (points.length === 1
      ? (W - PAD.l - PAD.r) / 2
      : (i / (points.length - 1)) * (W - PAD.l - PAD.r));
  const toY = (v: number) => PAD.t + (1 - (v - yMin) / yRange) * (H - PAD.t - PAD.b);

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(p.value).toFixed(1)}`)
    .join(" ");

  const last = points[points.length - 1];
  const first = points[0];
  const pctChange =
    points.length >= 2 ? ((last.value - first.value) / (Math.abs(first.value) || 1)) * 100 : null;

  const isRising = pctChange != null && pctChange > 0;
  const lastAbnormal =
    (normalRange?.min != null && last.value < normalRange.min) ||
    (normalRange?.max != null && last.value > normalRange.max);

  function fmtDate(iso: string) {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  function fmtY(v: number) {
    return v % 1 === 0 ? v.toFixed(0) : v.toFixed(1);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-5"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
              {ref?.label_zh ?? metricKey}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {ref?.unit}
              {normalRange?.min != null && normalRange?.max != null && (
                <span className="ml-2" style={{ color: "#22c55e" }}>
                  正常值 {normalRange.min}–{normalRange.max}
                </span>
              )}
              {normalRange?.max != null && normalRange?.min == null && (
                <span className="ml-2" style={{ color: "#22c55e" }}>
                  正常值 ≤ {normalRange.max}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:opacity-70"
            style={{ background: "var(--bg-base)", color: "var(--text-secondary)" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* SVG Chart */}
        <div className="rounded-xl p-3" style={{ background: "var(--bg-base)" }}>
          <svg
            width="100%"
            viewBox={`0 0 ${W} ${H}`}
            style={{ overflow: "visible", display: "block" }}
          >
            {/* Normal range band */}
            {normalRange?.min != null && normalRange?.max != null && (
              <rect
                x={PAD.l}
                y={toY(normalRange.max)}
                width={W - PAD.l - PAD.r}
                height={Math.max(0, toY(normalRange.min) - toY(normalRange.max))}
                fill="rgba(34,197,94,0.12)"
                rx={3}
              />
            )}
            {/* Only max line */}
            {normalRange?.max != null && normalRange?.min == null && (
              <line
                x1={PAD.l} y1={toY(normalRange.max)}
                x2={W - PAD.r} y2={toY(normalRange.max)}
                stroke="rgba(34,197,94,0.4)" strokeWidth={1} strokeDasharray="4,3"
              />
            )}

            {/* Y-axis labels */}
            <text x={PAD.l - 6} y={PAD.t + 4} fontSize={9} fill="var(--text-secondary)" textAnchor="end">
              {fmtY(yMax)}
            </text>
            <text x={PAD.l - 6} y={H - PAD.b + 2} fontSize={9} fill="var(--text-secondary)" textAnchor="end">
              {fmtY(yMin)}
            </text>

            {/* Line */}
            {points.length >= 2 && (
              <path
                d={pathD}
                stroke="var(--accent)"
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Dots */}
            {points.map((p, i) => {
              const lo = normalRange?.min;
              const hi = normalRange?.max;
              const abnormal =
                (lo != null && p.value < lo) || (hi != null && p.value > hi);
              const isLast = i === points.length - 1;
              return (
                <g key={i}>
                  <circle
                    cx={toX(i)}
                    cy={toY(p.value)}
                    r={isLast ? 5 : 4}
                    fill={abnormal ? "#ef4444" : "var(--accent)"}
                    stroke="var(--bg-card)"
                    strokeWidth={2}
                  />
                  {/* Value label on last dot */}
                  {isLast && (
                    <text
                      x={toX(i)}
                      y={toY(p.value) - 9}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight={700}
                      fill={abnormal ? "#ef4444" : "var(--text-primary)"}
                    >
                      {p.value}
                    </text>
                  )}
                </g>
              );
            })}

            {/* X-axis dates */}
            {points.map((p, i) => (
              <text
                key={i}
                x={toX(i)}
                y={H - PAD.b + 16}
                textAnchor="middle"
                fontSize={9}
                fill="var(--text-secondary)"
              >
                {fmtDate(p.date)}
              </text>
            ))}
          </svg>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between mt-3 px-1">
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
            共 <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{points.length}</span> 筆記錄
          </div>
          <div className="flex items-center gap-3">
            {pctChange !== null && (
              <div
                className="flex items-center gap-1 text-xs font-semibold"
                style={{ color: Math.abs(pctChange) < 5 ? "var(--text-secondary)" : isRising ? "#f59e0b" : "#22c55e" }}
              >
                {isRising ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {Math.abs(pctChange).toFixed(1)}% vs 初次記錄
              </div>
            )}
            {lastAbnormal && (
              <div className="text-xs font-semibold" style={{ color: "#ef4444" }}>
                ⚠ 最新值異常
              </div>
            )}
          </div>
        </div>

        {/* AI trend analysis */}
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          {!aiResult && (
            <button
              onClick={analyzeWithAI}
              disabled={aiLoading}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80"
              style={{ background: "var(--bg-base)", color: "var(--accent)", border: "1px solid var(--border)" }}
            >
              {aiLoading ? (
                <>
                  <Brain size={13} className="animate-pulse" />
                  小C 正在分析趨勢…
                </>
              ) : (
                <>
                  <Brain size={13} />
                  讓小C分析此趨勢
                </>
              )}
            </button>
          )}
          {aiResult && (
            <div className="text-xs leading-relaxed mt-1">
              {renderMarkdown(aiResult)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
