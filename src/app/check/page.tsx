"use client";

import Link from "next/link";
import { Zap, FlaskConical, ChevronRight } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

export default function CheckEntryPage() {
  const { t } = useLang();
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          {t.check.select_title}
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {t.check.select_sub}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Simple */}
        <Link href="/check/simple"
          className="card p-6 flex flex-col gap-4 transition-all hover:scale-[1.02] cursor-pointer group"
          style={{ border: "1px solid var(--border)" }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(0,212,170,0.12)" }}>
            <Zap size={24} style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                {t.check.simple_title}
              </h2>
              <ChevronRight size={18} style={{ color: "var(--text-secondary)" }}
                className="group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              描述症狀、感受，或輸入基本數據（血壓、體溫等），AI 評估就醫緊急程度
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {["症狀勾選", "自由描述", "緊急度評估", "適合一般民眾"].map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
                {tag}
              </span>
            ))}
          </div>
        </Link>

        {/* Detail */}
        <Link href="/check/detail"
          className="card p-6 flex flex-col gap-4 transition-all hover:scale-[1.02] cursor-pointer group"
          style={{ border: "1px solid var(--border)" }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(96,165,250,0.12)" }}>
            <FlaskConical size={24} style={{ color: "#60a5fa" }} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                {t.check.detail_title}
              </h2>
              <ChevronRight size={18} style={{ color: "var(--text-secondary)" }}
                className="group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              輸入體檢報告數值，對照完整參考範圍，AI 深度解讀各項指標
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {["🫘 慢性腎臟病 + 糖尿病", "心血管", "肝腎功能", "30+ 項目"].map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(96,165,250,0.12)", color: "#60a5fa" }}>
                {tag}
              </span>
            ))}
          </div>
        </Link>
      </div>

      <p className="text-xs text-center mt-8" style={{ color: "var(--text-secondary)", opacity: 0.6 }}>
        ⚠️ 本平台僅供健康參考，不構成醫療診斷。如有不適請立即就醫。
      </p>
    </div>
  );
}
