#!/usr/bin/env node
/**
 * The edge census, run over other design systems — the calibration behind `tests/edges.spec.ts`.
 *
 * Three shipped systems, each rendered from its own published package so the markup and the
 * stylesheet are the system's, not a re-drawing of it:
 *
 *   - **GOV.UK Frontend** through its own Nunjucks macros, the way a service renders it;
 *   - **Carbon** through `@carbon/react` server rendering and `@carbon/styles`' compiled CSS;
 *   - **Primer CSS** with `@primer/primitives`' light theme. Primer has no template layer of its
 *     own, so its pages are written from the documented class patterns (`Box`, `Box-row`,
 *     `TimelineItem`, `State`, `Label`, `branch-name`) — the one benchmark here whose markup is
 *     ours, which `docs/edge-hierarchy.md` says.
 *
 * Each system gets two pages shaped like the pages this package ships: a review or "check your
 * answers" page, and an operations page with a table, tags and notices. Every page is measured
 * with the same `measureEdges` the gate uses, at the gate's viewport.
 *
 * Not a gate and not run in CI: it installs packages, which no CI job should do, into the
 * gitignored `temp/edge-benchmark/` (rule 11) and adds nothing to this package's dependencies.
 *
 *   node scripts/benchmark-edges.mjs            print the table
 *   node scripts/benchmark-edges.mjs --json     and write temp/edge-benchmark/results.json
 */
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import { measureEdges } from '../tests/edges.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORK = path.join(ROOT, '..', '..', 'temp', 'edge-benchmark');
const PAGES = path.join(WORK, 'pages');

/** Pinned, so a re-run measures the same thing. Bump deliberately and re-record the doc. */
const PACKAGES = {
  'govuk-frontend': '6.6.0',
  nunjucks: '3.2.4',
  '@primer/css': '21.5.1', // the last release that ships Box, Box-row and TimelineItem as CSS
  '@primer/primitives': '10.7.0',
  '@carbon/react': '1.119.0',
  '@carbon/styles': '1.118.0',
  react: '18.3.1',
  'react-dom': '18.3.1',
};

function install() {
  mkdirSync(PAGES, { recursive: true });
  const manifest = path.join(WORK, 'package.json');
  const wanted = JSON.stringify({ name: 'edge-benchmark', private: true, dependencies: PACKAGES }, null, 2);
  if (existsSync(manifest) && readFileSync(manifest, 'utf8') === wanted && existsSync(path.join(WORK, 'node_modules'))) return;
  writeFileSync(manifest, wanted);
  execFileSync('npm', ['install', '--no-audit', '--no-fund', '--silent', '--no-package-lock'], { cwd: WORK, stdio: 'inherit' });
}

const page = (title, css, body, htmlAttributes = '') =>
  `<!doctype html><html lang="en" ${htmlAttributes}><head><meta charset="utf-8"><title>${title}</title>${css
    .map((href) => `<link rel="stylesheet" href="${pathToFileURL(href)}">`)
    .join('')}</head><body>${body}</body></html>`;

/* ---------------------------------------------------------------- GOV.UK */

function govuk(req) {
  const nunjucks = req('nunjucks');
  const dist = path.join(WORK, 'node_modules/govuk-frontend/dist');
  const env = nunjucks.configure([dist], { autoescape: true });
  const css = [path.join(dist, 'govuk/govuk-frontend.min.css')];
  const call = (macro, params) =>
    env.renderString(`{% from "govuk/components/${macro}/macro.njk" import ${camel(macro)} %}{{ ${camel(macro)}(params) }}`, { params });
  const row = (key, value) => ({ key: { text: key }, value: { text: value }, actions: { items: [{ href: '#', text: 'Change', visuallyHiddenText: key }] } });
  const shell = (inner) =>
    `<div class="govuk-template__body govuk-frontend-supported">${call('header', {})}<div class="govuk-width-container"><main class="govuk-main-wrapper" id="main-content">${inner}</main></div>${call('footer', {})}</div>`;

  const review = shell(`
    <h1 class="govuk-heading-l">Check your answers before submitting</h1>
    ${call('summary-list', { card: { title: { text: 'Change request' } }, rows: [row('Repository', 'Parquet.SourceGenerator'), row('Base', 'main'), row('Head', 'feat/field-id'), row('Baseline', '216f6fc')] })}
    ${call('summary-list', { card: { title: { text: 'Measurements' } }, rows: [row('Complexity', '1,328 to 1,346'), row('Duplicated tokens', '8,418 to 8,398'), row('Call-graph edges', '529 to 530')] })}
    ${call('inset-text', { text: 'No policy was applied, so this comparison has no verdict.' })}
    ${call('details', { summaryText: 'What the call-graph coverage means', text: 'Only 16% of call sites resolve in the main generator.' })}
    ${call('button', { text: 'Accept and send' })}`);

  const tag = (text, colour) => call('tag', { text, classes: colour ? `govuk-tag--${colour}` : '' });
  const ops = shell(`
    ${call('notification-banner', { text: 'Two checks need review before this can merge.' })}
    <h1 class="govuk-heading-l">Checks</h1>
    ${call('table', { caption: 'Checks on pull request 412', captionClasses: 'govuk-table__caption--m', head: [{ text: 'Check' }, { text: 'Status' }, { text: 'Duration' }], rows: [
      [{ text: 'ci / build-and-test' }, { html: tag('Passed', 'green') }, { text: '6m 12s' }],
      [{ text: 'api / shipped-surface' }, { html: tag('Needs review', 'blue') }, { text: '34s' }],
      [{ text: 'coverage / patch' }, { html: tag('Warning', 'yellow') }, { text: '58s' }],
      [{ text: 'docs / link-check' }, { html: tag('Pending', 'grey') }, { text: '-' }],
    ] })}
    ${call('task-list', { items: [
      { title: { text: 'Review parser change' }, href: '#', status: { tag: { text: 'In progress', classes: 'govuk-tag--light-blue' } } },
      { title: { text: 'Answer the API question' }, href: '#', status: { tag: { text: 'Not started', classes: 'govuk-tag--blue' } } },
      { title: { text: 'Re-run coverage' }, href: '#', status: { text: 'Completed' } },
    ] })}
    ${call('warning-text', { text: 'The baseline is a CI artifact with no promotion record.' })}`);

  return [
    ['GOV.UK Frontend', 'check answers', page('GOV.UK review', css, review, 'class="govuk-template"')],
    ['GOV.UK Frontend', 'checks and tasks', page('GOV.UK ops', css, ops, 'class="govuk-template"')],
  ];
}

function camel(name) {
  return `govuk${name.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('')}`;
}

/* ---------------------------------------------------------------- Primer */

/** Primer's colour tokens apply only under these; without them every border falls back to black. */
const PRIMER_THEME = 'data-color-mode="light" data-light-theme="light"';

function primer() {
  const nm = path.join(WORK, 'node_modules/@primer');
  const css = [
    path.join(nm, 'primitives/dist/css/base/size/size.css'),
    path.join(nm, 'primitives/dist/css/functional/size/border.css'),
    path.join(nm, 'primitives/dist/css/functional/size/size-fine.css'),
    path.join(nm, 'primitives/dist/css/functional/themes/light.css'),
    path.join(nm, 'css/dist/primer.css'),
  ];
  const comment = (who, body) => `
    <div class="TimelineItem"><div class="TimelineItem-avatar"></div><div class="TimelineItem-body">
      <div class="Box"><div class="Box-header"><strong>${who}</strong> commented</div><div class="Box-body">${body}</div></div>
    </div></div>`;
  const review = `
    <div class="container-lg p-4">
      <div class="Subhead"><h1 class="Subhead-heading">feat(schema): FieldId and AdjustedToUtc <span class="color-fg-muted">#412</span></h1></div>
      <p><span class="State State--open">Open</span> rtkelly13 wants to merge <span class="branch-name">feat/field-id</span> into <span class="branch-name">main</span></p>
      <div class="flash mb-3">Diffra compared 7 derived files with the merge base. No policy was applied.</div>
      <div class="d-flex gutter">
        <div class="col-9">
          ${comment('rtkelly13', 'Adds FieldId and AdjustedToUtc to the column attributes.')}
          ${comment('diffra', 'Derived outputs changed: +77 -50 across 7 files.')}
          ${comment('kestrel', 'The FieldId sentinel needs another look.')}
        </div>
        <div class="col-3">
          <div class="discussion-sidebar-item"><h3 class="discussion-sidebar-heading">Reviewers</h3><p>kestrel · marlow</p></div>
          <div class="discussion-sidebar-item"><h3 class="discussion-sidebar-heading">Labels</h3><span class="Label">schema</span> <span class="Label">public-api</span></div>
        </div>
      </div>
      <div class="Box mt-4">
        <div class="Box-header"><h2 class="Box-title">Files changed</h2></div>
        <div class="Box-row d-flex"><span class="flex-auto">src/Parser/TargetParser.cs</span><span class="color-fg-success">+3</span> <span class="color-fg-danger">-1</span></div>
        <div class="Box-row d-flex"><span class="flex-auto">src/Attributes/ParquetColumnAttribute.cs</span><span class="color-fg-success">+9</span></div>
        <div class="Box-row d-flex"><span class="flex-auto">metrics/Parquet.SourceGenerator.metrics.txt</span><span class="color-fg-success">+6</span> <span class="color-fg-danger">-4</span></div>
      </div>
    </div>`;
  const check = (state, name, note) =>
    `<div class="Box-row d-flex flex-items-center"><span class="Label Label--${state} mr-3">${state}</span><span class="flex-auto">${name}</span><span class="color-fg-muted">${note}</span></div>`;
  const ops = `
    <div class="container-lg p-4">
      <div class="Subhead"><h1 class="Subhead-heading">Checks</h1></div>
      <div class="flash flash-warn mb-3">Two checks need review before this can merge.</div>
      <div class="Box">
        <div class="Box-header"><h2 class="Box-title">6 checks</h2></div>
        ${check('success', 'ci / build-and-test', '6m 12s')}${check('success', 'ci / golden-files', '1m 48s')}${check('accent', 'api / shipped-surface', '34s')}
        ${check('attention', 'coverage / patch', '58s')}${check('secondary', 'docs / link-check', 'queued')}
      </div>
      <div class="Box mt-4"><div class="Box-header"><h2 class="Box-title">Deployments</h2></div>
        <div class="Box-row">preview · ready</div><div class="Box-row">production · waiting</div>
      </div>
    </div>`;
  return [
    ['Primer CSS', 'pull request', page('Primer review', css, review, PRIMER_THEME)],
    ['Primer CSS', 'checks', page('Primer ops', css, ops, PRIMER_THEME)],
  ];
}

/* ---------------------------------------------------------------- Carbon */

function carbon(req) {
  const React = req('react');
  const { renderToStaticMarkup } = req('react-dom/server');
  const c = req('@carbon/react');
  const h = React.createElement;
  const css = [path.join(WORK, 'node_modules/@carbon/styles/css/styles.css')];
  const table = (rows) =>
    h(c.Table, { size: 'lg' },
      h(c.TableHead, null, h(c.TableRow, null, ['Check', 'Status', 'Duration'].map((k) => h(c.TableHeader, { key: k }, k)))),
      h(c.TableBody, null, rows.map(([name, status, type, time]) => h(c.TableRow, { key: name }, h(c.TableCell, null, name), h(c.TableCell, null, h(c.Tag, { type }, status)), h(c.TableCell, null, time)))));
  const review = h('div', { className: 'cds--content', style: { padding: '2rem' } },
    h('h1', { className: 'cds--type-productive-heading-05' }, 'feat(schema): FieldId and AdjustedToUtc'),
    h(c.InlineNotification, { kind: 'info', title: 'No verdict', subtitle: 'Delta only. No policy was applied.', hideCloseButton: true, lowContrast: true }),
    h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', margin: '1rem 0' } },
      ['Derived files 7', 'Source files 10', 'Members added 30', 'Test methods +4'].map((t) => h(c.Tile, { key: t }, t))),
    h(c.StructuredListWrapper, null,
      h(c.StructuredListHead, null, h(c.StructuredListRow, { head: true }, ['Measure', 'Before', 'After'].map((k) => h(c.StructuredListCell, { head: true, key: k }, k)))),
      h(c.StructuredListBody, null, [['Complexity', '1,328', '1,346'], ['Duplicated tokens', '8,418', '8,398'], ['Call-graph edges', '529', '530']].map((r) => h(c.StructuredListRow, { key: r[0] }, r.map((v, i) => h(c.StructuredListCell, { key: i }, v)))))),
    h(c.Accordion, null, ['metrics/duplication.txt', 'metrics/Parquet.SourceGenerator.metrics.txt', 'callgraph/Parquet.SourceGenerator.callgraph.txt'].map((f) => h(c.AccordionItem, { title: f, key: f }, 'diff'))));
  const ops = h('div', { className: 'cds--content', style: { padding: '2rem' } },
    h(c.InlineNotification, { kind: 'warning', title: 'Two checks need review', subtitle: 'before this can merge', hideCloseButton: true }),
    h('h1', { className: 'cds--type-productive-heading-05' }, 'Checks'),
    table([['ci / build-and-test', 'Passed', 'green', '6m 12s'], ['api / shipped-surface', 'Review', 'blue', '34s'], ['coverage / patch', 'Warning', 'warm-gray', '58s'], ['docs / link-check', 'Pending', 'gray', '-']]),
    h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' } },
      ['Preview ready', 'Production waiting', 'Rollback none'].map((t) => h(c.Tile, { key: t }, t))));
  return [
    ['Carbon', 'review', page('Carbon review', css, renderToStaticMarkup(review))],
    ['Carbon', 'checks', page('Carbon ops', css, renderToStaticMarkup(ops))],
  ];
}

/* ---------------------------------------------------------------- run */

install();
const req = createRequire(path.join(WORK, 'package.json'));
const pages = [...govuk(req), ...primer(), ...carbon(req)];
const browser = await chromium.launch();
const results = [];
for (const [system, name, html] of pages) {
  const file = path.join(PAGES, `${system}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.html');
  writeFileSync(file, html);
  const tab = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await tab.goto(pathToFileURL(file).href);
  await tab.evaluate(() => document.fonts.ready);
  results.push({ system, page: name, ...(await tab.evaluate(measureEdges, 'body')) });
  await tab.close();
}
await browser.close();

const cols = ['heavyPanels', 'maxDepth', 'framesPerScreen', 'heavyPanelsPerScreen', 'heavyEdgeShare', 'inkPermille'];
console.log(`| System | Page | ${cols.join(' | ')} |\n|---|---|${cols.map(() => '---:').join('|')}|`);
for (const r of results) console.log(`| ${r.system} | ${r.page} | ${cols.map((k) => r[k]).join(' | ')} |`);
if (process.argv.includes('--json')) writeFileSync(path.join(WORK, 'results.json'), `${JSON.stringify(results, null, 2)}\n`);
