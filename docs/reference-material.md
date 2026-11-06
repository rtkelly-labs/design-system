# Third-party reference material

**Parent:** [`AGENTS.md`](../AGENTS.md)

Licensing constraints on the local reference copies. Read before using any of it.

---

## 🖼️ Third-Party Reference Material

`reference/bookofshapes/` holds a local, **gitignored** copy of the 57 SVG patterns from
[bookofshapes.com](https://bookofshapes.com/) (Nikolaj Sokolowski), kept as inspiration
for background and geometric-pattern work.

1. **Reference only — not shippable.** The source site publishes **no licence**, so the
   artwork is all rights reserved. Nothing in `reference/bookofshapes/svg/` may be
   committed, bundled, or shipped in `src/`, and attribution alone does not make it
   permissible. Ask the author first (`nikolaj@creasurf.net`).
2. **Keep the ignore rule.** `.gitignore` excludes `reference/bookofshapes/svg/`; never
   remove it. `manifest.json` and `ATTRIBUTION.md` are the committed catalogue, and stay
   browsable without the artwork present.
3. **Nothing here reaches the dependency gate.** No package is added and no third-party
   file is committed, so `check:deps` has nothing to see and there is no licence gate to
   need — which is precisely the point of keeping the artwork out of the tree. If a
   licence check is ever built, this directory is the reason it would have to read the
   tree and not just `package.json`.
4. **Repopulate with `python3 reference/bookofshapes/fetch.py`** — stdlib only, rate
   limited, and it must never touch the site's `/api/` path (robots-disallowed).
5. **Read `reference/bookofshapes/README.md` before using any of it.** It covers the
   licensing position and the `--fill-color` / `--stroke-color` / `--background-color` /
   `--occlusion-color` theming contract worth adopting for our own generated patterns.


