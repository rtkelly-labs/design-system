# Book of Shapes — local reference library

Local, **gitignored** copy of the 57 SVG patterns published at
[bookofshapes.com](https://bookofshapes.com/) by **Nikolaj Sokolowski**, kept as
inspiration material while working on backgrounds and geometric patterns for the
design system and the blog.

> **Read the licensing section before you use any of this in shipped code.** The
> short version: these are someone else's copyrighted artwork with no published
> licence, so they are reference-only until we get permission in writing.

## Contents

| Path | Committed? | What it is |
| --- | --- | --- |
| `svg/` | **No — gitignored** | 57 downloaded preview SVGs (~17 MB), named `<slug>.svg` |
| `manifest.json` | Yes | Provenance + metadata for every pattern (title, description, tags, source URLs, viewBox, theme vars) |
| `ATTRIBUTION.md` | Yes | Human-readable catalogue grouped by tag, with the credit line to use |
| `fetch.py` | Yes | Reproducible fetcher — re-creates `svg/` and `manifest.json` from scratch |
| `verdicts.json` | Yes | Per-pattern verdict — build / adapt / already covered / skip |
| `contact_sheet.py` | Yes | Builds the local viewer below |
| `contact-sheet.html` | **No — gitignored** | Generated viewer (embeds the artwork) |
| `EVALUATION.md` | Yes | How these map onto the blog's generator system |
| `POTENTIALS.md` | Yes | Every pattern mapped to the generator that would draw it |
| `README.md` | Yes | This file |

`svg/` is excluded via `design-system/.gitignore`. That is deliberate and load-bearing:
it keeps 17 MB of third-party artwork out of the repo's history and makes it impossible
to redistribute the files by accident. **Do not remove that ignore rule.**

Because the artwork is not committed, a fresh clone has an empty `svg/`. Repopulate it:

```sh
cd design-system/reference/bookofshapes
python3 fetch.py          # ~2 min, rate limited; stdlib only, no deps
```

Then browse them in our own palette:

```sh
python3 contact_sheet.py
python3 -m http.server 8765      # http, not file:// — see below
open http://localhost:8765/contact-sheet.html
```

A filterable contact sheet of all 57, recoloured to the brutalist accents, each annotated
with its verdict from `verdicts.json`. **It is local-only by design**: it embeds the
artwork, so it is gitignored and must never be deployed. It has to be *served* rather than
opened as a file because it inlines each SVG with `fetch()` — which is the same constraint
described under theming below, met head-on.

`manifest.json`, `verdicts.json` and `ATTRIBUTION.md` *are* committed, so the catalogue — every slug,
title, description, tag and source URL — stays browsable and greppable without
downloading anything.

## Licensing status — the important part

**There is no licence.** I checked, on 2026-08-30:

- `/license`, `/terms`, `/about`, `/imprint`, `/impressum` → all HTTP 404
- The homepage, the privacy page and individual pattern pages carry no licence,
  terms-of-use, or permitted-reuse statement of any kind
- The only rights statement anywhere on the site is
  `© 2026 Book of Shapes — created by Nikolaj Sokolowski`

Absent a licence grant, copyright defaults to **all rights reserved**. Attribution on
its own does not grant permission to use, adapt or redistribute the work — that is a
Creative Commons habit, not a legal default. So attribution is necessary here but not
sufficient.

### What that means in practice

| | |
| --- | --- |
| ✅ **Fine** | Browsing these locally for ideas |
| ✅ **Fine** | Reading the SVG source to learn *how* an effect is constructed (phyllotaxis spacing, Truchet tiling, noise-driven displacement) |
| ✅ **Fine** | Writing our **own** generator that produces a pattern in a similar *genre*, from our own code — a technique is not copyrightable, a specific artwork is |
| ⚠️ **Ask first** | Shipping any of these SVGs, modified or not, on the blog or in the design system |
| ⚠️ **Ask first** | Committing any of them to a public repo |
| ❌ **No** | Re-publishing the set, or presenting any of it as our own work |

The clean path if we want a pattern verbatim: **email and ask.**
Nikolaj is reachable at `nikolaj@creasurf.net`, or
[@Threeaio](https://x.com/Threeaio) / [nikolaj-sokolowski.de](https://nikolaj-sokolowski.de/).
A short note naming the specific patterns, where they'd appear, and offering a visible
credit link is usually all this takes. Record the answer in this file when it arrives.

**Nothing here is a substitute for the author's own answer.** If he publishes terms
later, or replies to an email, that supersedes everything above — update this section.

## The catalogue

57 patterns, tagged by the source site (patterns can carry more than one tag):

| Tag | Count | Character |
| --- | --- | --- |
| `grid` | 22 | Regular lattices, Truchet tilings, quarter-circle arcs |
| `radial` | 18 | Concentric rings, spokes, phyllotaxis, rose curves |
| `noise` | 18 | Noise-displaced fields and landscapes |
| `flow` | 17 | Streamlines, wave fields, converging lines |
| `isometric` | 13 | Cube grids and pseudo-3D structures |
| `organic` | 9 | Node gardens, meshes, growth forms |
| `distortion` | 8 | Warped and jittered variants of regular structures |
| `physics` | 5 | Force/interference-driven arrangements |

Full listing with descriptions: [ATTRIBUTION.md](./ATTRIBUTION.md).
Machine-readable: `manifest.json` — e.g. every isometric pattern:

```sh
jq -r '.patterns[] | select(.tags | index("isometric")) | "\(.slug)\t\(.title)"' manifest.json
```

## How the SVGs are built (this is the genuinely useful bit)

Every one of the 57 files follows the same shape — a plain, script-free SVG with a
`<style>` block declaring four custom properties, then geometry that references them:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 259 259" width="259" height="259">
  <style>
    svg {
      --fill-color: #cccccc;
      --stroke-color: #cccccc;
      --background-color: transparent;
      --occlusion-color: #1a1a1a;
    }
  </style>
  ...
</svg>
```

| Variable | Role |
| --- | --- |
| `--fill-color` | Filled shape bodies |
| `--stroke-color` | Outlines and line work |
| `--background-color` | Backdrop behind the pattern (`transparent` by default) |
| `--occlusion-color` | Fill for shapes that hide what's behind them — the trick that makes the isometric patterns read as 3D |

Every reference is written `var(--fill-color, currentColor)`, so a pattern also follows an
inherited `color` if the variables are never set. All four are *declared* in all 57 files,
but only three are widely *used*: **exactly 10 of the 57 reference `--occlusion-color`,
and all 10 are tagged `isometric`** (10 of the 13 isometric patterns). 28 patterns are
stroke-only and 14 fill-only.

That distribution is the useful part. `--occlusion-color` is not decoration — it is what
overlapping geometry needs to say *"this shape hides the one behind it"*, and it is
load-bearing precisely where depth is being faked. Worth stealing for our own generators,
with one catch: occlusion must be **opaque and match the backdrop**. It cannot be derived
from the accent with an alpha, and it cannot be derived from a `transparent` background —
stacked cubes drawn with a see-through occlusion fill show straight through each other. It
has to be its own parameter.

### Why this matters for our theming

These four variables are exactly the seam our own patterns should expose. The design
system's dark variant is class-based (`.dark`, `.dim` — see `src/theme.css`), so a
pattern authored the same way themes for free by mapping the four vars onto brutalist
tokens at the wrapper:

```css
.pattern-host {
  --fill-color: var(--brutalist-cyan, #22d3ee);
  --stroke-color: var(--brutalist-cyan, #22d3ee);
  --background-color: transparent;
  --occlusion-color: var(--brutalist-darkBg, #0a0a1a);
}
```

Two caveats found the hard way:

- **`<img src="...svg">` will not inherit any of this.** External CSS custom properties
  do not cross into an image-referenced SVG document. The vars only take effect on
  *inlined* SVG, or via a `<style>` injected inside the SVG itself. Any pattern we ship
  has to be inlined (or built as a React component) to stay themeable.
- **Do not reference `svg/` from anything in `src/`.** The blog consumes the design
  system as a `file:` dependency, which *copies* the package — a build referencing these
  gitignored paths works locally and breaks in CI, on top of being the licensing problem
  described above.

## Re-fetching, and being a good citizen about it

`fetch.py` reads `/sitemap-0.xml`, scrapes each `/patterns/<slug>/` page for its title,
description and tags, then downloads `/previews/<slug>.svg`. It sleeps 0.75 s between
requests (~2 min for a full run) and sends an identifying User-Agent.

`bookofshapes.com/robots.txt` allows everything except `/api/`. The script only touches
the sitemap, pattern pages and `/previews/*.svg` — **it never calls `/api/`**, and it
should stay that way. If you extend it, keep it off that path and keep the delay.
