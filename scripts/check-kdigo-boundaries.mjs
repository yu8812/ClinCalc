// KDIGO eGFR 分期的邊界值測試。
// 直接從 src/app/check/detail/page.tsx 讀出分期門檻(不另外抄一份),
// 在每個門檻的兩側各取值,檢查判出的分期是否符合 KDIGO 的定義。
// 不需要安裝任何套件:node scripts/check-kdigo-boundaries.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const src = readFileSync(fileURLToPath(new URL('../src/app/check/detail/page.tsx', import.meta.url)), 'utf8');
const body = src.slice(src.indexOf('function CKDStageCard'), src.indexOf('return (', src.indexOf('function CKDStageCard')));

// 形如:egfr >= 90 ? { label: "G1", ...} : ... : { label: "G5", ...}
const rules = [...body.matchAll(/egfr\s*>=\s*(\d+(?:\.\d+)?)\s*\?\s*\{\s*label:\s*"([^"]+)"/g)]
  .map((m) => ({ min: Number(m[1]), label: m[2] }));
const fallback = [...body.matchAll(/label:\s*"([^"]+)"/g)].map((m) => m[1]).pop();
if (rules.length !== 5 || !fallback) {
  console.error('無法從原始碼解析分期規則,請檢查 CKDStageCard 的寫法。', { rules, fallback });
  process.exit(2);
}
const stageFromSource = (egfr) => (rules.find((r) => egfr >= r.min) || { label: fallback }).label;

// KDIGO 定義(mL/min/1.73 m²):G1 ≥90、G2 60–89、G3a 45–59、G3b 30–44、G4 15–29、G5 <15
const kdigo = (egfr) =>
  egfr >= 90 ? 'G1' : egfr >= 60 ? 'G2' : egfr >= 45 ? 'G3a' : egfr >= 30 ? 'G3b' : egfr >= 15 ? 'G4' : 'G5';

const cases = [0, 5, 14, 14.9, 15, 15.1, 29, 29.9, 30, 30.1, 44, 44.9, 45, 45.1, 59, 59.9, 60, 60.1, 89, 89.9, 90, 90.1, 120, 150];
let fail = 0;
console.log('原始碼中的門檻:', rules.map((r) => `${r.label} ≥ ${r.min}`).join('、'), `,其餘 ${fallback}`);
console.log('eGFR\t程式\tKDIGO\t結果');
for (const v of cases) {
  const got = stageFromSource(v);
  const want = kdigo(v);
  const ok = got === want;
  if (!ok) fail++;
  console.log(`${v}\t${got}\t${want}\t${ok ? '通過' : '不符'}`);
}
console.log(`\n共 ${cases.length} 個值,${cases.length - fail} 個通過,${fail} 個不符。`);
process.exit(fail ? 1 : 0);
