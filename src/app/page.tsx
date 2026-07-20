"use client";

import Link from "next/link";
import { ArrowRight, Brain, Languages, ScanLine, Activity, TestTube2, Heart, Pill, Gift, Sparkles, Camera, Moon } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

const featureIcons = [Gift, Sparkles, Camera, Languages, Moon];

export default function HomePage() {
  const { t, locale } = useLang();
  const s = t.home;

  const features = [
    s.features.f1,
    s.features.f2,
    s.features.f3,
    s.features.f4,
    s.features.f5,
  ];

  const sections = [
    {
      icon: <Brain size={22} />,
      href: "/analyze",
      title: s.sections.analyze.title,
      desc: s.sections.analyze.desc,
      badge: "Gemini AI",
      cta: "開始分析 / Analyze",
    },
    {
      icon: <Languages size={22} />,
      href: "/translate",
      title: s.sections.translate.title,
      desc: s.sections.translate.desc,
      badge: "ZH ↔ EN",
      cta: "立即翻譯 / Translate",
    },
    {
      icon: <ScanLine size={22} />,
      href: "/scan",
      title: s.sections.scan.title,
      desc: s.sections.scan.desc,
      badge: "OCR",
      cta: "上傳掃描 / Scan",
    },
  ];

  const metrics = [
    { icon: <Activity size={15} />, label: "血壓 · Blood Pressure" },
    { icon: <TestTube2 size={15} />, label: "血糖 · Glucose" },
    { icon: <Heart size={15} />, label: "膽固醇 · Cholesterol" },
    { icon: <Pill size={15} />, label: "肝腎功能 · Liver & Kidney" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">

      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto mb-16 fade-in">
        <p className="text-xs font-semibold tracking-widest mb-5 uppercase"
          style={{ color: "var(--text-secondary)" }}>
          {s.tagline}
        </p>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none">
          <span style={{ color: "var(--text-primary)" }}>{s.headline1}</span>
          <br />
          <span style={{ color: "var(--accent)" }}>{s.headline2}</span>
        </h1>

        <p className="text-base md:text-lg mt-6 mb-8 leading-relaxed max-w-2xl mx-auto"
          style={{ color: "var(--text-secondary)" }}>
          {s.sub}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/analyze" className="btn-primary">
            <Brain size={16} />
            {s.cta_analyze}
            <ArrowRight size={14} />
          </Link>
          <Link href="/translate" className="btn-ghost">
            <Languages size={16} />
            {s.cta_translate}
          </Link>
          <Link href="/scan" className="btn-ghost">
            <ScanLine size={16} />
            {s.cta_scan}
          </Link>
        </div>
      </div>

      {/* Feature badges */}
      <div className="flex flex-wrap justify-center gap-3 mb-16">
        {features.map((f, i) => {
          const Icon = featureIcons[i];
          return (
          <div key={i} className="card px-4 py-3 text-center min-w-[100px]">
            <Icon size={22} strokeWidth={2} className="mx-auto mb-1.5" style={{ color: "var(--brand)" }} />
            <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {f.title}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {f.desc}
            </div>
          </div>
          );
        })}
      </div>

      {/* Main function cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-12">
        {sections.map((sec, i) => (
          <Link key={i} href={sec.href} className="card p-6 group block">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
                {sec.icon}
              </div>
              <span className="badge">{sec.badge}</span>
            </div>
            <h3 className="font-bold text-base mb-2" style={{ color: "var(--text-primary)" }}>
              {sec.title}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {sec.desc}
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold"
              style={{ color: "var(--accent)" }}>
              {sec.cta}
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>

      {/* Health metrics section */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} style={{ color: "var(--accent)" }} />
          <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>
            可追蹤健康指標 · Tracked Health Metrics
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metrics.map((m, i) => (
            <div key={i} className="flex items-center gap-2 p-3 rounded-lg"
              style={{ background: "var(--bg-primary)" }}>
              <span style={{ color: "var(--accent)" }}>{m.icon}</span>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
