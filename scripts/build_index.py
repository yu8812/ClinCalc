#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/build_index.py
processed/ → public/corpus.json + public/index.json + public/manifest.json

用法：
  python scripts/build_index.py
  python scripts/build_index.py --upload-supabase   # 同時上傳到 Supabase
  python scripts/build_index.py --minify            # 壓縮 JSON（給生產環境用）
"""

import argparse
import json
import os
import re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

# ─── 常數 ────────────────────────────────────────────────────────
ROOT = Path(__file__).parent.parent
PROCESSED_DIR = ROOT / "data" / "processed"
PUBLIC_DIR = ROOT / "public"


def main():
    args = parse_args()
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

    # 1. 讀取所有 processed/ 下的 JSON
    all_chunks = []
    stats = defaultdict(int)

    for proc_path in sorted(PROCESSED_DIR.glob("*.json")):
        with open(proc_path, encoding="utf-8") as f:
            doc = json.load(f)

        for chunk in doc.get("chunks", []):
            all_chunks.append(chunk)
            stats[doc.get("category", "unknown")] += 1

    if not all_chunks:
        print("[ERROR] processed/ 下沒有資料，請先執行 process.py")
        return

    version = datetime.now(timezone.utc).strftime("%Y.%m.%d")
    generated_at = datetime.now(timezone.utc).isoformat()

    # 2. 輸出 corpus.json（完整文件庫，含 text）
    corpus = {
        "version": version,
        "generated_at": generated_at,
        "total_chunks": len(all_chunks),
        "chunks": all_chunks,
    }
    write_json(PUBLIC_DIR / "corpus.json", corpus, args.minify)
    print(f"✓ corpus.json: {len(all_chunks)} chunks")

    # 3. 輸出 index.json（搜尋索引，MiniSearch 格式）
    index_entries = []
    for c in all_chunks:
        # 不把 restricted 來源的空文字加入搜尋索引
        if c.get("license") == "restricted":
            entry = {
                "id": c["id"],
                "title": c["title"],
                "text": "",
                "tags": " ".join(c.get("tags", [])),
                "source_id": c.get("source_id"),
                "category": c.get("category"),
                "date": c.get("date"),
                "url": c.get("url"),
                "restricted": True,
            }
        else:
            entry = {
                "id": c["id"],
                "title": f"{c['title']} (Part {c['chunk_index']+1})" if c.get("total_chunks", 1) > 1 else c["title"],
                "text": c.get("text", ""),
                "tags": " ".join(c.get("tags", [])),
                "source_id": c.get("source_id"),
                "category": c.get("category"),
                "date": c.get("date"),
                "url": c.get("url"),
            }
        index_entries.append(entry)

    index = {
        "version": version,
        "generated_at": generated_at,
        "total": len(index_entries),
        # MiniSearch config hint（給前端用）
        "minisearch_fields": ["title", "text", "tags"],
        "minisearch_store_fields": ["source_id", "category", "date", "url", "title"],
        "entries": index_entries,
    }
    write_json(PUBLIC_DIR / "index.json", index, args.minify)
    print(f"✓ index.json: {len(index_entries)} entries")

    # 4. 輸出 manifest.json（版本資訊、統計）
    sources_list = list({c["source_id"] for c in all_chunks})
    manifest = {
        "version": version,
        "generated_at": generated_at,
        "total_chunks": len(all_chunks),
        "total_sources": len(sources_list),
        "categories": dict(stats),
        "sources": sources_list,
        "schema_version": "1.0",
    }
    write_json(PUBLIC_DIR / "manifest.json", manifest, minify=True)
    print(f"✓ manifest.json: {len(sources_list)} sources")

    # 5. 可選：上傳到 Supabase
    if args.upload_supabase:
        upload_to_supabase(all_chunks)


# ─── Supabase 上傳（可選）────────────────────────────────────────
def upload_to_supabase(chunks: list):
    """將 chunks 上傳到 Supabase knowledge_base 表"""
    sb_url = os.getenv("SUPABASE_URL")
    sb_key = os.getenv("SUPABASE_SERVICE_KEY")  # 使用 service key（script 端用）

    if not sb_url or not sb_key:
        print("[SKIP] 未設定 SUPABASE_URL / SUPABASE_SERVICE_KEY，略過 Supabase 上傳")
        return

    try:
        import requests
    except ImportError:
        print("[SKIP] 需要安裝 requests：pip install requests")
        return

    endpoint = f"{sb_url}/rest/v1/knowledge_base"
    headers = {
        "apikey": sb_key,
        "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",  # UPSERT
    }

    batch_size = 50
    uploaded = 0
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i+batch_size]
        payload = [
            {
                "id": c["id"],
                "source_id": c["source_id"],
                "title": c["title"],
                "text": c.get("text", ""),
                "tags": c.get("tags", []),
                "category": c.get("category"),
                "language": c.get("language"),
                "url": c.get("url"),
                "date": c.get("date"),
                "license": c.get("license"),
            }
            for c in batch
        ]
        r = requests.post(endpoint, json=payload, headers=headers)
        if r.ok or r.status_code == 201:
            uploaded += len(batch)
            print(f"  ↑ Supabase: {uploaded}/{len(chunks)} chunks")
        else:
            print(f"  ✗ Supabase batch {i}: {r.status_code} {r.text[:200]}")

    print(f"✓ Supabase 上傳完成：{uploaded}/{len(chunks)} chunks")


# ─── 工具函式 ────────────────────────────────────────────────────
def write_json(path: Path, data: dict, minify: bool = False):
    with open(path, "w", encoding="utf-8") as f:
        if minify:
            json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        else:
            json.dump(data, f, ensure_ascii=False, indent=2)


def parse_args():
    p = argparse.ArgumentParser(description="建立搜尋索引")
    p.add_argument("--upload-supabase", action="store_true", help="同時上傳到 Supabase")
    p.add_argument("--minify", action="store_true", help="壓縮 JSON 輸出")
    return p.parse_args()


if __name__ == "__main__":
    main()
