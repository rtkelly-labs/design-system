/**
 * The edge census: how much of a rendered surface is drawn as boxes, and how heavily.
 *
 * Measured in the browser from computed style, not from source, so it sees what a reader sees
 * whatever wrote the class: a component, a composition, or another design system's stylesheet.
 * That last case is the point. `scripts/benchmark-edges.mjs` runs this same function over
 * GOV.UK Frontend, Primer CSS and Carbon pages, so the limits in `edges.spec.ts` are calibrated
 * against shipped systems rather than against taste.
 *
 * What counts:
 *
 *   - a **side** is a border edge a reader can see: drawn, opaque enough, and at least 1.15:1
 *     against the ground behind it (an edge in the ground's own colour is spacing, not a line);
 *   - a **frame** is an element with three or four visible sides — a box. Table cells are left
 *     out of the frame count (a grid table would otherwise score one box per cell) but their
 *     edges still count toward ink and the heavy share;
 *   - a frame is **heavy** when every visible side is at least 2px and 3:1 against its ground,
 *     the WCAG non-text floor, and a **heavy panel** is a heavy frame of at least 15,000 px²: a
 *     card, not a tag. A hard offset shadow (no blur) makes any frame of that size a heavy panel.
 *     Controls — buttons, fields, comboboxes — are frames but never heavy panels: their edge is
 *     the affordance, and every benchmark system draws them just as heavily;
 *   - **depth** is how many frames enclose a frame: 0 for a box on the page, 1 for a box in a box.
 *
 * Per screen means per 900px of height at the measured width, so a long page is not punished
 * for being long.
 *
 * Self-contained on purpose: Playwright serialises this function into the page, so it may not
 * close over anything or import anything.
 */

export interface EdgeCensus {
  width: number;
  height: number;
  frames: number;
  heavyFrames: number;
  heavyPanels: number;
  shadowed: number;
  maxDepth: number;
  /** Share of all visible border length drawn at ≥2px and ≥3:1, 0–1. */
  heavyEdgeShare: number;
  /** Border pixel area per thousand pixels of surface. */
  inkPermille: number;
  framesPerScreen: number;
  heavyPanelsPerScreen: number;
  /**
   * Groups of sibling buttons — two or more under one parent — whose `data-appearance` differs:
   * a raised button beside a flat one. Elevation is the button's mode, and a group that mixes
   * modes reads as one button broken rather than as two actions.
   */
  mixedButtonGroups: number;
}

export function measureEdges(rootSelector: string): EdgeCensus {
  const root = (document.querySelector(rootSelector) as HTMLElement | null) ?? document.body;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const rgbaCache = new Map<string, [number, number, number, number]>();
  const rgba = (colour: string): [number, number, number, number] => {
    const hit = rgbaCache.get(colour);
    if (hit) return hit;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = colour;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    const out: [number, number, number, number] = [d[0]!, d[1]!, d[2]!, d[3]! / 255];
    rgbaCache.set(colour, out);
    return out;
  };
  const lum = ([r, g, b]: [number, number, number, number]) => {
    const f = (c: number) => {
      const s = c / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a: [number, number, number, number], b: [number, number, number, number]) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x! + 0.05) / (y! + 0.05);
  };
  const groundCache = new Map<Element, [number, number, number, number]>();
  const ground = (el: Element | null): [number, number, number, number] => {
    if (!el) return rgba(getComputedStyle(document.body).backgroundColor || '#fff');
    const hit = groundCache.get(el);
    if (hit) return hit;
    const bg = rgba(getComputedStyle(el).backgroundColor);
    const out = bg[3] >= 0.5 ? bg : el === document.documentElement ? [255, 255, 255, 1] as [number, number, number, number] : ground(el.parentElement);
    groundCache.set(el, out);
    return out;
  };

  const rootRect = root.getBoundingClientRect();
  const width = Math.max(1, Math.round(rootRect.width));
  const height = Math.max(1, Math.round(Math.max(rootRect.height, root.scrollHeight)));

  const frames: Element[] = [];
  const isFrame = new Set<Element>();
  let heavyFrames = 0;
  let heavyPanels = 0;
  let shadowed = 0;
  let edgeLength = 0;
  let heavyLength = 0;
  let ink = 0;

  // A modal, drawer or popover portals to <body>, outside the story root, and is
  // exactly the kind of heavy panel this counts. Take body-level surfaces too,
  // by the rule story-ready's IS_STORY_SURFACE uses (kept inline: this function
  // runs in the page and can close over nothing).
  const ignored = ['SCRIPT', 'STYLE', 'LINK', 'TEMPLATE', 'NOSCRIPT'];
  const portals =
    root === document.body
      ? []
      : Array.from(document.body.children).filter(
          (el) =>
            el !== root &&
            !ignored.includes(el.tagName) &&
            el.id !== 'storybook-docs' &&
            el.id !== 'storybook-highlights-root' &&
            !el.classList.contains('sb-wrapper') &&
            el.childElementCount > 0,
        );
  const all = [root, ...portals].flatMap((r) => [r, ...Array.from(r.querySelectorAll('*'))]);
  for (const el of all) {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) continue;

    const shadow = style.boxShadow;
    const hasShadow = Boolean(shadow) && shadow !== 'none';
    if (hasShadow) shadowed += 1;
    // A hard offset shadow: an offset and a zero blur, e.g. `rgb(…) 4px 4px 0px 0px`.
    const hardShadow = hasShadow && /(-?\d+(?:\.\d+)?)px (-?\d+(?:\.\d+)?)px 0px/.test(shadow) && !/ 0px 0px 0px/.test(shadow);

    const behind = ground(el.parentElement);
    const sides = (['Top', 'Right', 'Bottom', 'Left'] as const).map((side) => {
      const w = parseFloat(style.getPropertyValue(`border-${side.toLowerCase()}-width`)) || 0;
      const s = style.getPropertyValue(`border-${side.toLowerCase()}-style`);
      if (w < 0.5 || s === 'none' || s === 'hidden') return null;
      const c = rgba(style.getPropertyValue(`border-${side.toLowerCase()}-color`));
      if (c[3] < 0.1) return null;
      const contrast = ratio(c, behind);
      if (contrast < 1.15) return null;
      const length = side === 'Top' || side === 'Bottom' ? rect.width : rect.height;
      return { w, contrast, length };
    });
    const visible = sides.filter((s): s is { w: number; contrast: number; length: number } => s !== null);
    for (const s of visible) {
      edgeLength += s.length;
      ink += s.length * s.w;
      if (s.w >= 2 && s.contrast >= 3) heavyLength += s.length;
    }

    const cell = el.tagName === 'TD' || el.tagName === 'TH';
    if (visible.length >= 3 && !cell) {
      frames.push(el);
      isFrame.add(el);
      const heavy = visible.every((s) => s.w >= 2 && s.contrast >= 3);
      if (heavy) heavyFrames += 1;
      // A control's edge is its affordance — GOV.UK's inputs and buttons are as heavy as this
      // system's — so a full-width button or field is a frame but never a heavy panel.
      const control = el.matches('button, input, select, textarea, [role="button"], [role="combobox"], [role="textbox"]');
      if (!control && (heavy || hardShadow) && rect.width * rect.height >= 15000) heavyPanels += 1;
    }
  }

  let maxDepth = 0;
  for (const el of frames) {
    let depth = 0;
    for (let p = el.parentElement; p && p !== root.parentElement; p = p.parentElement) if (isFrame.has(p)) depth += 1;
    if (depth > maxDepth) maxDepth = depth;
  }

  let mixedButtonGroups = 0;
  const parents = new Set<Element>();
  for (const b of Array.from(root.querySelectorAll('[data-slot="button"][data-appearance]'))) if (b.parentElement) parents.add(b.parentElement);
  for (const parent of parents) {
    const modes = new Set(
      Array.from(parent.children)
        .filter((child) => child.matches('[data-slot="button"][data-appearance]'))
        .map((child) => child.getAttribute('data-appearance')),
    );
    if (modes.size > 1) mixedButtonGroups += 1;
  }

  const screens = Math.max(1, height / 900);
  return {
    width,
    height,
    frames: frames.length,
    heavyFrames,
    heavyPanels,
    shadowed,
    maxDepth,
    heavyEdgeShare: edgeLength === 0 ? 0 : Math.round((heavyLength / edgeLength) * 1000) / 1000,
    inkPermille: Math.round((ink / (width * height)) * 10000) / 10,
    framesPerScreen: Math.round((frames.length / screens) * 10) / 10,
    heavyPanelsPerScreen: Math.round((heavyPanels / screens) * 10) / 10,
    mixedButtonGroups,
  };
}
