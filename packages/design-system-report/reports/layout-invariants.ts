/**
 * Layout invariants: rendering defects found as geometry, not by eye.
 *
 * `inspectLayout` runs inside Chromium (print media, paper width) over every plate cell
 * ([data-component][data-state][data-rung]) and reports:
 *
 *   escape      an element's content outgrew its own box: scrollWidth > clientWidth or scrollHeight >
 *               clientHeight, whatever `overflow` says (hidden hides the defect, it does not fix it)
 *   spill       a text rect reaches past the content box of its nearest block ancestor (visible
 *               overflow: it prints over the border or the neighbour; hidden/clip: it is cut off), or
 *               any painted element runs past the cell's right edge
 *   truncation  text-overflow: ellipsis or a line-clamp that is actually cutting (scroll > client)
 *   overlap     sibling boxes, and text rects of unrelated elements, that intersect
 *
 * `inspectFonts` is the fifth, read from the PDF with pdfjs-dist: which font each printed glyph run used,
 * and which characters were drawn in a face outside the design system's set (tofu / fallback).
 *
 * Every violation carries the plate cell, the offending element's data-slot (else a short selector
 * path) and the measured numbers. `ratchetKey` is stable across runs so a baseline can be recorded and
 * only new violations fail.
 */

import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';

export type Invariant = 'escape' | 'spill' | 'truncation' | 'overlap' | 'font';

export interface Violation {
  inv: Invariant;
  component: string;
  state: string;
  rung: string;
  page: number;
  /** data-slot of the offending element, else a short selector path. */
  where: string;
  detail: string;
  /** Stable across runs: invariant | component | where. Rung and state are deliberately left out. */
  ratchetKey: string;
}

/** Why a finding is not a defect. Matched on invariant, component and slot/selector substring. */
export interface Allow {
  inv?: Invariant;
  component?: string;
  /** Substring of `where`. */
  where?: string;
  reason: string;
}

export interface InspectOptions {
  /** Limit to one cell, `component/state/rung`. */
  only?: string;
  /** px. Boxes and text may exceed their container by this much (sub-pixel layout, rounding). */
  tolerance?: number;
  /** px of overlap on both axes before two boxes count as overlapping. */
  overlapTolerance?: number;
}

export interface RawViolation extends Omit<Violation, 'ratchetKey'> {
  /** The offending element, for the mutation harness only (never serialised across). */
}

/**
 * Page side. Self-contained: it is serialised with Function.prototype.toString, so it may not
 * reference anything outside its own body.
 */
export function inspectLayout(opts: InspectOptions = {}): RawViolation[] {
  const tol = opts.tolerance ?? 1;
  const otol = opts.overlapTolerance ?? 1.5;
  const out: RawViolation[] = [];
  const f = (n: number) => Math.round(n * 10) / 10;

  const cells = [...document.querySelectorAll<HTMLElement>('[data-component][data-state][data-rung]')].filter(
    (c) => !opts.only || `${c.dataset.component}/${c.dataset.state}/${c.dataset.rung}` === opts.only,
  );

  const path = (el: Element, root: Element) => {
    const slot = el.closest('[data-slot]');
    if (slot && root.contains(slot)) {
      const own = el === slot ? '' : ` > ${el.tagName.toLowerCase()}`;
      return `${slot.getAttribute('data-slot')}${own}`;
    }
    const parts: string[] = [];
    for (let a: Element | null = el; a && a !== root && parts.length < 3; a = a.parentElement) {
      const sibs = a.parentElement ? [...a.parentElement.children].filter((c) => c.tagName === a!.tagName) : [];
      parts.unshift(a.tagName.toLowerCase() + (sibs.length > 1 ? `:nth-of-type(${sibs.indexOf(a) + 1})` : ''));
    }
    return parts.join(' > ');
  };

  const isSrOnly = (el: Element, cs: CSSStyleDeclaration) => {
    const r = el.getBoundingClientRect();
    return /absolute|fixed/.test(cs.position) && r.width <= 1 && r.height <= 1 && (cs.overflowX !== 'visible' || cs.clip !== 'auto' || /inset|rect/.test(cs.clipPath));
  };
  const outOfFlow = (cs: CSSStyleDeclaration) => /absolute|fixed|sticky/.test(cs.position);
  const hiddenish = (el: Element, cs: CSSStyleDeclaration) => cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0' || isSrOnly(el, cs);

  /** True when the element or any ancestor up to `root` is not rendered for a sighted reader, or is out of flow. */
  const skipTree = (el: Element, root: Element, outOfFlowToo: boolean) => {
    for (let a: Element | null = el; a; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (hiddenish(a, cs)) return true;
      if (outOfFlowToo && outOfFlow(cs)) return true;
      if (a === root) break;
    }
    return false;
  };
  /**
   * scrollWidth also counts absolutely positioned decoration (registration marks hung off a corner).
   * Re-measure from in-flow descendants only: do their rects, and the element's own text, stay inside the
   * client box? Screen px, so a scaled plate measures the same as an unscaled one.
   */
  const inFlowExtentExceeds = (el: HTMLElement, cs: CSSStyleDeclaration, t: number, fs: number) => {
    const r = el.getBoundingClientRect();
    const sx = el.offsetWidth > 0 ? r.width / el.offsetWidth : 1;
    const sy = el.offsetHeight > 0 ? r.height / el.offsetHeight : 1;
    const right = r.left + (parseFloat(cs.borderLeftWidth) + el.clientWidth) * sx;
    const bottom = r.top + (parseFloat(cs.borderTopWidth) + el.clientHeight) * sy;
    let maxR = -Infinity;
    let maxB = -Infinity;
    const take = (l: number, rr: number, b: number) => { if (rr > maxR) maxR = rr; if (b > maxB) maxB = b; void l; };
    const rg = document.createRange();
    const walk = (node: Element) => {
      for (const c of node.childNodes) {
        if (c.nodeType === 3 && (c.nodeValue ?? '').trim()) {
          rg.selectNodeContents(c);
          for (const q of rg.getClientRects()) if (q.width > 0.5) take(q.left, q.right, q.bottom);
        } else if (c.nodeType === 1) {
          const k = c as HTMLElement;
          const ks = getComputedStyle(k);
          if (outOfFlow(ks) || ks.display === 'none') continue;
          const kr = k.getBoundingClientRect();
          if (kr.width > 0 && kr.height > 0) take(kr.left, kr.right, kr.bottom);
          walk(k);
        }
      }
    };
    walk(el);
    return maxR > right + t * sx || maxB > bottom + Math.max(t, 0.25 * fs) * sy;
  };
  const hasText = (el: Element) => (el.textContent ?? '').trim().length > 0;

  const push = (cell: HTMLElement, inv: Invariant, el: Element, detail: string) => {
    const sheet = cell.closest<HTMLElement>('[data-page]');
    out.push({
      inv,
      component: cell.dataset.component ?? '',
      state: cell.dataset.state ?? '',
      rung: cell.dataset.rung ?? '',
      page: Number(sheet?.dataset.page ?? 0),
      where: path(el, cell),
      detail,
    });
  };

  for (const cell of cells) {
    const body = (cell.lastElementChild as HTMLElement | null) ?? cell;
    const br = body.getBoundingClientRect();
    const els = [body, ...body.querySelectorAll<HTMLElement>('*')].filter((e) => !(e instanceof SVGElement) && !skipTree(e, body, false));

    // 1 + 3: escape and truncation
    for (const el of els) {
      const cs = getComputedStyle(el);
      if (cs.display === 'inline' || cs.display === 'contents') continue;
      if (/^(auto|scroll)$/.test(cs.overflowX) || /^(auto|scroll)$/.test(cs.overflowY)) {
        // A scroll container's overflow is its purpose. (It never prints.)
        if (!/ellipsis/.test(cs.textOverflow)) continue;
      }
      if (el.clientWidth === 0 && el.clientHeight === 0) continue;
      const dw = el.scrollWidth - el.clientWidth;
      // Vertical: a line box taller than its leading (leading-none headings, descenders) pokes out by a fraction of the font size without being a defect.
      const fs = Math.max(parseFloat(cs.fontSize), ...[...el.children].map((k) => parseFloat(getComputedStyle(k).fontSize) || 0));
      const dh = el.scrollHeight - el.clientHeight - Math.max(0, 0.25 * fs - tol);
      const clamped = (cs.webkitLineClamp && cs.webkitLineClamp !== 'none') || /ellipsis/.test(cs.textOverflow);
      const cutting = /hidden|clip/.test(cs.overflowX + cs.overflowY);
      if (clamped && cutting && (dw > tol || dh > tol)) {
        push(cell, 'truncation', el, `${cs.webkitLineClamp !== 'none' ? 'line-clamp ' + cs.webkitLineClamp : 'ellipsis'}: content ${el.scrollWidth}x${el.scrollHeight} in box ${el.clientWidth}x${el.clientHeight}`);
        continue;
      }
      // A clipped box with nothing to read in it is decoration (a bar, a skeleton shimmer, a rail).
      if (cutting && !hasText(el)) continue;
      if ((dw > tol || dh > tol) && inFlowExtentExceeds(el, cs, tol, fs)) {
        push(cell, 'escape', el, `content ${el.scrollWidth}x${el.scrollHeight} outgrew box ${el.clientWidth}x${el.clientHeight} (overflow ${cs.overflowX}/${cs.overflowY})`);
      }
    }

    // 2: text spill, per text node line rect
    interface TextRect { owner: HTMLElement; l: number; t: number; r: number; b: number; s: string }
    const trs: TextRect[] = [];
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const owner = n.parentElement;
      if (!owner || !(n.nodeValue ?? '').trim() || owner instanceof SVGElement || owner.closest('svg')) continue;
      if (skipTree(owner, body, false)) continue;
      if (/^(SELECT|OPTION|SCRIPT|STYLE|TITLE|DESC)$/.test(owner.tagName)) continue;
      range.selectNodeContents(n);
      const rects = [...range.getClientRects()].filter((r) => r.width > 0.5 && r.height > 0.5);
      // Containing block: nearest ancestor that is not inline.
      let box: HTMLElement | null = owner;
      while (box && box !== body.parentElement && /^(inline|contents)$/.test(getComputedStyle(box).display)) box = box.parentElement;
      box = box ?? body;
      const bcs = getComputedStyle(box);
      const bb = box.getBoundingClientRect();
      // The plates are printed scaled (a transform on an ancestor): computed lengths are layout px, rects are screen px.
      const sx = box.offsetWidth > 0 ? bb.width / box.offsetWidth : 1;
      const sy = box.offsetHeight > 0 ? bb.height / box.offsetHeight : 1;
      const cl = bb.left + (parseFloat(bcs.borderLeftWidth) + parseFloat(bcs.paddingLeft)) * sx;
      const cr = bb.right - (parseFloat(bcs.borderRightWidth) + parseFloat(bcs.paddingRight)) * sx;
      const ct = bb.top + (parseFloat(bcs.borderTopWidth) + parseFloat(bcs.paddingTop)) * sy;
      const cb = bb.bottom - (parseFloat(bcs.borderBottomWidth) + parseFloat(bcs.paddingBottom)) * sy;
      const text = (n.nodeValue ?? '').trim().slice(0, 24);
      const oop = skipTree(owner, body, true);
      let worst = 0;
      let what = '';
      // What a reader can see of this text: narrowed by every clipping ancestor (an ellipsised line's
      // untruncated tail lies under its neighbour but is not painted).
      const vis = { l: -Infinity, t: -Infinity, r: Infinity, b: Infinity };
      for (let a: HTMLElement | null = owner; a && a !== body.parentElement; a = a.parentElement) {
        const o = getComputedStyle(a);
        if (/hidden|clip/.test(o.overflowX)) { const q = a.getBoundingClientRect(); vis.l = Math.max(vis.l, q.left); vis.r = Math.min(vis.r, q.right); }
        if (/hidden|clip/.test(o.overflowY)) { const q = a.getBoundingClientRect(); vis.t = Math.max(vis.t, q.top); vis.b = Math.min(vis.b, q.bottom); }
      }
      for (const r of rects) {
        if (!oop) {
          const l = Math.max(r.left, vis.l);
          const rr = Math.min(r.right, vis.r);
          const t = Math.max(r.top, vis.t);
          const b = Math.min(r.bottom, vis.b);
          if (rr - l > 0.5 && b - t > 0.5) trs.push({ owner, l, t, r: rr, b, s: text });
        }
        // Text centred in a narrower flex/grid track legitimately straddles nothing; only flag
        // the sides the box can actually push on. Vertical: a line box may exceed a fixed height.
        const right = r.right - cr;
        const left = cl - r.left;
        const bottom = r.bottom - cb;
        const top = ct - r.top;
        const m = Math.max(right, left);
        if (m > tol && m > worst && !/ellipsis/.test(bcs.textOverflow)) { worst = m; what = right >= left ? `right +${f(right)}px` : `left +${f(left)}px`; }
        const mv = Math.max(bottom, top);
        // Vertical spill only counts when the box has a fixed height (content-sized boxes grow).
        if (mv > tol + 1 && bcs.height !== 'auto' && /px$/.test(bcs.height) && box.scrollHeight <= box.clientHeight + tol && mv > worst) { worst = mv; what = bottom >= top ? `bottom +${f(bottom)}px` : `top +${f(top)}px`; }
      }
      if (worst > 0 && !oop) {
        const clipping = /hidden|clip/.test(bcs.overflowX + bcs.overflowY);
        push(cell, 'spill', owner, `"${text}" ${clipping ? 'cut off by' : 'spills past'} ${box.getAttribute('data-slot') ?? box.tagName.toLowerCase()} content box (${what}); box ${f(cr - cl)}x${f(cb - ct)}`);
      }
    }
    // Anything painted past the cell body's right edge with nothing clipping it prints over the neighbour.
    for (const el of els) {
      if (el === body) continue;
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' || outOfFlow(cs)) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || r.right <= br.right + tol) continue;
      let clipped = false;
      for (let a: HTMLElement | null = el.parentElement; a && a !== body.parentElement; a = a.parentElement) {
        const o = getComputedStyle(a);
        if (o.overflowX !== 'visible') { clipped = true; break; }
      }
      if (!clipped && (hasText(el) || el.children.length === 0)) push(cell, 'spill', el, `box runs ${f(r.right - br.right)}px past the cell's right edge (cell ${f(br.width)}px)`);
    }

    // 4a: sibling boxes
    for (const parent of [body, ...body.querySelectorAll<HTMLElement>('*')]) {
      if (parent instanceof SVGElement || skipTree(parent, body, false)) continue;
      const kids = [...parent.children].filter((k): k is HTMLElement => {
        if (k instanceof SVGElement) return false;
        const cs = getComputedStyle(k);
        if (hiddenish(k, cs) || outOfFlow(cs) || cs.display === 'contents' || cs.display === 'none') return false;
        const r = k.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && cs.display !== 'inline';
      });
      for (let i = 0; i < kids.length; i++) {
        for (let j = i + 1; j < kids.length; j++) {
          const a = kids[i]!.getBoundingClientRect();
          const b = kids[j]!.getBoundingClientRect();
          const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (ox > otol && oy > otol) {
            push(cell, 'overlap', kids[i]!, `sibling boxes intersect by ${f(ox)}x${f(oy)}px with ${path(kids[j]!, body)}`);
          }
        }
      }
    }
    // 4b: text rects of unrelated elements
    for (let i = 0; i < trs.length; i++) {
      for (let j = i + 1; j < trs.length; j++) {
        const a = trs[i]!;
        const b = trs[j]!;
        if (a.owner === b.owner || a.owner.contains(b.owner) || b.owner.contains(a.owner)) continue;
        const ox = Math.min(a.r, b.r) - Math.max(a.l, b.l);
        const oy = Math.min(a.b, b.b) - Math.max(a.t, b.t);
        // Line boxes of tight leading overlap vertically by a few px; demand a real share of the shorter rect.
        if (ox > otol && oy > Math.max(otol, 0.35 * Math.min(a.b - a.t, b.b - b.t))) {
          push(cell, 'overlap', a.owner, `text "${a.s}" overlaps "${b.s}" (${path(b.owner, body)}) by ${f(ox)}x${f(oy)}px`);
        }
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Fonts, from the PDF.

export const ALLOWED_FONTS = ['IBM Plex Mono', 'Inter', 'Space Grotesk', 'VT323', 'DS Symbols', 'Symbols Nerd Font Mono'] as const;
const squash = (s: string) => s.replace(/^[A-Z]{6}\+/, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
// pdf.js reports the Nerd Font under its PostScript name, not its family name.
const allowedSquashed = [...ALLOWED_FONTS.map(squash), 'symbolsnfm', 'plexmono'];
export const fontAllowed = (name: string) => allowedSquashed.some((a) => squash(name).includes(a));

export interface FontFinding {
  page: number;
  font: string;
  chars: string;
  /** Cell the run sits in, when it can be placed. */
  cell?: string;
}

interface PdfTextItem { str: string; fontName: string; transform: number[] }
interface PdfPageLike {
  view: number[];
  getOperatorList(): Promise<unknown>;
  getTextContent(): Promise<{ items: (PdfTextItem | object)[] }>;
  commonObjs: { get(id: string): { name?: string } | undefined; has(id: string): boolean };
}

/** Fonts used on each page of the PDF that are not in the allowed set, with the characters drawn in them. */
export async function inspectFonts(
  pdfPath: string,
  cells: readonly { key: string; page: number; body: { x: number; y: number; w: number; h: number } }[] = [],
  pages?: ReadonlySet<number>,
  pageOffset = 0,
): Promise<FontFinding[]> {
  const pdfjs = (await import('pdfjs-dist/legacy/build/pdf.mjs')) as unknown as {
    getDocument(o: { data: Uint8Array }): { promise: Promise<{ numPages: number; getPage(n: number): Promise<PdfPageLike> }> };
  };
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await readFile(pdfPath)) }).promise;
  const found = new Map<string, FontFinding>();
  for (let n = 1; n <= doc.numPages; n++) {
    if (pages && !pages.has(n)) continue;
    const page = await doc.getPage(n);
    await page.getOperatorList(); // loads the page's fonts into commonObjs
    const height = page.view[3]! - page.view[1]!;
    const items = (await page.getTextContent()).items.filter((i): i is PdfTextItem => 'fontName' in i && i.str.trim() !== '');
    for (const it of items) {
      let name = it.fontName;
      try {
        name = page.commonObjs.get(it.fontName)?.name ?? it.fontName;
      } catch {
        /* keep the id */
      }
      if (fontAllowed(name)) continue;
      const x = (it.transform[4]! * 96) / 72;
      const y = ((height - it.transform[5]!) * 96) / 72;
      const logical = n + pageOffset;
      const cell = cells.find((c) => c.page === logical && x >= c.body.x - 3 && x <= c.body.x + c.body.w + 3 && y >= c.body.y - 3 && y <= c.body.y + c.body.h + 3)?.key;
      const k = `${n}|${name}|${cell ?? ''}`;
      const cur = found.get(k) ?? { page: logical, font: name, chars: '', cell };
      for (const ch of it.str.replace(/\s/g, '')) if (!cur.chars.includes(ch)) cur.chars += ch;
      found.set(k, cur);
    }
  }
  return [...found.values()];
}

// ---------------------------------------------------------------------------------------------
// Allowlist, ratchet.

/** Filters, with reasons. Keep this list short and every entry explained; an entry is a decision. */
export const ALLOWLIST: readonly Allow[] = [
  { inv: 'escape', component: 'TickerTape', where: 'ticker-tape > div', reason: 'the marquee track is wider than its overflow:hidden window by design; it is what scrolls' },
  { inv: 'escape', component: 'ActivityGrid', where: 'activity-grid > span', reason: 'month labels hang over the next, empty, week column; no other text is there to collide with (overlap still checks)' },
  { inv: 'spill', component: 'ActivityGrid', where: 'activity-grid > span', reason: 'same month labels: spill into the empty neighbouring column is the layout' },
  { inv: 'spill', component: 'AnchorHeading', where: 'anchor-heading', reason: 'a heading box at tight leading: the descender of the last line sits 2px past the line box, painted and unclipped' },
];

// Filtered in the page, not here (each is a general rule, not a finding to list):
//   sr-only          absolute/fixed, <=1px, clipped: never painted
//   out of flow      position absolute/fixed/sticky boxes are placed on purpose (registration marks, badges); they
//                    are skipped for overlap, and scrollWidth overflow they cause is re-measured from in-flow content
//   scroll container overflow auto/scroll: overflowing is its job (and it does not print)
//   decorative clip  overflow hidden with no text inside (bars, rails, skeleton shimmer)
//   tight leading    vertical overflow under 0.25em of the largest font in the box (descenders, leading-none headings)
//   clipped text     an ellipsised or clipped line is intersected with its clip box before the overlap test
//   scaled plates    plates print under a transform: computed lengths are multiplied by rect/offset before comparing to rects

export function applyAllowlist(raw: readonly RawViolation[], allow: readonly Allow[] = ALLOWLIST): { violations: Violation[]; allowed: { v: Violation; reason: string }[] } {
  const violations: Violation[] = [];
  const allowed: { v: Violation; reason: string }[] = [];
  const seen = new Set<string>();
  for (const r of raw) {
    const v: Violation = { ...r, ratchetKey: `${r.inv}|${r.component}|${r.where}` };
    const hit = allow.find((a) => (!a.inv || a.inv === v.inv) && (!a.component || a.component === v.component) && (!a.where || v.where.includes(a.where)));
    if (hit) allowed.push({ v, reason: hit.reason });
    else {
      // Same finding across rungs/states of one component collapses for the ratchet, not for the report.
      violations.push(v);
      seen.add(v.ratchetKey);
    }
  }
  return { violations, allowed };
}

/** Violations whose ratchet key is not in the recorded baseline: the only ones that should fail a build. */
export const newViolations = (violations: readonly Violation[], baseline: ReadonlySet<string>) => violations.filter((v) => !baseline.has(v.ratchetKey));

// ---------------------------------------------------------------------------------------------
// Node runner.

interface Page {
  goto(url: string): Promise<unknown>;
  emulateMedia(o: object): Promise<void>;
  evaluate<T>(fn: string | ((arg: never) => T), arg?: unknown): Promise<T>;
  pdf(o: object): Promise<Uint8Array>;
  addStyleTag(o: { content: string }): Promise<unknown>;
}
interface Browser {
  newPage(o: object): Promise<Page>;
  close(): Promise<void>;
}
export const playwright = () => createRequire(import.meta.url)('playwright') as { chromium: { launch(): Promise<Browser>; executablePath(): string } };

export function chromiumAvailable(): boolean {
  try {
    return existsSync(playwright().chromium.executablePath());
  } catch {
    return false;
  }
}

export const PAPER_W = 794;

export async function openPrintPage(browser: Browser, htmlPath: string, width = PAPER_W): Promise<Page> {
  const page = await browser.newPage({ viewport: { width, height: 1123 } });
  await page.goto(new URL(`file://${htmlPath}`).href);
  await page.emulateMedia({ media: 'print' });
  await page.evaluate('document.fonts.ready');
  return page;
}

/** Page-side inspection, called with options. */
export const runLayout = (page: Page, opts: InspectOptions = {}): Promise<RawViolation[]> =>
  page.evaluate(`(${inspectLayout.toString()})(${JSON.stringify(opts)})`);

/** A font finding in the same shape as a layout violation, so one report and one ratchet cover both. */
export function fontViolations(found: readonly FontFinding[]): Violation[] {
  return found.map((f) => {
    const [component = '?', state = '?', rung = '?'] = (f.cell ?? '?/?/?').split('/');
    return {
      inv: 'font',
      component,
      state,
      rung,
      page: f.page,
      where: f.font.replace(/^[A-Z]{6}\+/, ''),
      detail: `${JSON.stringify(f.chars)} drawn in ${f.font}, outside the design system's fonts`,
      ratchetKey: `font|${component}|${f.font.replace(/^[A-Z]{6}\+/, '')}`,
    };
  });
}

// ---------------------------------------------------------------------------------------------
// Mutation harness: inject a defect into a clean plate and ask whether the detector notices.

export type MutantKind = 'fixed-width' | 'nowrap-hidden' | 'flex-min-width' | 'negative-margin' | 'missing-font';

export interface MutantSpec {
  kind: MutantKind;
  css: string;
  /** Invariants any one of which counts as a kill. */
  kills: readonly Invariant[];
}

export const MUTANTS: readonly MutantSpec[] = [
  { kind: 'fixed-width', css: 'width:40px', kills: ['escape', 'spill', 'overlap'] },
  { kind: 'nowrap-hidden', css: 'white-space:nowrap;overflow:hidden', kills: ['escape', 'spill', 'truncation'] },
  { kind: 'flex-min-width', css: 'min-width:600px;flex:none', kills: ['escape', 'spill', 'overlap'] },
  { kind: 'negative-margin', css: 'margin-top:-14px;margin-left:-30px', kills: ['overlap', 'escape', 'spill'] },
  { kind: 'missing-font', css: "font-family:'NoSuchFamily9' !important", kills: ['font'] },
];

export interface MutationResult {
  kind: MutantKind;
  cell: string;
  /** The injected defect really is one by direct measurement (independent of the detector). */
  effective: boolean;
  killed: boolean;
  by: Invariant[];
  target: string;
}

/** Page side. Mutates one element of one cell and says whether the defect is real by direct measurement. */
export function mutateCell(arg: { kind: MutantKind; css: string; cell: string }): { target: string; effective: boolean } | null {
  const cell = [...document.querySelectorAll<HTMLElement>('[data-component][data-state][data-rung]')].find((c) => `${c.dataset.component}/${c.dataset.state}/${c.dataset.rung}` === arg.cell);
  if (!cell) return null;
  const body = (cell.lastElementChild as HTMLElement | null) ?? cell;
  const visible = (e: HTMLElement) => {
    const r = e.getBoundingClientRect();
    for (let a: HTMLElement | null = e; a && a !== body.parentElement; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.display === 'none' || s.visibility === 'hidden' || /absolute|fixed|sticky/.test(s.position)) return false;
    }
    return r.width > 4 && r.height > 4;
  };
  const els = [body, ...body.querySelectorAll<HTMLElement>('*')].filter((e) => !(e instanceof SVGElement) && !e.closest('svg') && visible(e));
  const ownText = (e: HTMLElement) => [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => (n.nodeValue ?? '').trim()).join(' ');
  const apply = (el: HTMLElement) => {
    const w = window as unknown as { __mut?: { el: HTMLElement; style: string | null } };
    w.__mut = { el, style: el.getAttribute('style') };
    el.setAttribute('style', `${el.getAttribute('style') ?? ''};${arg.css}`);
  };
  const name = (el: HTMLElement) => el.getAttribute('data-slot') ?? el.tagName.toLowerCase();
  const textBox = (e: HTMLElement) => {
    const rg = document.createRange();
    rg.selectNodeContents(e);
    return rg.getBoundingClientRect();
  };

  if (arg.kind === 'missing-font') {
    const s = document.createElement('style');
    s.id = '__mut_style';
    s.textContent = `[data-component="${cell.dataset.component}"][data-state="${cell.dataset.state}"][data-rung="${cell.dataset.rung}"] * { ${arg.css} }`;
    document.head.append(s);
    return { target: 'all text', effective: true };
  }
  if (arg.kind === 'fixed-width' || arg.kind === 'nowrap-hidden') {
    const t = els.filter((e) => !/^(inline|contents)$/.test(getComputedStyle(e).display)).sort((a, b) => ownText(b).length - ownText(a).length)[0];
    if (!t || ownText(t).length < 12) return null;
    apply(t);
    // Real defect by direct measurement: the text's own rect pokes out of the box that holds it.
    const tb = textBox(t);
    const tr = t.getBoundingClientRect();
    const eff = tb.right > tr.right + 1 || tb.bottom > tr.bottom + 1;
    return { target: name(t), effective: eff };
  }
  if (arg.kind === 'flex-min-width') {
    const t = els.find((e) => e.parentElement && e !== body && /flex/.test(getComputedStyle(e.parentElement).display) && !/column/.test(getComputedStyle(e.parentElement).flexDirection) && ownText(e).length + (e.textContent ?? '').length > 3);
    if (!t) return null;
    apply(t);
    const r = t.getBoundingClientRect();
    return { target: name(t), effective: r.right > body.getBoundingClientRect().right + 2 || (t.parentElement!.scrollWidth > t.parentElement!.clientWidth + 2) };
  }
  // negative-margin: pull an in-flow element over its previous sibling.
  const t = els.find((e) => {
    const p = e.previousElementSibling as HTMLElement | null;
    return !!p && e !== body && visible(p) && !/inline$/.test(getComputedStyle(e).display) && !!(e.textContent ?? '').trim() && !!(p.textContent ?? '').trim();
  });
  if (!t) return null;
  const prev = t.previousElementSibling as HTMLElement;
  apply(t);
  const a = t.getBoundingClientRect();
  const b = prev.getBoundingClientRect();
  const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return { target: name(t), effective: ox > 3 && oy > 3 };
}

export function restoreMutant(): void {
  const w = window as unknown as { __mut?: { el: HTMLElement; style: string | null } };
  if (w.__mut) {
    if (w.__mut.style === null) w.__mut.el.removeAttribute('style');
    else w.__mut.el.setAttribute('style', w.__mut.style);
    w.__mut = undefined;
  }
  document.getElementById('__mut_style')?.remove();
}

export interface RunMutationOptions {
  /** Cells to try per mutant, at most (one per component, first rung). */
  perMutant?: number;
  /** Cell geometry for the font mutant (collectGeometry from compendium.pdfcheck). */
  geometry?: readonly { key: string; page: number; body: { x: number; y: number; w: number; h: number } }[];
  /** Cells whose baseline already has findings of any kind; mutants are not planted there. */
  dirtyCells?: ReadonlySet<string>;
  tmpDir: string;
}

const kindsKey = (v: { inv: string; where: string }) => `${v.inv}|${v.where}`;

export async function runMutations(page: Page, o: RunMutationOptions): Promise<MutationResult[]> {
  const perMutant = o.perMutant ?? 10;
  const all = await page.evaluate<string[]>(() => {
    const seen = new Set<string>();
    const keys: string[] = [];
    for (const c of document.querySelectorAll<HTMLElement>('[data-component][data-state][data-rung]')) {
      if (seen.has(c.dataset.component!)) continue;
      seen.add(c.dataset.component!);
      keys.push(`${c.dataset.component}/${c.dataset.state}/${c.dataset.rung}`);
    }
    return keys;
  });
  const clean = all.filter((k) => !o.dirtyCells?.has(k));
  const results: MutationResult[] = [];
  const mutate = (arg: object) => page.evaluate<{ target: string; effective: boolean } | null>(`(${mutateCell.toString()})(${JSON.stringify(arg)})`);
  const restore = () => page.evaluate(`(${restoreMutant.toString()})()`);
  for (const m of MUTANTS) {
    let done = 0;
    for (const cell of clean) {
      if (done >= perMutant) break;
      if (m.kind === 'missing-font' && !o.geometry?.some((g) => g.key === cell)) continue;
      const before = new Set((await runLayout(page, { only: cell })).map(kindsKey));
      const hit = await mutate({ kind: m.kind, css: m.css, cell });
      if (!hit) continue;
      done++;
      let by: Invariant[] = [];
      if (m.kind === 'missing-font') {
        const pageNo = o.geometry!.find((g) => g.key === cell)!.page;
        const pdfPath = `${o.tmpDir}/mut-font.pdf`;
        const bytes = await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, preferCSSPageSize: true, pageRanges: String(pageNo) });
        void bytes;
        const found = await inspectFonts(pdfPath, o.geometry, undefined, pageNo - 1);
        if (found.some((f) => f.cell === cell)) by = ['font'];
      } else {
        const after = await runLayout(page, { only: cell });
        by = [...new Set(after.filter((v) => !before.has(kindsKey(v))).map((v) => v.inv))];
      }
      await restore();
      results.push({ kind: m.kind, cell, effective: hit.effective, killed: by.some((i) => m.kills.includes(i)), by, target: hit.target });
    }
  }
  return results;
}

/** Control: a harmless style on the same targets must add no violations (false-positive rate of the harness itself). */
export async function runControls(page: Page, dirtyCells: ReadonlySet<string>, n = 10): Promise<{ cell: string; added: string[] }[]> {
  const all = await page.evaluate<string[]>(() => {
    const seen = new Set<string>();
    const keys: string[] = [];
    for (const c of document.querySelectorAll<HTMLElement>('[data-component][data-state][data-rung]')) {
      if (seen.has(c.dataset.component!)) continue;
      seen.add(c.dataset.component!);
      keys.push(`${c.dataset.component}/${c.dataset.state}/${c.dataset.rung}`);
    }
    return keys;
  });
  const out: { cell: string; added: string[] }[] = [];
  for (const cell of all.filter((k) => !dirtyCells.has(k))) {
    if (out.length >= n) break;
    const before = new Set((await runLayout(page, { only: cell })).map(kindsKey));
    const hit = await page.evaluate<unknown>(`(${mutateCell.toString()})(${JSON.stringify({ kind: 'fixed-width', css: 'outline:1px solid red;color:inherit', cell })})`);
    if (!hit) continue;
    const after = await runLayout(page, { only: cell });
    await page.evaluate(`(${restoreMutant.toString()})()`);
    out.push({ cell, added: after.map(kindsKey).filter((k) => !before.has(k)) });
  }
  return out;
}
