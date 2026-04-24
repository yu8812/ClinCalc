"use client";

import { useState } from "react";

// 身體部位與對應症狀的映射關係
const BODY_REGIONS = [
  { id: "head",    label: "頭部",   emoji: "🧠", color: "#7c3aed",
    symptoms: ["頭痛", "頭暈", "視力模糊", "耳鳴", "失眠"] },
  { id: "throat",  label: "喉嚨",   emoji: "🗣️", color: "#2563eb",
    symptoms: ["喉嚨痛", "咳嗽", "鼻塞流鼻水", "呼吸困難"] },
  { id: "chest",   label: "胸部",   emoji: "❤️", color: "#dc2626",
    symptoms: ["胸悶胸痛", "心悸", "呼吸困難"] },
  { id: "abdomen", label: "腹部",   emoji: "🫃", color: "#d97706",
    symptoms: ["腹痛", "噁心嘔吐", "腹瀉", "便秘", "食慾不振"] },
  { id: "back",    label: "腰背",   emoji: "🔩", color: "#0891b2",
    symptoms: ["腰背痛"] },
  { id: "limbs",   label: "四肢",   emoji: "🦵", color: "#059669",
    symptoms: ["關節痛", "水腫"] },
  { id: "general", label: "全身",   emoji: "🌡️", color: "#64748b",
    symptoms: ["發燒", "畏寒", "疲勞倦怠", "體重驟降", "皮膚起疹", "尿量異常"] },
] as const;

type RegionId = typeof BODY_REGIONS[number]["id"];

interface BodyMapProps {
  selected: string[];
  onToggle: (symptom: string) => void;
}

export default function BodyMap({ selected, onToggle }: BodyMapProps) {
  const [activeRegion, setActiveRegion] = useState<RegionId | null>(null);

  const getRegion = (id: RegionId) => BODY_REGIONS.find(r => r.id === id)!;

  const hasSelected = (id: RegionId) =>
    getRegion(id).symptoms.some(s => selected.includes(s));

  const fill = (id: RegionId) => {
    if (hasSelected(id)) return getRegion(id).color + "33";
    if (activeRegion === id) return getRegion(id).color + "22";
    return "var(--bg-card)";
  };

  const stroke = (id: RegionId) =>
    hasSelected(id) || activeRegion === id ? getRegion(id).color : "var(--border)";

  const toggle = (id: RegionId) =>
    setActiveRegion(prev => prev === id ? null : id);

  const activeData = activeRegion ? getRegion(activeRegion) : null;

  // SVG region props factory
  const rp = (id: RegionId) => ({
    fill: fill(id),
    stroke: stroke(id),
    strokeWidth: hasSelected(id) || activeRegion === id ? "2" : "1.5",
    style: { cursor: "pointer" as const, transition: "all 0.15s" },
    onClick: () => toggle(id),
  });

  return (
    <div className="flex gap-4 items-start">
      {/* SVG 人體圖 */}
      <div className="flex flex-col items-center shrink-0">
        <svg viewBox="0 0 120 290" width="110" height="270">
          {/* 頭 */}
          <circle cx="60" cy="22" r="18" {...rp("head")} />
          <text x="60" y="26" textAnchor="middle" fontSize="7.5"
            fill={activeRegion === "head" || hasSelected("head") ? getRegion("head").color : "var(--text-secondary)"}
            style={{ pointerEvents: "none", fontWeight: hasSelected("head") ? "bold" : "normal" }}>頭部</text>

          {/* 脖子 */}
          <rect x="52" y="39" width="16" height="12" rx="4" {...rp("throat")} />

          {/* 胸部 */}
          <rect x="33" y="50" width="54" height="46" rx="7" {...rp("chest")} />
          <text x="60" y="77" textAnchor="middle" fontSize="7.5"
            fill={activeRegion === "chest" || hasSelected("chest") ? getRegion("chest").color : "var(--text-secondary)"}
            style={{ pointerEvents: "none", fontWeight: hasSelected("chest") ? "bold" : "normal" }}>胸部</text>

          {/* 腹部 */}
          <rect x="33" y="96" width="54" height="47" rx="7" {...rp("abdomen")} />
          <text x="60" y="123" textAnchor="middle" fontSize="7.5"
            fill={activeRegion === "abdomen" || hasSelected("abdomen") ? getRegion("abdomen").color : "var(--text-secondary)"}
            style={{ pointerEvents: "none", fontWeight: hasSelected("abdomen") ? "bold" : "normal" }}>腹部</text>

          {/* 連接臀部 */}
          <rect x="36" y="142" width="48" height="12" rx="4"
            fill="var(--bg-card)" stroke="var(--border)" strokeWidth="1" />

          {/* 左臂 */}
          <rect x="16" y="50" width="17" height="68" rx="7" {...rp("limbs")} />
          {/* 右臂 */}
          <rect x="87" y="50" width="17" height="68" rx="7" {...rp("limbs")} />

          {/* 左大腿 */}
          <rect x="33" y="153" width="23" height="57" rx="8" {...rp("limbs")} />
          {/* 右大腿 */}
          <rect x="64" y="153" width="23" height="57" rx="8" {...rp("limbs")} />

          {/* 左小腿 */}
          <rect x="34" y="209" width="21" height="52" rx="7" {...rp("limbs")} />
          {/* 右小腿 */}
          <rect x="65" y="209" width="21" height="52" rx="7" {...rp("limbs")} />
        </svg>

        {/* 腰背 + 全身 按鈕（不在SVG前視圖內） */}
        <div className="flex gap-2 mt-1 w-full justify-center">
          {(["back", "general"] as RegionId[]).map((id) => {
            const r = getRegion(id);
            const sel = hasSelected(id);
            const active = activeRegion === id;
            return (
              <button key={id} onClick={() => toggle(id)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: sel ? r.color + "22" : active ? r.color + "11" : "var(--bg-card)",
                  border: `1px solid ${sel || active ? r.color : "var(--border)"}`,
                  color: sel || active ? r.color : "var(--text-secondary)",
                }}>
                {r.emoji} {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 右側：症狀 chips 面板 */}
      <div className="flex-1 min-w-0">
        {activeData ? (
          <div className="fade-in">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold" style={{ color: activeData.color }}>
                {activeData.emoji} {activeData.label}不適
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: activeData.color + "22", color: activeData.color }}>
                點擊選擇
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeData.symptoms.map((s) => (
                <button key={s} onClick={() => onToggle(s)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: selected.includes(s) ? activeData.color : "var(--bg-primary)",
                    color: selected.includes(s) ? "#fff" : "var(--text-secondary)",
                    border: `1px solid ${selected.includes(s) ? activeData.color : "var(--border)"}`,
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-4xl mb-3">👈</div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>點擊身體部位</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>選擇對應的不舒服症狀</p>
          </div>
        )}

        {/* 已選症狀彙整 */}
        {selected.length > 0 && (
          <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-xs mb-2 font-medium" style={{ color: "var(--text-secondary)" }}>
              已勾選 {selected.length} 項（點擊取消）
            </p>
            <div className="flex flex-wrap gap-1.5">
              {selected.map((s) => {
                const region = BODY_REGIONS.find(r => r.symptoms.includes(s as never));
                return (
                  <span key={s} onClick={() => onToggle(s)}
                    className="px-2.5 py-0.5 rounded-full text-xs cursor-pointer flex items-center gap-1"
                    style={{
                      background: region ? region.color + "20" : "var(--bg-card)",
                      color: region ? region.color : "var(--text-secondary)",
                      border: `1px solid ${region ? region.color + "50" : "var(--border)"}`,
                    }}>
                    {s} ×
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
