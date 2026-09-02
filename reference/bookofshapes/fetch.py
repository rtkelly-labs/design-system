#!/usr/bin/env python3
"""Fetch Book of Shapes pattern previews + provenance metadata.

Source: https://bookofshapes.com/ by Nikolaj Sokolowski.
See README.md in this directory for licensing status and usage rules.

Only touches public, robots-allowed paths (/sitemap-0.xml, /patterns/*,
/previews/*.svg). robots.txt disallows /api/, which this script never calls.
Requests are rate limited to stay well below anything resembling a hammering.
"""

import json
import re
import sys
import time
import urllib.request
from pathlib import Path

BASE = "https://bookofshapes.com"
HERE = Path(__file__).parent
SVG_DIR = HERE / "svg"
MANIFEST = HERE / "manifest.json"
DELAY = 0.75  # seconds between requests
UA = "bookofshapes-reference-fetch/1.0 (personal design-system reference; contact via github.com/rtkelly13)"


def get(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", errors="replace")


def get_bytes(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def pattern_slugs() -> list[str]:
    xml = get(f"{BASE}/sitemap-0.xml")
    locs = re.findall(r"<loc>([^<]+)</loc>", xml)
    slugs = []
    for loc in locs:
        m = re.match(rf"{re.escape(BASE)}/patterns/([^/]+)/?$", loc)
        if m:
            slugs.append(m.group(1))
    return sorted(set(slugs))


def scrape(slug: str) -> dict:
    html = get(f"{BASE}/patterns/{slug}/")
    title = re.search(r"<title>([^<]*?)(?:\s*-\s*Book of Shapes)?</title>", html)
    desc = re.search(r'<meta name="description" content="([^"]*)"', html)
    tags = sorted(set(re.findall(r'href="/\?tag=([a-z0-9\-]+)"', html)))
    return {
        "slug": slug,
        "title": title.group(1).strip() if title else slug,
        "description": desc.group(1).strip() if desc else "",
        "tags": tags,
        "page": f"{BASE}/patterns/{slug}/",
        "preview_svg": f"{BASE}/previews/{slug}.svg",
        "poster": f"{BASE}/patterns/{slug}/poster/",
        "author": "Nikolaj Sokolowski",
        "source": BASE,
    }


def main() -> int:
    SVG_DIR.mkdir(parents=True, exist_ok=True)
    slugs = pattern_slugs()
    print(f"{len(slugs)} patterns in sitemap", file=sys.stderr)

    entries = []
    for i, slug in enumerate(slugs, 1):
        try:
            entry = scrape(slug)
            time.sleep(DELAY)
            svg = get_bytes(entry["preview_svg"])
            (SVG_DIR / f"{slug}.svg").write_bytes(svg)
            entry["bytes"] = len(svg)
            vb = re.search(rb'viewBox="([^"]+)"', svg)
            entry["view_box"] = vb.group(1).decode() if vb else None
            entry["themeable_vars"] = sorted(
                set(v.decode() for v in re.findall(rb"(--[a-z\-]+):", svg))
            )
            entries.append(entry)
            print(f"[{i}/{len(slugs)}] {slug} ({len(svg)}b)", file=sys.stderr)
        except Exception as e:  # keep going; report at the end
            print(f"[{i}/{len(slugs)}] {slug} FAILED: {e}", file=sys.stderr)
        time.sleep(DELAY)

    manifest = {
        "source": BASE,
        "author": "Nikolaj Sokolowski",
        "author_links": {
            "site": "https://nikolaj-sokolowski.de/",
            "x": "https://x.com/Threeaio",
            "instagram": "https://www.instagram.com/nikobremen/",
            "email": "nikolaj@creasurf.net",
        },
        "license": "UNSPECIFIED - no license published on the source site; treat as all rights reserved. See README.md.",
        "note": "Local reference material only. SVGs are gitignored and must not be redistributed or shipped without permission.",
        "pattern_count": len(entries),
        "patterns": entries,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"wrote {MANIFEST} ({len(entries)} patterns)", file=sys.stderr)
    return 0 if len(entries) == len(slugs) else 1


if __name__ == "__main__":
    raise SystemExit(main())
