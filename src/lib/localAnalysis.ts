// Local analysis using reference ranges — no AI needed
// Works offline, instant response, used as primary analysis layer

import {
  REFERENCE_RANGES, CATEGORIES, checkAbnormal, getNormalRange,
  isHigh, isLow, isAbnormal, isCritical, type AbnormalStatus,
} from "./referenceRanges";

export interface AnalysisItem {
  key: string;
  label_zh: string;
  label_en: string;
  value: number;
  unit: string;
  status: AbnormalStatus;
  normalRange: string;
  explanation_zh: string;
  category: string;
  categoryLabel: string;
}

export interface AnalysisSummary {
  items: AnalysisItem[];
  abnormalCount: number;
  highCount: number;
  lowCount: number;
  normalCount: number;
  criticalCount: number;
  bmi?: number;
  riskFlags: string[];
  suggestions: string[];
}

export function analyzeLocally(
  data: Record<string, number | string>,
  gender?: "M" | "F"
): AnalysisSummary {
  // Auto-calculate BMI
  const height = Number(data.height);
  const weight = Number(data.weight);
  let bmi: number | undefined;
  if (height > 0 && weight > 0) {
    bmi = parseFloat((weight / ((height / 100) ** 2)).toFixed(1));
    if (!data.bmi) data = { ...data, bmi };
  }

  const items: AnalysisItem[] = [];

  for (const ref of REFERENCE_RANGES) {
    const raw = data[ref.key];
    if (raw === undefined || raw === "" || raw === null) continue;
    const value = Number(raw);
    if (isNaN(value)) continue;

    const status = checkAbnormal(ref, value, gender);
    const normalRange = getNormalRange(ref, gender);
    const cat = CATEGORIES[ref.category];

    items.push({
      key: ref.key,
      label_zh: ref.label_zh,
      label_en: ref.label_en,
      value,
      unit: ref.unit,
      status,
      normalRange,
      explanation_zh: ref.explanation_zh,
      category: ref.category,
      categoryLabel: cat?.label_zh ?? ref.category,
    });
  }

  // Sort: 嚴重異常 → 一般異常 → 正常 → 未知
  const order: Record<AbnormalStatus, number> = {
    critical_high: 0, critical_low: 0, high: 1, low: 1, normal: 2, unknown: 3,
  };
  items.sort((a, b) => order[a.status] - order[b.status]);

  const abnormalCount = items.filter(i => isAbnormal(i.status)).length;
  const highCount = items.filter(i => isHigh(i.status)).length;
  const lowCount = items.filter(i => isLow(i.status)).length;
  const normalCount = items.filter(i => i.status === "normal").length;
  const criticalCount = items.filter(i => isCritical(i.status)).length;

  // Generate risk flags
  const riskFlags: string[] = [];
  const find = (key: string) => items.find(i => i.key === key);

  const bp_s = find("systolic");
  const bp_d = find("diastolic");
  if (bp_s && bp_s.value >= 140) riskFlags.push("⚠️ 血壓偏高（≥140/90），建議就醫評估高血壓");
  else if (bp_s && bp_s.value >= 130) riskFlags.push("📋 血壓偏高（130-139），建議定期監測");

  const ldl = find("ldl");
  if (ldl && ldl.value >= 160) riskFlags.push("⚠️ LDL 膽固醇偏高，增加心血管疾病風險");

  const glucose = find("glucose");
  if (glucose && glucose.value >= 126) riskFlags.push("⚠️ 空腹血糖 ≥126，符合糖尿病診斷標準，請就醫確認");
  else if (glucose && glucose.value >= 100) riskFlags.push("📋 空腹血糖 100-125，屬於糖尿病前期，建議改善飲食");

  const bmiItem = find("bmi");
  const bmiVal = bmiItem?.value ?? bmi;
  if (bmiVal && bmiVal >= 27) riskFlags.push("📋 BMI 偏高，建議控制體重，降低代謝症候群風險");

  const egfr = find("egfr");
  if (egfr && egfr.value < 60) riskFlags.push("⚠️ eGFR < 60，腎功能可能下降，建議追蹤腎功能");

  const alt = find("alt");
  if (alt && alt.value > 80) riskFlags.push("⚠️ ALT 明顯升高，建議就醫檢查肝功能");

  // Suggestions
  const suggestions: string[] = [];
  if (abnormalCount === 0) {
    suggestions.push("✅ 所有檢測數值均在正常範圍內，請繼續維持健康生活習慣。");
  } else {
    if (criticalCount > 0) {
      suggestions.push(`🔴 其中 ${criticalCount} 項達「嚴重異常」門檻，建議儘速就醫評估。`);
    }
    suggestions.push(`共發現 ${abnormalCount} 項數值異常，建議您：`);
    if (highCount > 0) suggestions.push("• 針對偏高的數值，諮詢醫師是否需要進一步檢查或治療");
    if (lowCount > 0) suggestions.push("• 針對偏低的數值，留意飲食補充並定期追蹤");
    suggestions.push("• 建議 3-6 個月後重新檢測，追蹤數值變化");
    suggestions.push("⚠️ 以上分析僅供參考，不構成醫療診斷，請諮詢醫師獲得專業建議。");
  }

  return { items, abnormalCount, highCount, lowCount, normalCount, criticalCount, bmi, riskFlags, suggestions };
}

// Group items by category for display
export function groupByCategory(items: AnalysisItem[]) {
  const groups: Record<string, AnalysisItem[]> = {};
  for (const item of items) {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  }
  return groups;
}
