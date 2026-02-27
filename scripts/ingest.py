#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/ingest.py
抓取 data/sources/urls.yaml 中的來源，清理後存入 data/raw/

用法：
  python scripts/ingest.py           # 抓取所有 active 來源
  python scripts/ingest.py --id ada_2026          # 只更新特定來源
  python scripts/ingest.py --changed              # 只更新 hash 有變動的
  python scripts/ingest.py --dry-run             # 只顯示會做什麼，不實際抓取
"""

import argparse
import hashlib
import json
import time
import re
from datetime import datetime, timezone
from pathlib import Path

import yaml
import requests
from bs4 import BeautifulSoup

# ─── 常數 ────────────────────────────────────────────────────────
ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
SOURCES_FILE = DATA_DIR / "sources" / "urls.yaml"
HASH_CACHE = DATA_DIR / ".hash_cache.json"

HEADERS = {
    "User-Agent": "ClinCalc-Bot/1.0 (Medical knowledge aggregator; contact: your@email.com)",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
}
REQUEST_DELAY = 2.0    # 兩次請求之間至少等幾秒（避免對來源伺服器造成負擔）
REQUEST_TIMEOUT = 30


# ─── 主流程 ──────────────────────────────────────────────────────
def main():
    args = parse_args()
    sources = load_sources()
    hash_cache = load_hash_cache()

    targets = [s for s in sources if s.get("active", True)]
    if args.id:
        targets = [s for s in targets if s["id"] == args.id]
        if not targets:
            print(f"[ERROR] 找不到 id='{args.id}'")
            return

    updated = []
    skipped = []
    failed = []

    for i, source in enumerate(targets):
        sid = source["id"]
        print(f"\n[{i+1}/{len(targets)}] {sid} — {source['title'][:50]}")

        if args.dry_run:
            print(f"  → DRY-RUN: 會抓取 {source['url']}")
            continue

        try:
            result = fetch_source(source)
            new_hash = compute_hash(result["text"])

            if args.changed and hash_cache.get(sid) == new_hash:
                print(f"  → 無變動，略過")
                skipped.append(sid)
                continue

            save_raw(sid, result)
            hash_cache[sid] = new_hash
            updated.append(sid)
            print(f"  ✓ 已儲存 ({len(result['text'])} 字元)")

        except Exception as e:
            print(f"  ✗ 失敗：{e}")
            failed.append((sid, str(e)))

        if i < len(targets) - 1:
            time.sleep(REQUEST_DELAY)

    save_hash_cache(hash_cache)

    print(f"\n{'─'*50}")
    print(f"完成：更新 {len(updated)} | 略過 {len(skipped)} | 失敗 {len(failed)}")
    if failed:
        for sid, err in failed:
            print(f"  ✗ {sid}: {err}")
    if updated:
        print("\n下一步：python scripts/process.py")


# ─── 抓取邏輯 ────────────────────────────────────────────────────
def fetch_source(source: dict) -> dict:
    """抓取來源並回傳清理後的結構"""
    url = source["url"]
    src_type = source.get("type", "html")
    license_ = source.get("license", "public_summary")

    resp = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
    resp.raise_for_status()
    resp.encoding = resp.apparent_encoding or "utf-8"

    if src_type == "rss":
        text = parse_rss(resp.text)
    elif src_type == "pdf":
        text = "[PDF] 請手動下載並轉換：" + url
    else:
        text = parse_html(resp.text, source)

    # 著作權合規：restricted 來源只保留 URL + 標題
    if license_ == "restricted":
        text = f"[RESTRICTED] 此來源受版權保護，請直接訪問原始頁面：{url}"

    return {
        "id": source["id"],
        "title": source["title"],
        "url": url,
        "category": source.get("category", "unknown"),
        "language": source.get("language", "en"),
        "tags": source.get("tags", []),
        "license": license_,
        "text": text,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "http_status": resp.status_code,
    }


def parse_html(raw_html: str, source: dict) -> str:
    """從 HTML 提取正文，自動偵測主要內容區塊"""
    soup = BeautifulSoup(raw_html, "html.parser")

    # 移除 script / style / nav / footer
    for tag in soup(["script", "style", "nav", "footer", "header",
                     "aside", "form", "button", "noscript"]):
        tag.decompose()

    # 優先使用來源指定的 XPath/selector
    xpath = source.get("xpath_content")
    if xpath:
        # 轉換簡單 XPath 為 CSS selector（僅支援基本語法）
        css = xpath.replace("//", "").replace("/", " > ")
        main_el = soup.select_one(css)
        if main_el:
            return clean_text(main_el.get_text())

    # 自動偵測主要內容
    for selector in ["main", "article", "#content", ".content",
                     ".article-body", ".entry-content", "#main-content"]:
        el = soup.select_one(selector)
        if el and len(el.get_text(strip=True)) > 200:
            return clean_text(el.get_text())

    # fallback：body
    body = soup.find("body")
    return clean_text(body.get_text() if body else soup.get_text())


def parse_rss(raw_xml: str) -> str:
    """解析 RSS，回傳標題 + 摘要列表"""
    soup = BeautifulSoup(raw_xml, "xml")
    items = soup.find_all("item")[:20]  # 最多 20 篇
    lines = []
    for item in items:
        title = item.find("title")
        desc = item.find("description") or item.find("summary")
        link = item.find("link")
        pub = item.find("pubDate")
        if title:
            lines.append(f"## {title.get_text(strip=True)}")
        if pub:
            lines.append(f"發布：{pub.get_text(strip=True)}")
        if desc:
            lines.append(clean_text(desc.get_text())[:500])
        if link:
            lines.append(f"來源：{link.get_text(strip=True)}")
        lines.append("")
    return "\n".join(lines)


def clean_text(text: str) -> str:
    """清理多餘空白、特殊字元"""
    text = re.sub(r"\s+", " ", text)           # 多個空白合一
    text = re.sub(r"\n{3,}", "\n\n", text)     # 多餘空行
    text = re.sub(r"[^\w\s\u4e00-\u9fff\u3000-\u303f.,;:()\-–/\'\"<>%°℃≤≥+*\[\]#@!?：；。，、（）「」『』【】《》〈〉]", "", text)
    return text.strip()


# ─── 工具函式 ────────────────────────────────────────────────────
def load_sources() -> list:
    with open(SOURCES_FILE, encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data.get("sources", [])


def save_raw(sid: str, result: dict):
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    out_path = RAW_DIR / f"{sid}.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)


def load_hash_cache() -> dict:
    if HASH_CACHE.exists():
        with open(HASH_CACHE, encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_hash_cache(cache: dict):
    with open(HASH_CACHE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2)


def compute_hash(text: str) -> str:
    return hashlib.md5(text.encode("utf-8")).hexdigest()


def parse_args():
    p = argparse.ArgumentParser(description="抓取醫療文獻來源")
    p.add_argument("--id", help="只處理特定 source id")
    p.add_argument("--changed", action="store_true", help="只更新 hash 有變動的來源")
    p.add_argument("--dry-run", action="store_true", help="預覽模式，不實際抓取")
    return p.parse_args()


if __name__ == "__main__":
    main()
