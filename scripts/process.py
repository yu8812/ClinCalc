#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/process.py
raw/ → 切 chunk → 去重 → 存入 processed/

用法：
  python scripts/process.py             # 處理所有 raw/
  python scripts/process.py --id ada_2026
"""

import argparse
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

# ─── 常數 ────────────────────────────────────────────────────────
ROOT = Path(__file__).parent.parent
RAW_DIR = ROOT / "data" / "raw"
PROCESSED_DIR = ROOT / "data" / "processed"

CHUNK_MAX_TOKENS = 350      # 每個 chunk 約多少 token（粗估：1 token ≈ 1.5 字元）
CHUNK_OVERLAP = 50          # 前後 chunk 重疊字元數（保持語義連貫）
MIN_CHUNK_CHARS = 80        # 太短的 chunk 直接丟棄


def main():
    args = parse_args()
    raw_files = sorted(RAW_DIR.glob("*.json"))

    if args.id:
        raw_files = [f for f in raw_files if f.stem == args.id]

    if not raw_files:
        print("[WARN] 找不到 raw/ 下的 JSON，請先執行 ingest.py")
        return

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    all_chunk_ids = set()  # 跨文件去重

    for raw_path in raw_files:
        with open(raw_path, encoding="utf-8") as f:
            raw = json.load(f)

        sid = raw["id"]
        license_ = raw.get("license", "public_summary")

        # restricted 來源不切 chunk，直接生成單一 reference 記錄
        if license_ == "restricted":
            chunks = [make_reference_chunk(raw)]
        else:
            chunks = chunk_document(raw)

        # 去重（同內容的 chunk 只保留一份）
        unique_chunks = []
        for c in chunks:
            if c["hash"] not in all_chunk_ids:
                all_chunk_ids.add(c["hash"])
                unique_chunks.append(c)

        out = {
            "source_id": sid,
            "title": raw["title"],
            "url": raw["url"],
            "category": raw.get("category"),
            "language": raw.get("language"),
            "tags": raw.get("tags", []),
            "license": license_,
            "fetched_at": raw.get("fetched_at"),
            "processed_at": datetime.now(timezone.utc).isoformat(),
            "total_chunks": len(unique_chunks),
            "chunks": unique_chunks,
        }

        out_path = PROCESSED_DIR / f"{sid}.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, indent=2)

        print(f"  ✓ {sid}: {len(unique_chunks)} chunks")

    print(f"\n下一步：python scripts/build_index.py")


# ─── 切 Chunk ────────────────────────────────────────────────────
def chunk_document(raw: dict) -> list[dict]:
    """
    將長文切成 chunk。策略：
    1. 先依段落（空行）切分
    2. 若段落仍太長，再依句子切分
    3. 若段落太短，合併相鄰段落
    """
    text = raw.get("text", "")
    if not text:
        return []

    # 依段落切分
    paragraphs = [p.strip() for p in re.split(r"\n{2,}", text) if p.strip()]

    # 合併過短的段落
    merged = []
    buf = ""
    for para in paragraphs:
        if len(buf) + len(para) < CHUNK_MAX_TOKENS * 1.5:
            buf = (buf + " " + para).strip()
        else:
            if buf:
                merged.append(buf)
            buf = para
    if buf:
        merged.append(buf)

    # 若合併後仍超長，再切一刀
    final_segments = []
    for seg in merged:
        if token_estimate(seg) <= CHUNK_MAX_TOKENS:
            final_segments.append(seg)
        else:
            # 依句子切分
            sentences = re.split(r"(?<=[。？！.!?])\s*", seg)
            sub_buf = ""
            for sent in sentences:
                if token_estimate(sub_buf + sent) > CHUNK_MAX_TOKENS and sub_buf:
                    final_segments.append(sub_buf.strip())
                    sub_buf = sent
                else:
                    sub_buf += " " + sent
            if sub_buf.strip():
                final_segments.append(sub_buf.strip())

    # 過濾太短、建立 chunk 物件
    chunks = []
    for i, seg in enumerate(final_segments):
        if len(seg) < MIN_CHUNK_CHARS:
            continue
        chunks.append(make_chunk(raw, seg, i, len(final_segments)))

    return chunks


def make_chunk(raw: dict, text: str, idx: int, total: int) -> dict:
    chunk_id = f"{raw['id']}_c{idx:04d}"
    return {
        "id": chunk_id,
        "source_id": raw["id"],
        "title": raw["title"],
        "url": raw["url"],
        "date": extract_date(raw.get("fetched_at", "")),
        "category": raw.get("category"),
        "language": raw.get("language"),
        "tags": raw.get("tags", []),
        "license": raw.get("license"),
        "chunk_index": idx,
        "total_chunks": total,
        "text": text[:CHUNK_MAX_TOKENS * 2],  # 硬截斷保底
        "token_estimate": token_estimate(text),
        "hash": hashlib.md5(text.encode("utf-8")).hexdigest()[:12],
    }


def make_reference_chunk(raw: dict) -> dict:
    """restricted 來源只建立 reference 記錄，不含文字內容"""
    return {
        "id": f"{raw['id']}_ref",
        "source_id": raw["id"],
        "title": raw["title"],
        "url": raw["url"],
        "date": extract_date(raw.get("fetched_at", "")),
        "category": raw.get("category"),
        "language": raw.get("language"),
        "tags": raw.get("tags", []),
        "license": "restricted",
        "chunk_index": 0,
        "total_chunks": 1,
        "text": "",   # 不存文字
        "token_estimate": 0,
        "hash": hashlib.md5(raw["url"].encode()).hexdigest()[:12],
    }


# ─── 工具函式 ────────────────────────────────────────────────────
def token_estimate(text: str) -> int:
    """粗估 token 數（1 token ≈ 1.5 中文字 or 4 英文字元）"""
    cjk = len(re.findall(r"[\u4e00-\u9fff]", text))
    rest = len(text) - cjk
    return int(cjk / 1.5 + rest / 4)


def extract_date(iso_str: str) -> str:
    """從 ISO 時間字串提取 YYYY-MM"""
    if iso_str and len(iso_str) >= 7:
        return iso_str[:7]
    return datetime.now().strftime("%Y-%m")


def parse_args():
    p = argparse.ArgumentParser(description="切 chunk 並結構化")
    p.add_argument("--id", help="只處理特定 source id")
    return p.parse_args()


if __name__ == "__main__":
    main()
