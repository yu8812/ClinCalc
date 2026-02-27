#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/validate.py
驗證 public/ 下的 JSON 輸出格式正確
"""
import json, sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
PUBLIC = ROOT / "public"
errors = []

# corpus.json
try:
    corpus = json.loads((PUBLIC / "corpus.json").read_text(encoding="utf-8"))
    assert "chunks" in corpus, "缺少 chunks 欄位"
    assert corpus["total_chunks"] == len(corpus["chunks"]), "total_chunks 不符"
    for c in corpus["chunks"][:5]:
        for field in ["id", "source_id", "title", "url"]:
            assert field in c, f"chunk 缺少 {field}"
    print(f"✓ corpus.json: {corpus['total_chunks']} chunks OK")
except Exception as e:
    errors.append(f"corpus.json: {e}")

# index.json
try:
    index = json.loads((PUBLIC / "index.json").read_text(encoding="utf-8"))
    assert "entries" in index
    print(f"✓ index.json: {index['total']} entries OK")
except Exception as e:
    errors.append(f"index.json: {e}")

# manifest.json
try:
    manifest = json.loads((PUBLIC / "manifest.json").read_text(encoding="utf-8"))
    assert "version" in manifest and "total_sources" in manifest
    print(f"✓ manifest.json: v{manifest['version']} OK")
except Exception as e:
    errors.append(f"manifest.json: {e}")

if errors:
    for e in errors:
        print(f"✗ {e}", file=sys.stderr)
    sys.exit(1)
else:
    print("\n✅ 所有輸出驗證通過")
