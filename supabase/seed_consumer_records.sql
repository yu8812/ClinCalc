-- ============================================================
-- seed_consumer_records.sql
-- 為 ClinCalc 民眾測試帳號補 10 筆健康記錄，讓 /records 頁面有資料
-- 條件：YOUR_CONSUMER_EMAIL@example.com 已註冊
-- ============================================================

DO $$
DECLARE
  uid    UUID;
  d      DATE := CURRENT_DATE;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'YOUR_CONSUMER_EMAIL@example.com' LIMIT 1;
  IF uid IS NULL THEN
    RAISE EXCEPTION 'YOUR_CONSUMER_EMAIL@example.com not found; sign up first';
  END IF;

  -- 清掉之前可能的 seed
  DELETE FROM health_records WHERE user_id = uid AND ai_analysis LIKE '[seed]%';

  -- 過去 9 個月的逐月健康記錄（呈現走勢，主軸為 CKD + 糖尿病聯合追蹤）
  INSERT INTO health_records (user_id, type, data, ai_analysis, created_at) VALUES
    (uid, 'manual',
     '{"systolic":138,"diastolic":86,"hr":76,"temperature":36.6,"spo2":98,"weight":74,"height":172,"glucose":118,"hba1c":6.4,"creatinine":1.05,"egfr":78,"ldl":128,"hdl":45,"triglyceride":162,"alt":32,"ast":28}',
     '[seed] 血壓略偏高、HbA1c 處於糖尿病前期（5.7-6.4%）邊緣、eGFR 78 屬 CKD G2 輕度下降。建議調整生活型態並三個月內回診。',
     (d - INTERVAL '270 days')::timestamptz),

    (uid, 'manual',
     '{"systolic":142,"diastolic":88,"hr":78,"temperature":36.7,"spo2":98,"weight":75,"height":172,"glucose":126,"hba1c":6.6,"creatinine":1.10,"egfr":74,"ldl":135,"hdl":43,"triglyceride":172,"alt":34,"ast":30}',
     '[seed] HbA1c 進入糖尿病範圍（≥6.5%）；eGFR 持續輕度下降。建議啟動藥物治療並注意飲食。',
     (d - INTERVAL '240 days')::timestamptz),

    (uid, 'scan',
     '{"systolic":140,"diastolic":86,"hr":74,"glucose":124,"hba1c":6.7,"creatinine":1.12,"egfr":72,"ldl":130,"alt":36,"source":"健檢中心報告 OCR"}',
     '[seed] 影像 OCR 自動辨識：HbA1c 6.7、eGFR 72。趨勢與上月相似。',
     (d - INTERVAL '210 days')::timestamptz),

    (uid, 'manual',
     '{"systolic":136,"diastolic":84,"hr":74,"weight":74,"glucose":118,"hba1c":6.8,"creatinine":1.15,"egfr":70,"ldl":126,"hdl":44,"triglyceride":158}',
     '[seed] 服用 Metformin 後血糖略有改善；eGFR 70 接近 G3a 閾值，須密切追蹤。',
     (d - INTERVAL '180 days')::timestamptz),

    (uid, 'manual',
     '{"systolic":134,"diastolic":82,"hr":72,"weight":73,"glucose":112,"hba1c":6.5,"creatinine":1.18,"egfr":67,"ldl":118,"hdl":46,"triglyceride":144,"uacr":35}',
     '[seed] HbA1c 改善至 6.5；UACR 35 mg/g 屬 A2 微量蛋白尿。建議加上 SGLT2 抑制劑保護腎臟。',
     (d - INTERVAL '150 days')::timestamptz),

    (uid, 'manual',
     '{"systolic":132,"diastolic":80,"hr":72,"weight":72,"glucose":108,"hba1c":6.3,"creatinine":1.20,"egfr":65,"ldl":108,"hdl":48,"triglyceride":128,"uacr":32}',
     '[seed] 啟用 Empagliflozin 後追蹤；HbA1c 與血壓均下降。eGFR 65 仍屬 G2 但需持續觀察。',
     (d - INTERVAL '120 days')::timestamptz),

    (uid, 'scan',
     '{"systolic":130,"diastolic":80,"glucose":105,"hba1c":6.2,"creatinine":1.22,"egfr":63,"ldl":102,"uacr":28,"source":"診所 OCR"}',
     '[seed] OCR 報告辨識：UACR 28 → 改善至 A1。eGFR 略有下降但仍 ≥60。',
     (d - INTERVAL '90 days')::timestamptz),

    (uid, 'manual',
     '{"systolic":128,"diastolic":78,"hr":70,"weight":71,"glucose":102,"hba1c":6.1,"creatinine":1.18,"egfr":67,"ldl":98,"hdl":50,"triglyceride":118,"uacr":24,"alt":28,"ast":24}',
     '[seed] 持續穩定改善：BP/血糖/血脂/腎功能皆優於三個月前。',
     (d - INTERVAL '60 days')::timestamptz),

    (uid, 'manual',
     '{"systolic":126,"diastolic":76,"hr":70,"weight":71,"glucose":100,"hba1c":6.0,"creatinine":1.15,"egfr":68,"ldl":94,"hdl":52,"triglyceride":108,"uacr":22}',
     '[seed] HbA1c 已達糖尿病控制目標（<7%）；eGFR 維持 G2 上緣。維持現有藥物與飲食。',
     (d - INTERVAL '30 days')::timestamptz),

    (uid, 'manual',
     '{"systolic":124,"diastolic":76,"hr":68,"temperature":36.6,"spo2":98,"weight":70,"height":172,"glucose":98,"hba1c":5.9,"creatinine":1.12,"egfr":71,"ldl":92,"hdl":54,"triglyceride":102,"uacr":20,"alt":24,"ast":22}',
     '[seed] 最新一次自測：HbA1c 5.9 已脫離糖尿病控制不良範圍；eGFR 回升至 71。整體趨勢良好。',
     (d - INTERVAL '5 days')::timestamptz);

  RAISE NOTICE '✓ 10 health records seeded for YOUR_CONSUMER_EMAIL@example.com';
END $$;
