// Medical reference ranges - structured to match future Supabase table
// Source: Chang Gung Hospital, WHO, ADA 2026, ACC/AHA guidelines
// This can be replaced with a Supabase query when shared DB is ready

export interface ReferenceItem {
  key: string;
  label_zh: string;
  label_en: string;
  unit: string;
  explanation_zh: string; // plain language for general public
  normal: {
    male?: { min?: number; max?: number; text?: string };
    female?: { min?: number; max?: number; text?: string };
    general?: { min?: number; max?: number; text?: string };
  };
  warning_high?: number;   // alert threshold high
  warning_low?: number;    // alert threshold low
  category: string;
  source?: string;
  type: "number" | "text" | "select";
  options?: string[];      // for select type
}

export const REFERENCE_RANGES: ReferenceItem[] = [
  // ── 血液常規 Blood Routine ──
  {
    key: "wbc",
    label_zh: "白血球",
    label_en: "White Blood Cell (WBC)",
    unit: "1000/uL",
    explanation_zh: "白血球是身體免疫系統的主要士兵，負責對抗細菌和病毒。數值過高可能代表感染或發炎；過低可能代表免疫力下降。",
    normal: { general: { min: 3.9, max: 10.6 } },
    warning_high: 15,
    warning_low: 2,
    category: "blood",
    source: "Chang Gung",
    type: "number",
  },
  {
    key: "hemoglobin",
    label_zh: "血色素",
    label_en: "Hemoglobin (Hb)",
    unit: "g/dL",
    explanation_zh: "血色素負責把氧氣運送到全身。過低稱為貧血，會覺得疲倦、頭暈；過高可能代表血液太濃稠。",
    normal: {
      male: { min: 13.5, max: 17.5 },
      female: { min: 12.0, max: 16.0 },
    },
    warning_low: 8,
    category: "blood",
    type: "number",
  },
  {
    key: "hematocrit",
    label_zh: "血球容積比",
    label_en: "Hematocrit (Hct)",
    unit: "%",
    explanation_zh: "血液中紅血球所佔的比例，和血色素一起判斷是否有貧血。",
    normal: {
      male: { min: 40, max: 52 },
      female: { min: 36, max: 46 },
    },
    category: "blood",
    type: "number",
  },
  {
    key: "platelet",
    label_zh: "血小板",
    label_en: "Platelet (PLT)",
    unit: "1000/uL",
    explanation_zh: "血小板負責讓傷口凝血止血。過低容易出血不止；過高則血液容易凝固，增加血栓風險。",
    normal: { general: { min: 150, max: 400 } },
    warning_low: 50,
    warning_high: 600,
    category: "blood",
    type: "number",
  },

  // ── 肝功能 Liver Function ──
  {
    key: "alt",
    label_zh: "丙胺酸轉胺酶（ALT/GPT）",
    label_en: "Alanine Aminotransferase (ALT/GPT)",
    unit: "U/L",
    explanation_zh: "ALT 是肝臟健康最重要的指標。數值升高代表肝細胞受損，常見原因包括脂肪肝、飲酒、病毒性肝炎或藥物影響。",
    normal: {
      male: { max: 40 },
      female: { max: 36 },
      general: { max: 36 },
    },
    warning_high: 120,
    category: "liver",
    source: "Chang Gung",
    type: "number",
  },
  {
    key: "ast",
    label_zh: "天門冬胺酸轉胺酶（AST/GOT）",
    label_en: "Aspartate Aminotransferase (AST/GOT)",
    unit: "U/L",
    explanation_zh: "AST 存在於肝臟、心臟和肌肉，升高時需配合 ALT 一起判斷。若 AST 升高但 ALT 正常，可能是心臟或肌肉問題。",
    normal: { general: { max: 40 } },
    warning_high: 120,
    category: "liver",
    type: "number",
  },
  {
    key: "ggt",
    label_zh: "麩胺酸轉肽酶（GGT）",
    label_en: "Gamma-Glutamyl Transferase (GGT)",
    unit: "U/L",
    explanation_zh: "GGT 對飲酒和膽道問題很敏感，是評估酒精性肝病的重要指標。",
    normal: {
      male: { max: 61 },
      female: { max: 36 },
    },
    category: "liver",
    type: "number",
  },
  {
    key: "albumin",
    label_zh: "白蛋白",
    label_en: "Albumin",
    unit: "g/dL",
    explanation_zh: "白蛋白是肝臟製造的主要蛋白質，偏低可能代表肝功能不佳或營養不良。",
    normal: { general: { min: 3.5, max: 5.0 } },
    warning_low: 3.0,
    category: "liver",
    type: "number",
  },
  {
    key: "total_bilirubin",
    label_zh: "總膽紅素",
    label_en: "Total Bilirubin",
    unit: "mg/dL",
    explanation_zh: "膽紅素是紅血球分解後的產物，由肝臟處理。過高會造成黃疸（皮膚和眼白變黃）。",
    normal: { general: { max: 1.2 } },
    warning_high: 3.0,
    category: "liver",
    type: "number",
  },

  // ── 腎功能 Kidney Function ──
  {
    key: "creatinine",
    label_zh: "肌酸酐",
    label_en: "Creatinine (Cr)",
    unit: "mg/dL",
    explanation_zh: "肌酸酐是肌肉代謝產物，由腎臟排出。過高代表腎臟過濾能力下降，是慢性腎病的重要指標。",
    normal: {
      male: { min: 0.64, max: 1.27 },
      female: { min: 0.50, max: 1.04 },
    },
    warning_high: 3.0,
    category: "kidney",
    source: "Chang Gung",
    type: "number",
  },
  {
    key: "egfr",
    label_zh: "腎絲球過濾率（eGFR）",
    label_en: "Estimated GFR (eGFR)",
    unit: "mL/min/1.73m²",
    explanation_zh: "eGFR 直接反映腎臟過濾血液的能力。正常值 ≥60；低於 60 超過 3 個月就是慢性腎臟病；低於 15 需要洗腎評估。",
    normal: { general: { min: 60 } },
    warning_low: 30,
    category: "kidney",
    source: "KDIGO 2024",
    type: "number",
  },
  {
    key: "bun",
    label_zh: "血中尿素氮（BUN）",
    label_en: "Blood Urea Nitrogen (BUN)",
    unit: "mg/dL",
    explanation_zh: "BUN 是蛋白質代謝的廢物，腎臟過濾後排出。過高可能是腎功能不好，或蛋白質攝取過多。",
    normal: { general: { min: 7, max: 25 } },
    warning_high: 60,
    category: "kidney",
    type: "number",
  },
  {
    key: "uric_acid",
    label_zh: "尿酸",
    label_en: "Uric Acid",
    unit: "mg/dL",
    explanation_zh: "尿酸是普林代謝的產物。過高會沉積在關節造成痛風，長期過高也會傷害腎臟。",
    normal: {
      male: { max: 7.0 },
      female: { max: 6.0 },
    },
    warning_high: 9.0,
    category: "kidney",
    type: "number",
  },

  // ── 新陳代謝 Metabolism ──
  {
    key: "glucose",
    label_zh: "空腹血糖",
    label_en: "Fasting Glucose",
    unit: "mg/dL",
    explanation_zh: "空腹 8 小時後測量的血糖。70-100 為正常；100-125 為糖尿病前期；≥126 為糖尿病診斷標準（需重複確認）。",
    normal: { general: { min: 74, max: 100 } },
    warning_high: 200,
    category: "metabolism",
    source: "ADA 2026",
    type: "number",
  },
  {
    key: "hba1c",
    label_zh: "糖化血色素（HbA1c）",
    label_en: "Glycated Hemoglobin (HbA1c)",
    unit: "%",
    explanation_zh: "反映過去 2-3 個月的平均血糖。<5.7% 正常；5.7-6.4% 糖尿病前期；≥6.5% 糖尿病。是追蹤糖尿病控制最重要的指標。",
    normal: { general: { max: 5.6 } },
    warning_high: 8.0,
    category: "metabolism",
    source: "ADA 2026",
    type: "number",
  },
  {
    key: "total_cholesterol",
    label_zh: "總膽固醇",
    label_en: "Total Cholesterol",
    unit: "mg/dL",
    explanation_zh: "血液中所有脂肪的總量。過高會增加心臟病和中風風險，但也需要搭配 LDL、HDL 一起評估。",
    normal: { general: { max: 200 } },
    warning_high: 240,
    category: "metabolism",
    source: "ACC/AHA 2022",
    type: "number",
  },
  {
    key: "ldl",
    label_zh: "低密度脂蛋白膽固醇（LDL-C）",
    label_en: "LDL Cholesterol (LDL-C)",
    unit: "mg/dL",
    explanation_zh: "俗稱「壞膽固醇」，會堆積在血管壁造成動脈硬化。一般人希望低於 100；有心臟病者建議低於 70。",
    normal: { general: { max: 100 } },
    warning_high: 160,
    category: "metabolism",
    source: "ACC/AHA 2022",
    type: "number",
  },
  {
    key: "hdl",
    label_zh: "高密度脂蛋白膽固醇（HDL-C）",
    label_en: "HDL Cholesterol (HDL-C)",
    unit: "mg/dL",
    explanation_zh: "俗稱「好膽固醇」，可以把血管壁上的膽固醇帶回肝臟處理。越高越好，低於 40 是心臟病風險因子。",
    normal: {
      male: { min: 40 },
      female: { min: 50 },
    },
    warning_low: 35,
    category: "metabolism",
    type: "number",
  },
  {
    key: "triglyceride",
    label_zh: "三酸甘油脂",
    label_en: "Triglyceride (TG)",
    unit: "mg/dL",
    explanation_zh: "血液中的脂肪，主要來自飲食中的糖分和澱粉。過高與脂肪肝、代謝症候群有關，也會增加胰臟炎風險。",
    normal: { general: { max: 150 } },
    warning_high: 500,
    category: "metabolism",
    type: "number",
  },

  // ── 生命徵象 Vital Signs ──
  {
    key: "systolic",
    label_zh: "收縮壓（高壓）",
    label_en: "Systolic Blood Pressure",
    unit: "mmHg",
    explanation_zh: "心臟收縮時的血壓，俗稱「高壓」。正常低於 120；120-129 為偏高；130-139 為高血壓一期；≥140 為高血壓二期。",
    normal: { general: { max: 120 } },
    warning_high: 180,
    category: "vitals",
    type: "number",
  },
  {
    key: "diastolic",
    label_zh: "舒張壓（低壓）",
    label_en: "Diastolic Blood Pressure",
    unit: "mmHg",
    explanation_zh: "心臟舒張時的血壓，俗稱「低壓」。正常低於 80；80-89 為高血壓一期；≥90 為高血壓二期。",
    normal: { general: { max: 80 } },
    warning_high: 120,
    category: "vitals",
    type: "number",
  },
  {
    key: "pulse",
    label_zh: "脈搏／心率",
    label_en: "Heart Rate / Pulse",
    unit: "次/min",
    explanation_zh: "每分鐘心跳次數。正常成人為 60-100 次；運動員可能低於 60 屬於正常；超過 100 稱為心跳過速。",
    normal: { general: { min: 60, max: 100 } },
    warning_high: 120,
    warning_low: 40,
    category: "vitals",
    type: "number",
  },
  {
    key: "spo2",
    label_zh: "血氧濃度（SpO2）",
    label_en: "Oxygen Saturation (SpO2)",
    unit: "%",
    explanation_zh: "血液中氧氣的飽和程度。正常應在 95% 以上；低於 90% 需要立即就醫。",
    normal: { general: { min: 95 } },
    warning_low: 90,
    category: "vitals",
    type: "number",
  },
  {
    key: "temperature",
    label_zh: "體溫",
    label_en: "Body Temperature",
    unit: "°C",
    explanation_zh: "正常體溫 36-37.5°C；超過 38°C 為發燒；低於 35°C 為低體溫。",
    normal: { general: { min: 36.0, max: 37.5 } },
    warning_high: 39.0,
    category: "vitals",
    type: "number",
  },

  // ── 身體測量 Body Measurements ──
  {
    key: "height",
    label_zh: "身高",
    label_en: "Height",
    unit: "cm",
    explanation_zh: "身高用於計算 BMI。",
    normal: { general: {} },
    category: "body",
    type: "number",
  },
  {
    key: "weight",
    label_zh: "體重",
    label_en: "Weight",
    unit: "kg",
    explanation_zh: "體重用於計算 BMI 和理想體重。",
    normal: { general: {} },
    category: "body",
    type: "number",
  },
  {
    key: "bmi",
    label_zh: "身體質量指數（BMI）",
    label_en: "Body Mass Index (BMI)",
    unit: "kg/m²",
    explanation_zh: "BMI = 體重(kg) ÷ 身高(m)²。亞洲人標準：18.5-24 正常；24-27 過重；≥27 肥胖。過重會增加糖尿病、高血壓和心臟病風險。",
    normal: { general: { min: 18.5, max: 24.0 } },
    warning_high: 30,
    category: "body",
    source: "WHO Asia-Pacific",
    type: "number",
  },
  {
    key: "waist",
    label_zh: "腰圍",
    label_en: "Waist Circumference",
    unit: "cm",
    explanation_zh: "腰圍反映腹部脂肪。男性超過 90cm、女性超過 80cm 為代謝症候群風險指標。",
    normal: {
      male: { max: 90 },
      female: { max: 80 },
    },
    warning_high: 100,
    category: "body",
    type: "number",
  },

  // ── 甲狀腺 Thyroid ──
  {
    key: "tsh",
    label_zh: "促甲狀腺激素（TSH）",
    label_en: "Thyroid Stimulating Hormone (TSH)",
    unit: "μIU/mL",
    explanation_zh: "TSH 控制甲狀腺的功能。偏高可能是甲狀腺功能低下（怕冷、疲勞、體重增加）；偏低可能是甲狀腺亢進（心跳快、怕熱、體重下降）。",
    normal: { general: { min: 0.27, max: 4.2 } },
    category: "thyroid",
    type: "number",
  },
  {
    key: "ft4",
    label_zh: "游離甲狀腺素（FT4）",
    label_en: "Free Thyroxine (FT4)",
    unit: "ng/dL",
    explanation_zh: "FT4 是甲狀腺分泌的主要荷爾蒙，配合 TSH 一起評估甲狀腺功能。",
    normal: { general: { min: 0.93, max: 1.70 } },
    category: "thyroid",
    type: "number",
  },

  // ── 腫瘤標記 Tumor Markers ──
  {
    key: "cea",
    label_zh: "癌胚抗原（CEA）",
    label_en: "Carcinoembryonic Antigen (CEA)",
    unit: "ng/mL",
    explanation_zh: "CEA 是一種腫瘤標記，主要用於監測大腸癌、肺癌等。正常非吸菸者應低於 5.0。單次升高不等於有癌症，需搭配其他檢查。",
    normal: { general: { max: 5.0 } },
    warning_high: 10,
    category: "tumor",
    type: "number",
  },
  {
    key: "psa",
    label_zh: "攝護腺特異抗原（PSA）",
    label_en: "Prostate-Specific Antigen (PSA)",
    unit: "ng/mL",
    explanation_zh: "PSA 是攝護腺健康的指標，僅男性適用。正常低於 4.0，但也可能因攝護腺肥大或發炎而升高。",
    normal: { male: { max: 4.0 } },
    warning_high: 10,
    category: "tumor",
    type: "number",
  },
  {
    key: "afp",
    label_zh: "甲型胎兒蛋白（AFP）",
    label_en: "Alpha-Fetoprotein (AFP)",
    unit: "ng/mL",
    explanation_zh: "AFP 主要用於監測肝癌風險，有 B 型或 C 型肝炎的人需定期追蹤。正常低於 9.0。",
    normal: { general: { max: 9.0 } },
    category: "tumor",
    type: "number",
  },
  {
    key: "ca125",
    label_zh: "卵巢癌標記（CA-125）",
    label_en: "Cancer Antigen 125 (CA-125)",
    unit: "U/mL",
    explanation_zh: "CA-125 主要用於女性卵巢癌的監測。正常低於 35，但也可能因子宮內膜異位症或月經期間升高。",
    normal: { female: { max: 35 } },
    category: "tumor",
    type: "number",
  },
  {
    key: "ca199",
    label_zh: "消化道腫瘤標記（CA 19-9）",
    label_en: "Cancer Antigen 19-9 (CA 19-9)",
    unit: "U/mL",
    explanation_zh: "CA 19-9 用於監測胰臟癌、膽管癌和大腸癌。正常低於 37。",
    normal: { general: { max: 37 } },
    category: "tumor",
    type: "number",
  },
];

// Category metadata
export const CATEGORIES: Record<string, { label_zh: string; label_en: string; icon: string }> = {
  body:       { label_zh: "身體測量",   label_en: "Body Measurements",  icon: "⚖️" },
  vitals:     { label_zh: "生命徵象",   label_en: "Vital Signs",         icon: "❤️" },
  blood:      { label_zh: "血液常規",   label_en: "Blood Routine",       icon: "🩸" },
  liver:      { label_zh: "肝功能",     label_en: "Liver Function",      icon: "🫀" },
  kidney:     { label_zh: "腎功能",     label_en: "Kidney Function",     icon: "🫘" },
  metabolism: { label_zh: "新陳代謝",   label_en: "Metabolism",          icon: "⚡" },
  thyroid:    { label_zh: "甲狀腺",     label_en: "Thyroid",             icon: "🦋" },
  tumor:      { label_zh: "腫瘤標記",   label_en: "Tumor Markers",       icon: "🔬" },
};

// Get reference range text for a given gender
export function getNormalRange(item: ReferenceItem, gender?: "M" | "F"): string {
  const r =
    (gender === "M" && item.normal.male) ||
    (gender === "F" && item.normal.female) ||
    item.normal.general ||
    item.normal.male ||
    item.normal.female;

  if (!r) return "N/A";
  if (r.text) return r.text;
  if (r.min !== undefined && r.max !== undefined) return `${r.min} – ${r.max}`;
  if (r.min !== undefined) return `≥ ${r.min}`;
  if (r.max !== undefined) return `≤ ${r.max}`;
  return "N/A";
}

// Check if a value is abnormal.
// 五級判定：warning_high / warning_low 為「嚴重」門檻（比正常區間更極端），
// 落在正常區間外但未達警示門檻則為一般偏高 / 偏低。
export type AbnormalStatus =
  | "critical_high" | "high" | "normal" | "low" | "critical_low" | "unknown";

export function checkAbnormal(item: ReferenceItem, value: number, gender?: "M" | "F"): AbnormalStatus {
  const r =
    (gender === "M" && item.normal.male) ||
    (gender === "F" && item.normal.female) ||
    item.normal.general ||
    item.normal.male ||
    item.normal.female;

  if (!r) return "unknown";
  // 嚴重門檻優先（比正常區間邊界更極端）
  if (item.warning_high !== undefined && value >= item.warning_high) return "critical_high";
  if (item.warning_low !== undefined && value <= item.warning_low) return "critical_low";
  if (r.max !== undefined && value > r.max) return "high";
  if (r.min !== undefined && value < r.min) return "low";
  return "normal";
}

// 狀態判斷式（供 UI / 統計使用，避免各處硬比對字串）
export const isHigh     = (s: AbnormalStatus) => s === "high" || s === "critical_high";
export const isLow      = (s: AbnormalStatus) => s === "low"  || s === "critical_low";
export const isCritical = (s: AbnormalStatus) => s === "critical_high" || s === "critical_low";
export const isAbnormal = (s: AbnormalStatus) => isHigh(s) || isLow(s);
