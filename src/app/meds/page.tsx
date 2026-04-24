"use client";

import { useState, useEffect, useMemo } from "react";
import { Pill, Search, ChevronDown, ChevronUp, AlertTriangle, ShieldCheck, X } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useLang } from "@/contexts/LanguageContext";

interface Medication {
  id: string;
  name_zh: string;
  name_en: string;
  generic_name: string;
  category: string;
  uses_zh: string;
  side_effects_zh: string;
  common_dosage: string;
  warnings_zh: string;
  interactions: string[];
  prescription_required: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  "鈣離子阻斷劑": "#60a5fa",
  "ARB（血管張力素受體阻斷劑）": "#60a5fa",
  "ARB": "#60a5fa",
  "ACE 抑制劑": "#60a5fa",
  "乙型阻斷劑": "#60a5fa",
  "雙胍類降血糖藥": "#34d399",
  "磺醯脲類": "#34d399",
  "SGLT-2 抑制劑": "#34d399",
  "DPP-4 抑制劑": "#34d399",
  "速效胰島素": "#34d399",
  "Statin（他汀類）": "#a78bfa",
  "Statin": "#a78bfa",
  "膽固醇吸收抑制劑": "#a78bfa",
  "抗血小板藥": "#f87171",
  "非類固醇消炎藥/抗血小板": "#f87171",
  "抗凝血藥": "#f87171",
  "質子幫浦抑制劑（PPI）": "#fbbf24",
  "H2 受體阻斷劑": "#fbbf24",
  "青黴素類抗生素": "#fb923c",
  "大環內酯類抗生素": "#fb923c",
  "NSAIDs（非類固醇消炎藥）": "#f472b6",
  "退燒止痛藥": "#f472b6",
  "短效乙二型支氣管擴張劑": "#22d3ee",
  "吸入型類固醇 + 長效支氣管擴張劑": "#22d3ee",
  "SSRI（選擇性血清素回收抑制劑）": "#c084fc",
  "SSRI": "#c084fc",
  "甲狀腺素補充劑": "#86efac",
  "黃嘌呤氧化酶抑制劑": "#fde68a",
  "抗炎藥": "#fde68a",
};

function getCategoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? "#00D4AA";
}

function MedCard({ med }: { med: Medication }) {
  const [open, setOpen] = useState(false);
  const { t } = useLang();
  const color = getCategoryColor(med.category);

  return (
    <div className="card mb-3 overflow-hidden">
      <button
        className="w-full text-left p-4 flex items-start justify-between gap-3"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: `${color}22` }}>
            <Pill size={16} style={{ color }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                {med.name_zh}
              </span>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {med.name_en}
              </span>
              {med.generic_name && med.generic_name !== med.name_en && (
                <span className="text-xs italic" style={{ color: "var(--text-secondary)", opacity: 0.7 }}>
                  ({med.generic_name})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: `${color}22`, color }}>
                {med.category}
              </span>
              {med.prescription_required ? (
                <span className="text-xs flex items-center gap-1" style={{ color: "#f87171" }}>
                  <AlertTriangle size={10} /> {t.meds.prescription}
                </span>
              ) : (
                <span className="text-xs flex items-center gap-1" style={{ color: "#34d399" }}>
                  <ShieldCheck size={10} /> {t.meds.otc}
                </span>
              )}
            </div>
            <p className="text-xs mt-1.5 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
              {med.uses_zh}
            </p>
          </div>
        </div>
        <div className="shrink-0 mt-1" style={{ color: "var(--text-secondary)" }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
            {/* uses */}
            <div className="p-3 rounded-xl" style={{ background: "var(--bg-base)" }}>
              <p className="text-xs font-semibold mb-1" style={{ color }}>{t.meds.uses}</p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {med.uses_zh}
              </p>
            </div>
            {/* side effects */}
            {med.side_effects_zh && (
              <div className="p-3 rounded-xl" style={{ background: "var(--bg-base)" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "#f87171" }}>{t.meds.side_effects}</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {med.side_effects_zh}
                </p>
              </div>
            )}
            {/* dosage */}
            {med.common_dosage && (
              <div className="p-3 rounded-xl" style={{ background: "var(--bg-base)" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "#fbbf24" }}>{t.meds.dosage}</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {med.common_dosage}
                </p>
              </div>
            )}
            {/* warnings */}
            {med.warnings_zh && (
              <div className="p-3 rounded-xl" style={{ background: "var(--bg-base)" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "#f59e0b" }}>⚠️ {t.meds.warnings}</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {med.warnings_zh}
                </p>
              </div>
            )}
          </div>

          {/* interactions */}
          {med.interactions && med.interactions.length > 0 && (
            <div className="p-3 rounded-xl" style={{ background: "var(--bg-base)" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "#f87171" }}>
                ⚡ {t.meds.interactions}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {med.interactions.map((item, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(248,113,113,0.12)", color: "#f87171" }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MedsPage() {
  const { t } = useLang();
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("medications")
      .select("*")
      .order("name_zh")
      .then(({ data }) => {
        setMeds(data ?? []);
        setLoading(false);
      });
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(meds.map((m) => m.category)));
    return cats.sort();
  }, [meds]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return meds.filter((m) => {
      const matchCat = catFilter === "all" || m.category === catFilter;
      const matchSearch =
        !q ||
        m.name_zh.toLowerCase().includes(q) ||
        m.name_en.toLowerCase().includes(q) ||
        m.generic_name?.toLowerCase().includes(q) ||
        m.uses_zh.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [meds, search, catFilter]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {t.meds.title}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {loading ? t.meds.loading : `${meds.length} ${t.meds.count_suffix}`}
          </p>
        </div>
        <Pill size={24} style={{ color: "var(--accent)" }} />
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--text-secondary)" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.meds.search_placeholder}
          className="input-field w-full pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-secondary)" }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category filter */}
      {!loading && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          <button
            onClick={() => setCatFilter("all")}
            className="shrink-0 text-xs px-3 py-1.5 rounded-full transition-all"
            style={{
              background: catFilter === "all" ? "var(--accent)" : "var(--bg-card)",
              color: catFilter === "all" ? "#000" : "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}>
            全部 ({meds.length})
          </button>
          {categories.map((cat) => {
            const count = meds.filter((m) => m.category === cat).length;
            const active = catFilter === cat;
            const color = getCategoryColor(cat);
            return (
              <button key={cat} onClick={() => setCatFilter(cat)}
                className="shrink-0 text-xs px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: active ? `${color}33` : "var(--bg-card)",
                  color: active ? color : "var(--text-secondary)",
                  border: `1px solid ${active ? color : "var(--border)"}`,
                }}>
                {cat} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="text-center py-16">
          <div className="flex justify-center gap-1 mb-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="loading-dot"
                style={{ animationDelay: `${i * 0.2}s`, background: "var(--accent)" }} />
            ))}
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t.meds.loading}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Pill size={40} className="mx-auto mb-3" style={{ color: "var(--text-secondary)", opacity: 0.3 }} />
          <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            {t.meds.no_results}
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            試試其他關鍵字
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
            顯示 {filtered.length} 筆結果
          </p>
          {filtered.map((med) => (
            <MedCard key={med.id} med={med} />
          ))}
        </>
      )}

      {/* Disclaimer */}
      <div className="mt-6 p-3 rounded-lg text-xs text-center"
        style={{ background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
        藥物資訊僅供參考，實際用藥請遵照醫師或藥師指示。
      </div>
    </div>
  );
}
