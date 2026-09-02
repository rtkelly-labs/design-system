#!/usr/bin/env python3
"""Build a local contact sheet for the Book of Shapes reference patterns.

Renders all 57 patterns with the brutalist accent applied, annotated with the
verdict from verdicts.json, so shape ideas can be judged in *our* palette rather
than the source site's grey.

The output (contact-sheet.html) is gitignored along with the artwork, because
the artwork is unlicensed — see README.md. This viewer is a local evaluation
tool and must never be deployed.

    python3 contact_sheet.py && python3 -m http.server 8765
    open http://localhost:8765/contact-sheet.html

It must be served over http rather than opened as file://, because patterns are
inlined via fetch() on scroll. That is not incidental: an <img src="...svg">
cannot be themed, since CSS custom properties do not cross into an
image-referenced SVG document. Inlining is the only way to recolour them, and it
is the same constraint any pattern we ship will be under.
"""

import json
from pathlib import Path

HERE = Path(__file__).parent
ACCENTS = [
    ("cyan", "#22d3ee"), ("pink", "#ec4899"), ("yellow", "#facc15"),
    ("neonGreen", "#39ff14"), ("white", "#ffffff"), ("ink", "#23262e"),
]
VERDICT_COLOR = {
    "port": "#39ff14", "variation": "#facc15", "covered": "#22d3ee", "skip": "#71717a",
}


def main() -> int:
    man = json.loads((HERE / "manifest.json").read_text())
    doc = json.loads((HERE / "verdicts.json").read_text())
    verdicts = doc["verdicts"]
    families = doc["families"]
    missing = [p["slug"] for p in man["patterns"]
               if not (HERE / "svg" / f"{p['slug']}.svg").exists()]
    if missing:
        print(f"warning: {len(missing)} SVGs missing - run fetch.py first")

    # Grouped by mechanism family, because that is the thing being judged: two
    # patterns in the same family are one generator and a parameter apart,
    # however different they look.
    fam_order = ["distinct", "iso-cubes", "mesh-mode", "radial-ring", "truchet",
                 "wave-envelope", "interference", "field-source", "disorder",
                 "built", "reject"]
    pats = sorted(
        man["patterns"],
        key=lambda p: (fam_order.index(verdicts[p["slug"]]["family"]), -p["bytes"]),
    )

    cards = []
    last_family = None
    for p in pats:
        entry = verdicts[p["slug"]]
        v, why, fam = entry["verdict"], entry["why"], entry["family"]
        if fam != last_family:
            last_family = fam
            n = sum(1 for q in pats if verdicts[q["slug"]]["family"] == fam)
            cards.append(
                f'<h2 class="fam" data-verdict="{v}">{fam} &middot; {n}'
                f'<span>{families.get(fam, "already shipped")}</span></h2>')
        cards.append(f"""
    <figure class="card" data-verdict="{v}" data-tags="{' '.join(p['tags'])}">
      <div class="stage" data-src="svg/{p['slug']}.svg"></div>
      <figcaption>
        <div class="row">
          <strong>{p['title']}</strong>
          <span class="badge" style="--c:{VERDICT_COLOR[v]}">{v}</span>
        </div>
        <div class="meta">{p['slug']} &middot; {', '.join(p['tags'])} &middot; {p['bytes'] // 1024} KB</div>
        <p class="why">{why}</p>
        <a href="{p['page']}" target="_blank" rel="noopener">source &rarr;</a>
      </figcaption>
    </figure>""")

    swatches = "".join(
        f'<button class="sw" style="background:{v}" data-accent="{v}" title="{n}"></button>'
        for n, v in ACCENTS)
    filters = "".join(
        f'<button class="f" data-filter="{k}">{k}</button>'
        for k in ["all", "port", "variation", "covered", "skip"])

    html = f"""<!doctype html>
<meta charset="utf-8"><title>Book of Shapes - reference contact sheet</title>
<style>
  :root {{ --accent:#22d3ee; --bg:#000; --occ:#0a0a1a; }}
  * {{ box-sizing:border-box; border-radius:0 !important; }}
  body {{ margin:0; background:var(--bg); color:#e4e4e7;
         font:14px/1.5 "IBM Plex Mono", ui-monospace, monospace; }}
  header {{ position:sticky; top:0; z-index:10; background:#18181b;
            border-bottom:2px solid #fff; padding:16px 24px; }}
  h1 {{ margin:0 0 4px; font-size:20px; text-transform:uppercase; letter-spacing:.05em; }}
  .note {{ color:#a1a1aa; font-size:12px; margin:0 0 12px; max-width:70ch; }}
  .note b {{ color:#facc15; }}
  .controls {{ display:flex; gap:24px; flex-wrap:wrap; align-items:center; }}
  .sw {{ width:26px; height:26px; border:2px solid #52525b; cursor:pointer; }}
  .sw:hover, .sw.on {{ border-color:#fff; }}
  .f {{ background:#000; color:#e4e4e7; border:2px solid #52525b; padding:4px 10px;
        font:inherit; font-size:12px; text-transform:uppercase; cursor:pointer; }}
  .f:hover, .f.on {{ border-color:#fff; color:#fff; }}
  label {{ font-size:12px; color:#a1a1aa; display:flex; gap:8px; align-items:center; }}
  main {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr));
          gap:2px; background:#27272a; padding:2px; }}
  .fam {{ grid-column:1/-1; margin:18px 0 0; padding:10px 14px; background:#000;
          border-left:4px solid #52525b; font-size:14px; text-transform:uppercase;
          letter-spacing:.06em; color:#fff; }}
  .fam[hidden] {{ display:none; }}
  .fam span {{ display:block; margin-top:4px; font-size:11px; text-transform:none;
               letter-spacing:0; color:#a1a1aa; }}
  .card {{ margin:0; background:#000; display:flex; flex-direction:column; }}
  .card[hidden] {{ display:none; }}
  .stage {{ aspect-ratio:1; display:grid; place-items:center; overflow:hidden;
            padding:14px; background:var(--bg); }}
  .stage svg {{ width:100%; height:100%;
      --fill-color:var(--accent); --stroke-color:var(--accent);
      --background-color:transparent; --occlusion-color:var(--occ); }}
  figcaption {{ border-top:2px solid #27272a; padding:10px 12px; }}
  .row {{ display:flex; justify-content:space-between; gap:8px; align-items:baseline; }}
  .badge {{ color:var(--c); border:1px solid var(--c); padding:0 6px;
            font-size:10px; text-transform:uppercase; }}
  .meta {{ color:#71717a; font-size:11px; margin-top:2px; }}
  .why {{ color:#a1a1aa; font-size:12px; margin:8px 0 6px; }}
  a {{ color:var(--accent); font-size:11px; text-decoration:none; }}
  a:hover {{ text-decoration:underline; }}
</style>
<header>
  <h1>[ Book of Shapes &mdash; reference contact sheet ]</h1>
  <p class="note">
    {man['pattern_count']} patterns by Nikolaj Sokolowski, recoloured in our accents to judge fit.
    <b>Reference only &mdash; the source site publishes no licence, so none of this artwork ships.</b>
    Verdicts are ours: what to build, not what to copy.
  </p>
  <div class="controls">
    <div>{swatches}</div>
    <div>{filters}</div>
    <label>bg <input type="color" id="bg" value="#000000"></label>
    <label>occlusion <input type="color" id="occ" value="#0a0a1a"></label>
  </div>
</header>
<main>{''.join(cards)}</main>
<script>
  const root = document.documentElement;
  document.querySelectorAll('.sw').forEach(b => b.onclick = () => {{
    root.style.setProperty('--accent', b.dataset.accent);
    document.querySelectorAll('.sw').forEach(x => x.classList.toggle('on', x === b));
  }});
  document.querySelectorAll('.f').forEach(b => b.onclick = () => {{
    const f = b.dataset.filter;
    document.querySelectorAll('.card, .fam').forEach(c => {{
      c.hidden = f !== 'all' && c.dataset.verdict !== f;
    }});
    document.querySelectorAll('.f').forEach(x => x.classList.toggle('on', x === b));
  }});
  document.getElementById('bg').oninput = e => root.style.setProperty('--bg', e.target.value);
  document.getElementById('occ').oninput = e => root.style.setProperty('--occ', e.target.value);

  // Inline on scroll. <img> would be simpler and completely unthemeable:
  // custom properties do not cross into an image-referenced SVG document.
  const io = new IntersectionObserver((entries) => {{
    for (const en of entries) {{
      if (!en.isIntersecting) continue;
      const el = en.target;
      io.unobserve(el);
      fetch(el.dataset.src)
        .then(r => r.ok ? r.text() : Promise.reject(r.status))
        .then(svg => {{ el.innerHTML = svg; }})
        .catch(err => {{ el.textContent = 'missing - run fetch.py (' + err + ')'; }});
    }}
  }}, {{ rootMargin: '400px' }});
  document.querySelectorAll('.stage').forEach(el => io.observe(el));
  document.querySelector('.sw').classList.add('on');
  document.querySelector('.f').classList.add('on');
</script>
"""
    out = HERE / "contact-sheet.html"
    out.write_text(html)
    print(f"wrote {out} ({len(pats)} patterns)")
    print("serve it:  python3 -m http.server 8765   ->  http://localhost:8765/contact-sheet.html")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
