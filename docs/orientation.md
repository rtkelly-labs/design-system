# Orientation — the system in plain terms

**Parent:** [`AGENTS.md`](../AGENTS.md) · **Precise definitions:** [`CONTEXT.md`](../CONTEXT.md)

For anyone who does not work in design day to day, and for the version of yourself that comes
back to this repo in six months. [`CONTEXT.md`](../CONTEXT.md) is the authority on what each
term means and it is written in the vocabulary it defines, which is correct for a glossary and
useless as an introduction. This file is the introduction. Where the two disagree, `CONTEXT.md`
is right.

---

## The one thing to understand

**This is a compiler, not a stylesheet.**

One file holds every colour decision. Generators read it and write it out in whatever format
some other tool wants. CI re-runs the generators and fails if a committed output no longer
matches its source.

```
src/theme/levels.ts          ← a human types colours here, and nowhere else
        │
        ├─ build-tokens.mjs         → src/theme.css              (the website)
        ├─ build-design-tokens.mjs  → tokens/*.tokens.json       (design tools)
        └─ … one generator per format that wants the colours
```

Everything below is vocabulary for the parts of that diagram, plus the maths that checks it.

---

## Why any of this exists

Three problems, and each piece of vocabulary answers one of them.

**1. A component should not know what colour it is.** If a button says `#22d3ee`, changing the
brand means finding every hex in every file, and a second theme is impossible. So a component
says *what a colour is for* and something else decides what that means. That is the **Role**
idea, and it is the system's whole thesis.

**2. The same decisions have to arrive on surfaces that are nothing like a web page.** A
terminal, a code editor, a 1080p video, a generated diagram. Each speaks a different language,
and none of them can read TypeScript. So the source is compiled, not copied. That is
**Target** and **Emitter**.

**3. Nobody can eyeball whether 200 colour pairs are legible.** But a computer can, because
contrast is arithmetic. So the rules are tests that fail CI rather than conventions someone
remembers. That is **Gate**.

---

## The vocabulary, in one sentence each

| Term | In plain terms | Example here |
|---|---|---|
| **Token** | One named design decision, used instead of a literal value. | `accent.primary` rather than `#22d3ee` |
| **Level** | One complete theme. The *reader* picks it, live, in the browser. | `midnight` (neon on near-black), `sketch` (ink on warm paper) |
| **Polarity** | Just "is this theme dark or light". | `midnight` is `dark`; `sketch` is `light` |
| **Group** | A bundle of tokens answering one question. | `surface` = backgrounds, `text` = text colours, `intent` = meaning |
| **Role** | A name for a colour's **job**. What a component is allowed to ask for. | `intent.danger`, `text.muted` |
| **Hue** | A name for a colour's **appearance**. What a component may never ask for. | `cyan`, `pink` |
| **Slot** | A hole that some other tool demands you fill. Its shape, not ours. | a terminal's 16 colour positions |
| **Target** | An output format. | Tailwind CSS, a VS Code theme, a Mermaid theme |
| **Emitter** | The generator that writes one Target. | `scripts/build-tokens.mjs` |
| **Fan-out map** | The lookup for when a Target wants more names than we have. | VS Code's `parameter`, `property` and `namespace` all → `syntax.variable` |
| **Declared** | A human typed this value. | everything in `levels.ts` |
| **Derived** | A script computed this, and CI checks it still matches. | `src/theme.css` — editing it by hand is a bug |
| **Gate** | A check that fails CI. As opposed to a convention someone has to remember. | `pnpm check:contrast` |
| **Medium** | Which *kind of output* a size or a duration is measured for. The **build** picks it, not the reader. | `web`, `video`, `graphic` |

### Role and Hue, since everything hangs off the difference

A **Role** is a job: "the danger colour", "the colour the eye should reach first". A **Hue** is
an appearance: "cyan".

Components may only ever name Roles. That is what makes a re-theme a one-line change.

A Hue vocabulary exists anyway, one layer *underneath*, because some Targets have no concept of
jobs at all — a terminal has sixteen slots literally named red, green, blue, and no notion of
"danger". Without hue names, a terminal scheme cannot be written.

The direction is load-bearing: **a Role points at a Hue, never the reverse.** `intent.danger`
says "I am `palette.red`" — a declared lookup. Going the other way means asking "which of my
sixteen names is `#bd0010`?", which is a guess, and wrong whenever two Roles share a value.

### The two knobs

This is the part [`adr/0004`](./adr/0004-two-axes-level-and-medium.md) exists to name, and the
one most worth having straight:

| Knob | Who turns it | What it changes |
|---|---|---|
| **Level** | the reader, live, in the browser | colour |
| **Medium** | the build, when it chooses an output | sizes, spacing, timing |

A video frame and a web page do not disagree about *colour*. They disagree about **size and
time**: text sized for a 16px page is unreadable in a 1080p frame, and a hover animation timed
in wall-clock seconds smears when a video renderer seeks frame by frame.

Editors and terminals are deliberately **not** Media. VS Code decides its own font size and
line height, and a theme may not touch them. They take colour from us and nothing else.

---

## The maths, and why there is more than one kind

Three different questions, easy to conflate, and each needs its own check:

**Contrast — "can I read this text on that background?"** A ratio. 4.5:1 is the accessibility
standard for text. The Hues are held to 5.5:1, deliberately higher, so an editor still has room
to tint a background *behind* the same text without pushing it below the floor.

**Separation — "do these two colours look different from each other?"** A different question,
and the one most likely to be missed. Ten colours can each be perfectly readable against the
page and still be indistinguishable from one another. Measured as perceptual distance, because
the obvious measure fails badly here: solving every hue to the *same* contrast against the
*same* background makes them all equally bright by construction, so a brightness test rates the
entire palette as identical.

**Headroom — "how far can I tint a background before the text on it breaks?"** What decides
whether a theme can express a selection highlight or a diff band at all.

A useful way to hold it: contrast is foreground *versus background*, separation is foreground
*versus foreground*, headroom is *how much room is left* between them.

---

## Reading order from here

1. [`DESIGN.md`](../DESIGN.md) — the brand itself: what it looks like, what the floors are, what
   a consumer is allowed to do. Start here if you want to *use* the system.
2. [`CONTEXT.md`](../CONTEXT.md) — the precise definitions, once the shapes above are familiar.
3. [`theming.md`](./theming.md) — the rules a component author follows.
4. [`theme-taxonomy.md`](./theme-taxonomy.md) — which Groups a Level must declare before a given
   Target can be emitted. The reference you reach for when adding an output format.
5. [`adr/`](./adr/) — why each structural decision was made, and what was rejected. Read these
   before changing any of it; each one records the option that looks obviously better until you
   read the argument against it.
