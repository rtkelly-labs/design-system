#!/usr/bin/env node
/**
 * Prove the *published* report generator works, from a consumer's position.
 *
 * Everything else that tests the generator runs from `src/` inside this repo,
 * where every dependency is already installed and every path resolves. None of
 * that exercises what a consumer actually gets: a tarball, an `exports` map, a
 * `bin`, and two peer dependencies they have to install themselves.
 *
 * So this packs **both** packages, installs them into a throwaway project
 * alongside the peers, and drives `ds-report` the way an agent would. It is the
 * only check that would catch a broken `bin` path, a missing file in `files`, an
 * entry absent from `exports`, or a peer that is documented as optional but is
 * not — and, since the split, the only one that exercises the generator
 * resolving the design system from a real install rather than a workspace link.
 *
 *   node scripts/verify-report-cli.mjs
 *   node scripts/verify-report-cli.mjs --keep    leave the temp project behind
 */

import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/** The design system is a peer, so a consumer installs both. Both get packed. */
const DESIGN_SYSTEM = path.resolve(ROOT, '../design-system');
const KEEP = process.argv.includes('--keep');

const failures = [];
const check = (label, condition, detail = '') => {
  const ok = Boolean(condition);
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${label}${detail && !ok ? `\n          ${detail}` : ''}`);
  if (!ok) failures.push(label);
};

/**
 * `out` merges stdout and stderr on purpose. The CLI writes its result to stdout
 * and its warnings and notes to stderr, and an earlier version of this harness
 * captured only the former — so a check for a note that the CLI *was* emitting
 * failed, and the harness looked like the code was broken.
 */
function run(command, args, cwd, allowFailure = false) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  const out = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  if (result.status !== 0 && !allowFailure) {
    throw new Error(`${command} ${args.join(' ')} exited ${result.status}\n${out}`);
  }
  return { ok: result.status === 0, out };
}

const REPORT = `import { Card, ReportDocument, ReportSection, StatCard } from '@rtkelly13/design-system';

export default function Report() {
  return (
    <ReportDocument title="Consumer" meta={[{ label: 'Source', value: 'tarball' }]}>
      <ReportSection title="Summary">
        <StatCard title="Packages" value={1} accent="success" />
        <Card><p className="text-content-secondary">Rendered from an install.</p></Card>
      </ReportSection>
    </ReportDocument>
  );
}
`;

/** A report the lint must refuse, to prove the rules ship and run. */
const BAD_REPORT = `import { Card, ReportDocument } from '@rtkelly13/design-system';

export default function Report() {
  return (
    <ReportDocument title="Bad">
      <Card className="bg-zinc-900" />
    </ReportDocument>
  );
}
`;

const pack = (dir) => {
  const lines = run('pnpm', ['pack', '--pack-destination', tmpdir()], dir).out.trim().split('\n');
  return lines[lines.length - 1];
};

// The peer range is a plain semver string rather than `workspace:^`, so nothing
// rewrites it at publish time and nothing notices when the design system's
// version moves past it. A consumer would find out by installing two packages
// that cannot satisfy each other, which is the worst place to find out.
{
  const declared = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
    .peerDependencies['@rtkelly13/design-system'];
  const actual = JSON.parse(readFileSync(path.join(DESIGN_SYSTEM, 'package.json'), 'utf8')).version;
  const [major, minor] = actual.split('.');
  // Pre-1.0, `^0.3.0` admits 0.3.x only, so the guard is major *and* minor.
  const satisfied = declared.startsWith('^') && declared.slice(1).startsWith(`${major}.${minor}.`);
  check(
    `peer range ${declared} still admits the design system's ${actual}`,
    satisfied,
    'Bump the @rtkelly13/design-system range in packages/design-system-report/package.json.',
  );
}

console.log('Packing both packages…');
const tarball = pack(ROOT);
const designSystemTarball = pack(DESIGN_SYSTEM);

const project = mkdtempSync(path.join(tmpdir(), 'ds-consumer-'));
console.log(`Consumer project: ${project}\n`);

try {
  writeFileSync(
    path.join(project, 'package.json'),
    JSON.stringify({ name: 'consumer', private: true, version: '1.0.0' }, null, 2),
  );
  writeFileSync(path.join(project, 'report.tsx'), REPORT);
  writeFileSync(path.join(project, 'bad.tsx'), BAD_REPORT);

  // Exactly what the README tells a consumer to install, and nothing else. If
  // the generator needs something not on this list, that is the bug — and it was
  // once: the typography plugin is declared optional, but the report compiles
  // `styles.css`, which imports `prose.css`, which loads it. Installing only the
  // documented set is what surfaced that.
  //
  // Both tarballs, because the design system is a peer of this package now: the
  // report is rendered against the copy the consumer installed, not one bundled
  // with the tool. That resolution is the thing the split is for, so it is worth
  // testing from a real install rather than a workspace link.
  console.log('Installing both tarballs and the documented peers…');
  run(
    'pnpm',
    [
      'add',
      tarball,
      designSystemTarball,
      'react',
      'react-dom',
      'esbuild',
      'tailwindcss',
      'typescript',
      '@types/react',
    ],
    project,
  );

  const cli = ['--yes', 'ds-report'];
  console.log('\nDriving ds-report:');

  const first = run('npx', [...cli, 'report.tsx', '--theme', 'midnight,sketch', '--strict'], project);
  check('renders both rungs from one invocation', first.ok);

  const sketch = path.join(project, 'report.sketch.html');
  const midnight = path.join(project, 'report.midnight.html');
  const sketchHtml = readFileSync(sketch, 'utf8');
  check('writes one file per rung', sketchHtml.length > 0 && readFileSync(midnight, 'utf8').length > 0);
  check('declares the rung on the root element', sketchHtml.includes('data-theme="sketch"'));
  check('emits no script tag', !/<script\b/.test(sketchHtml));
  check('emits no external stylesheet', !/<link\b/.test(sketchHtml));
  check('inlines the utilities the report uses', sketchHtml.includes('.bg-surface-base'));
  check('renders the components, not a stub', sketchHtml.includes('Rendered from an install.'));

  run('npx', [...cli, 'report.tsx', '--theme', 'sketch', '-o', 'again.html'], project);
  check(
    'renders the same bytes twice',
    readFileSync(path.join(project, 'again.html'), 'utf8') === sketchHtml,
  );

  // A consumer resolves this package to `dist/index.d.ts`, which `skipLibCheck`
  // skips — so the check should cost about a second here even though extending
  // this repo's own tsconfig (whose `paths` point at source) costs four.
  const started = Date.now();
  const typed = run('npx', [...cli, 'report.tsx', '-o', 'typed.html'], project, true);
  const elapsed = Date.now() - started;
  check(`typechecks a consumer report in reasonable time (${elapsed}ms)`, typed.ok && elapsed < 8000, typed.out.slice(0, 300));

  writeFileSync(
    path.join(project, 'wrong-types.tsx'),
    BAD_REPORT.replace('className="bg-zinc-900"', 'title={{ not: "a string" }}'),
  );
  const wrong = run('npx', [...cli, 'wrong-types.tsx'], project, true);
  check(
    'rejects a report that does not typecheck',
    !wrong.ok && /error TS/.test(wrong.out),
    wrong.out.slice(0, 300),
  );

  const bad = run('npx', [...cli, 'bad.tsx'], project, true);
  check('lint rules ship and block', !bad.ok && /bg-zinc-900/.test(bad.out), bad.out.slice(0, 300));

  // The typography plugin is optional and absent here. That must degrade the
  // prose layer with a note, not crash the render.
  check(
    'renders without the optional typography plugin',
    /@tailwindcss\/typography is not installed/.test(first.out),
    first.out.slice(0, 300),
  );

  console.log('\nAdding the typography plugin, to check the note goes away:');
  run('pnpm', ['add', '@tailwindcss/typography'], project);
  const withProse = run('npx', [...cli, 'report.tsx', '-o', 'prose.html'], project, true);
  check(
    'no note once the plugin is installed',
    withProse.ok && !/typography is not installed/.test(withProse.out),
    withProse.out.slice(0, 300),
  );

  // The optional-peer promise: `esbuild` is documented as one, so its absence
  // has to produce an install instruction rather than a stack trace.
  //
  // This needs its own project. `pnpm remove esbuild` does *not* reproduce the
  // scenario — pnpm's `auto-install-peers` is on by default, so a copy stays
  // resolvable from this package's own directory and the render simply succeeds.
  // An earlier version of this check did exactly that and passed while proving
  // nothing. `auto-install-peers=false` plus never installing it is the real
  // shape of a consumer who skipped an optional peer.
  console.log('\nA second project without the optional peer:');
  const bare = mkdtempSync(path.join(tmpdir(), 'ds-consumer-bare-'));
  try {
    writeFileSync(path.join(bare, '.npmrc'), 'auto-install-peers=false\n');
    writeFileSync(
      path.join(bare, 'package.json'),
      JSON.stringify({ name: 'bare', private: true, version: '1.0.0' }, null, 2),
    );
    writeFileSync(path.join(bare, 'report.tsx'), REPORT);
    run('pnpm', ['add', tarball, designSystemTarball, 'react', 'react-dom', 'tailwindcss'], bare);

    // Prove the premise before trusting the conclusion.
    const resolvable = run(
      'node',
      ['-e', "try{require.resolve('esbuild');console.log('present')}catch{console.log('absent')}"],
      bare,
    );
    check('the peer really is absent in that project', /absent/.test(resolvable.out), resolvable.out);

    const missing = run('npx', [...cli, 'report.tsx'], bare, true);
    check(
      'a missing optional peer explains itself',
      !missing.ok && /optional peer dependency/.test(missing.out) && /pnpm add/.test(missing.out),
      missing.out.slice(0, 400),
    );

    // Same project, now renderable but still without a compiler. `typescript`
    // is optional, so this must render *and* say it was not checked — silence
    // would let a report with a type error through looking like a clean run.
    // This is the negative case for `findChecker`, asserted here rather than in
    // a unit test because only a real install can genuinely lack the package.
    console.log('\nAdding esbuild but no compiler:');
    run('pnpm', ['add', 'esbuild'], bare);
    const unchecked = run('npx', [...cli, 'report.tsx', '-o', 'unchecked.html'], bare, true);
    check(
      'renders without a compiler, and says it was not typechecked',
      unchecked.ok && /not typechecked/.test(unchecked.out),
      unchecked.out.slice(0, 400),
    );
  } finally {
    if (!KEEP) rmSync(bare, { recursive: true, force: true });
  }
} finally {
  if (KEEP) console.log(`\nLeft in place: ${project}`);
  else {
    rmSync(project, { recursive: true, force: true });
    rmSync(tarball, { force: true });
    rmSync(designSystemTarball, { force: true });
  }
}

console.log('');
if (failures.length > 0) {
  console.error(`Published report CLI failed ${failures.length} check(s):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Published report CLI OK — packed, installed, and driven as a consumer.');
}
