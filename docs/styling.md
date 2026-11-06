# Styling lives in TSX

**Parent:** [`AGENTS.md`](../AGENTS.md)

Why styles are authored in components rather than stylesheets, and the ratchet that keeps them there.

---

## Targeting a component's internals — `data-slot`

`className` reaches a component's **root** and nothing else. Before this, a consumer who needed to
adjust one part — the label inside a field, the caption under a table, the status pill in a
pagination bar — had three options, and all three are bad:

1. a new prop (`labelClassName`, `captionClassName`, …), which grows the API for every part of every
   component
2. a descendant selector against a Tailwind utility that happens to be there today
3. reimplementing the component

So every multi-part component marks its parts:

```css
[data-slot="field-label"]   { letter-spacing: 0.1em }
[data-slot="table-cell"]    { padding-block: 0.25rem }
```

**A slot name is public API.** It is the one thing here a consumer writes a selector against, so
renaming one breaks them exactly as renaming a prop would — and under the criteria in
[`research.md`](./research.md) §1 that makes it a breaking change, not a refactor. Name a slot for
the *part*, never for how it currently looks: `field-label`, not `field-uppercase-text`.

Single-element components do not need one. The rule is that a consumer should be able to reach
anything they can see as a distinct thing, and in a component that renders one element the root
already is that.

Convention: `<component>` for the root, `<component>-<part>` below it, kebab-case throughout.


## Inline styles, and the one case that is legitimate

`style={{ … }}` is unreachable by a consumer's `className`. That is #47's third idiom and the
one it is most right about: a caller can override a utility, and cannot override an inline
style without `!important`.

`check:component-contract` holds the count at a budget rather than forbidding them, because
**about a third are legitimate**. A runtime value cannot be a utility — Tailwind's scanner
reads source text and generates nothing for `bg-[${value}]` — so `Avatar`'s ring colour,
`Badge`'s accent and `Swatch`'s well are inline by necessity, and each says so where it
happens.

Telling the two apart needs judgement a script does not have, so the gate counts all of them
and stops the number rising. A ratchet on a number nobody can argue with beats a classifier
that is wrong a third of the time.

**Paying it down is per-component work**, not a sweep: converting a style object to utilities
is a rendering change, so each one wants its own baseline review. The concentration is in the
demo surfaces — `AdminDashboardLayout` (41) and `SaasLandingPage` (26) are nearly half the
total, and they are mockups rather than published components.


## 🧱 Styling Lives in TSX

**A component's appearance is written on its elements, as Tailwind utilities.
CSS files declare variables.** There is no third place for styling to live, and
no `.component-name { … }` class to go looking in.

Composition goes through **`recipe` from `src/lib/recipe.ts`** — never a
template string. `src/components/Input.tsx` is the worked example: one slot per
element, variants as data, and the consumer's `className` passed as the recipe's
`class` override.

That last part is a correctness fix, not a convenience. Appending a caller's
`className` to the end of a string does nothing: Tailwind decides between two
conflicting utilities by **CSS source order**, not class-attribute order, so a
caller's `bg-surface-raised` was racing the component's `bg-surface-base` and
whichever the stylesheet emitted later won. Every `className` prop in this
package was unreliable in exactly that way. `recipe` resolves the conflict
before the string reaches the DOM.

**Which library builds the recipes is an implementation detail of that one
file.** `tailwind-variants` currently does, chosen because most components here
style more than one element and the alternatives model one element per recipe.
Nothing else in the package names it, and `recipe` is deliberately **not**
exported from the entrypoint: its type comes from that library, so exporting it
would put the library back into the published `.d.ts` and make swapping it a
breaking change. `cn` is public, with a signature written out locally for the
same reason.

Only the hard-shadow scale needs declaring to the class merger — `shadow-none`
could not otherwise clear `shadow-hard-md`. Everything else works untouched: the
merger classifies the semantic tokens correctly out of the box, including telling
a colour from a size in the same `text-*` position.

`pnpm check:css` enforces it, and it is still a ratchet: it counts
every declaration whose selector names a class this repo authors and fails when
the number rises. `pnpm check:css:list` shows what is left.

### The three things CSS may still do

Each is exempt because there is no element in a component to put a `className`
on — not because it was inconvenient to move.

| Exempt | Why | Where |
|---|---|---|
| Custom properties (`--x: …`) anywhere | Variables are the sanctioned CSS payload | `theme.css`, generated |
| Selectors of only element names, `:root`, `html`, `body`, `*`, pseudo-classes | No JSX element for the document; a consumer's own `<h1>` has no class we can add | `styles.css` |
| Class names emitted by third-party tooling | We never render `.markdown-alert` — a remark plugin does | `prose.css`, listed in `THIRD_PARTY` |

### Prose is the plugin's job, not ours

A Markdown pipeline emits bare tags with no class names, so there is nothing for
a utility to attach to. **`@tailwindcss/typography`** is built for that case, so
the prose layer is the plugin plus two things:

- `@utility prose-ladder` in `prose.css` maps its `--tw-prose-*` knobs onto the
  `--ds-*` role tokens. Variables only, so it is the sanctioned CSS payload —
  and there is deliberately no `--tw-prose-invert-*` block: the plugin needs one
  because it models theming as a light/dark flip, while `--ds-*` already resolves
  per level, so one mapping is correct on all four rungs.
- The brutalist deltas are `prose-h1:` / `prose-table:` / `prose-code:` element
  modifiers in `Prose.tsx` — the plugin's own mechanism for exactly this.

The plugin is an **optional peer dependency**: `@plugin` resolves from the
*consumer's* `node_modules` at their build time, so it cannot be bundled. Only
`prose.css` consumers need it; `theme.css`-only consumers do not.

Chrome nested inside an article (a breadcrumb above the title, a pager below the
body) carries `not-prose`, which every selector the plugin generates excludes.
That replaced ~70 declarations of hand-written reset — and it is the reason to
prefer the plugin over `[&_h2]:…` arbitrary variants on the container, which
would keep all of CSS's specificity gymnastics with worse ergonomics.

There is deliberately **no hook-class exemption**. `AsciiDivider` used to keep a
bare `.ascii-divider` class so the blog could attach `::after` to it — the last
hole in the rule. `Divider` closes it: the mark differs by *polarity*, so that
is now a `Record<Polarity, string>` in the component and the glyph is real text
rather than generated content. When a pseudo-element seems necessary, the
question to ask first is what design decision it is encoding, and whether that
belongs in a component.

### Consequences worth knowing before you rely on them

- **Consumers must import `theme.css` and let Tailwind scan the package.** The
  generated `theme.css` carries `@source "./"`, which points at `dist/` once
  published — verified: a consumer importing only `theme.css` gets every
  utility, variants and arbitrary values included, generated from the compiled
  bundle. This is what makes the rule safe, and it is why that `@source` line
  must never be removed.
- **The system no longer promises to style raw HTML.** `prose.css` styles bare
  tags inside `.docs-prose`; as those move into `mdxComponents`, Markdown must
  be rendered *through* the component map. A consumer pushing a markdown-to-HTML
  string through `dangerouslySetInnerHTML` will get unstyled output.
- **Translate faithfully, then check.** Named Tailwind sizes ship a paired
  line-height that a bare `font-size` declaration did not — `text-xs` is
  `0.75rem` *and* a leading. `Badge` uses `text-[0.75rem]` precisely so it keeps
  inheriting the article's unitless `1.5`. This cost one round of visual-suite
  failures to find; when a migration shifts layout by a few pixels, this is why.

### What is migrated

`styles.css` is done — its four component classes are utilities in `Badge`,
`Divider` and `ExperimentsView`, and `.brutalist-btn` / `.brutalist-btn-pink`
were deleted outright as they had no caller. What is left in that file is
document-level and stays.

`prose.css` is down from 455 declarations to 328. The bare-tag prose rules and
the chrome-inside-prose resets are gone. What remains is the docs chrome —
roughly twelve components, each with a 1:1 class. Migrate one per PR with
`recipe`, and lower its budget line.

`pnpm lint` also answers the other question — **does this class exist at all?**
`eslint-plugin-tailwindcss`'s `no-custom-classname` is the only check that catches
a class naming *nothing*, which is this repo's most expensive recurring bug:
`focus:border-brutalist-green`, `brutalist-card-panel`,
`.sketch .ascii-divider::after` and `bracket-glyph` were all dead on the day they
were written. Tailwind will not help — an unknown utility emits no CSS, exits 0
and warns about nothing.

**The whitelist is derived, not written.** `scripts/authored-classes.mjs` reads
the class names out of `styles.css`, `prose.css` and `theme.css`, so the rule asks
"does this exist" rather than "is this Tailwind". That is the difference between a
usable gate and 51 false positives on the docs chrome — and it maintains itself:
migrate a docs-chrome class into a `recipe`, it leaves `prose.css`, leaves the
derived list, and starts being rejected.

Two configuration details, both load-bearing: `cssConfigPath: 'src/styles.css'`,
because the plugin defaults to the singular `style.css`; and `recipe` in its
`functions`, or it never looks inside a recipe, which is where most class strings
live.

**Its one blind spot is a class string wrapped in a method call** —
`className={foo.trim()}` is not traversed, where `cn(...)`, a recipe slot, a
template literal and a plain string all are. That is one more reason composition
goes through `cn` or `recipe`: the alternatives are invisible to the check.

**No call site sits in that blind spot any more.** Thirteen components composed
with `` `…${className}`.trim() `` and `Tag` did the same thing one step removed,
assigning the template to a variable first — which is why the grep for the
`.trim()` shape found thirteen and the real number was fourteen. All are `cn()`
now. Moving them turned up four dead classes that the rule had never been able
to see: `style-card-wrap`, and `docs-toc` / `docs-sidebar` / `docs-breadcrumbs`,
each of which exists only as the prefix of its children (`docs-toc-link` is a
real rule; `docs-toc` never was). If a fifteenth appears, it will be caught the
day it is written rather than found by a sweep.

The derived whitelist has one hand-maintained entry, `PLUGIN_EMITTED` in
`scripts/authored-classes.mjs`: `not-prose` is generated by
`@tailwindcss/typography`, so no stylesheet here declares it and deriving from
the sheets structurally cannot find it. It is the same category as the
`markdown-alert-*` names in `check-css.mjs`'s THIRD_PARTY. Keep that list to
classes that provably exist — every entry is a place the rule has been told to
stop asking.


