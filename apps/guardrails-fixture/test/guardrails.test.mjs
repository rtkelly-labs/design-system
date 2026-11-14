/**
 * test/guardrails.test.mjs
 *
 * Verifies that the guardrail mechanisms and checks propagate properly
 * and reliably detect agent errors while permitting valid escape hatches.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixtureDir = path.resolve(__dirname, '..');
const repoRoot = path.resolve(fixtureDir, '../..');
const checkScript = path.resolve(repoRoot, 'scripts/check-design-system-guardrails.mjs');

let passedTests = 0;
let totalTests = 0;

function runAudit(target = fixtureDir) {
  try {
    const stdout = execSync(`node "${checkScript}" --target "${target}" --json`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return JSON.parse(stdout);
  } catch (err) {
    if (err.stdout) {
      try {
        return JSON.parse(err.stdout);
      } catch {
        // Fall through
      }
    }
    throw err;
  }
}

function assert(condition, description) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${description}`);
  } else {
    console.error(`  ✗ ${description}`);
    throw new Error(`Test assertion failed: ${description}`);
  }
}

console.log('='.repeat(70));
console.log('  RUNNING DESIGN SYSTEM GUARDRAILS TEST SUITE');
console.log('='.repeat(70));

// Test 1: Compliant Baseline
console.log('\n[Scenario 1] Compliant Test Application Baseline');
{
  const result = runAudit(fixtureDir);
  assert(result.passed === true, 'Baseline app passes all guardrail checks');
  assert(result.violations.length === 0, 'Zero violations in compliant app');
  assert(result.checks.packageScope.status === 'PASS', 'Package scope is valid (@rtkelly-labs/design-system)');
  assert(result.checks.filesystemLsLint.status === 'PASS', '.ls-lint.yml enforces .css: exists:0');
  assert(result.checks.cssConfinement.status === 'PASS', 'Stylesheets confined to entrypoints or escape hatches');
  assert(result.checks.codeGuardrails.status === 'PASS', 'Zero negative guardrail violations');
}

// Test 2: Rogue CSS Injection Catch
console.log('\n[Scenario 2] Catch Rogue Ad-Hoc CSS File Injection');
{
  const rogueCssPath = path.join(fixtureDir, 'src/components/ButtonOverride.css');
  fs.mkdirSync(path.dirname(rogueCssPath), { recursive: true });
  fs.writeFileSync(rogueCssPath, '.btn { border-radius: 8px; background: red; }');

  try {
    const result = runAudit(fixtureDir);
    assert(result.passed === false, 'Audit correctly fails on rogue .css creation');
    const cssViolation = result.violations.find((v) => v.type === 'CSS_CONFINEMENT');
    assert(!!cssViolation, 'CSS_CONFINEMENT violation reported');
    assert(cssViolation.file.includes('ButtonOverride.css'), 'Identifies the offending CSS file');
    assert(cssViolation.message.includes('Ad-hoc CSS file detected'), 'Provides clear agent remediation guidance');
  } finally {
    fs.unlinkSync(rogueCssPath);
  }
}

// Test 3: Banned Border Radius Catch
console.log('\n[Scenario 3] Catch Banned Border Radius (rounded-md)');
{
  const testFile = path.join(fixtureDir, 'src/TempCard.tsx');
  fs.writeFileSync(
    testFile,
    `import React from 'react';\nexport const TempCard = () => <div className="p-4 rounded-md bg-surface-raised">Card</div>;\n`
  );

  try {
    const result = runAudit(fixtureDir);
    assert(result.passed === false, 'Audit correctly fails when rounded-* is used');
    const roundedViolation = result.violations.find((v) => v.type === 'ROUNDED-CORNERS');
    assert(!!roundedViolation, 'ROUNDED-CORNERS violation reported');
    assert(roundedViolation.matchedText === 'rounded-md', 'Matches the exact offending class');
    assert(roundedViolation.message.includes('Zero border-radius'), 'Guidance explains brutalist zero-radius rule');
  } finally {
    fs.unlinkSync(testFile);
  }
}

// Test 4: Banned Raw Palette Color Catch
console.log('\n[Scenario 4] Catch Banned Raw Palette Colors (bg-blue-500)');
{
  const testFile = path.join(fixtureDir, 'src/TempColor.tsx');
  fs.writeFileSync(
    testFile,
    `import React from 'react';\nexport const TempColor = () => <div className="bg-blue-500 text-white">Alert</div>;\n`
  );

  try {
    const result = runAudit(fixtureDir);
    assert(result.passed === false, 'Audit correctly fails on raw Tailwind palette color');
    const colorViolation = result.violations.find((v) => v.type === 'RAW-PALETTE-COLORS');
    assert(!!colorViolation, 'RAW-PALETTE-COLORS violation reported');
    assert(colorViolation.matchedText === 'bg-blue-500', 'Matches bg-blue-500');
    assert(colorViolation.message.includes('semantic tokens'), 'Guidance instructs to use semantic tokens');
  } finally {
    fs.unlinkSync(testFile);
  }
}

// Test 5: Unannotated Linter Disable Catch
console.log('\n[Scenario 5] Catch Unannotated Linter Disable (Missing ESCAPE_HATCH explanation)');
{
  const testFile = path.join(fixtureDir, 'src/TempDisable.tsx');
  fs.writeFileSync(
    testFile,
    `import React from 'react';\n/* eslint-disable shadcn/no-arbitrary-values */\nexport const TempDisable = () => <div className="h-[200px]">Test</div>;\n`
  );

  try {
    const result = runAudit(fixtureDir);
    assert(result.passed === false, 'Audit correctly fails on unannotated eslint-disable');
    const disableViolation = result.violations.find((v) => v.type === 'UNANNOTATED_DISABLE');
    assert(!!disableViolation, 'UNANNOTATED_DISABLE violation reported');
    assert(disableViolation.message.includes('-- ESCAPE_HATCH'), 'Guidance demands ESCAPE_HATCH annotation');
  } finally {
    fs.unlinkSync(testFile);
  }
}

// Test 6: Valid Escape Hatch with Annotation Passes
console.log('\n[Scenario 6] Valid Escape Hatch with Structured Annotation is Permitted');
{
  const testFile = path.join(fixtureDir, 'src/TempValidHatch.tsx');
  fs.writeFileSync(
    testFile,
    `import React from 'react';\n// eslint-disable-next-line shadcn/no-arbitrary-values -- ESCAPE_HATCH(webgl): Fixed pixel dimension required\nexport const TempValidHatch = () => <div className="h-[200px]">Test</div>;\n`
  );

  try {
    const result = runAudit(fixtureDir);
    assert(result.passed === true, 'Audit passes when ESCAPE_HATCH explanation is provided');
    assert(result.violations.length === 0, 'Zero violations for annotated escape hatch');
  } finally {
    fs.unlinkSync(testFile);
  }
}

// Test 7: Catch Banned dlx in scripts
console.log('\n[Scenario 7] Catch Banned dlx Usage in package.json');
{
  const pkgPath = path.join(fixtureDir, 'package.json');
  const originalPkg = fs.readFileSync(pkgPath, 'utf8');
  const parsed = JSON.parse(originalPkg);
  parsed.scripts['lint:bad'] = 'pnpm dlx @ls-lint/ls-lint';
  fs.writeFileSync(pkgPath, JSON.stringify(parsed, null, 2));

  try {
    const result = runAudit(fixtureDir);
    assert(result.passed === false, 'Audit correctly fails on banned dlx usage');
    const dlxViolation = result.violations.find((v) => v.type === 'BANNED_DLX_USAGE');
    assert(!!dlxViolation, 'BANNED_DLX_USAGE violation reported');
    assert(dlxViolation.message.includes('pnpm dlx is banned'), 'Guidance instructs to use local script instead of dlx');
  } finally {
    fs.writeFileSync(pkgPath, originalPkg);
  }
}

console.log('\n' + '='.repeat(70));
console.log(`  ALL ${passedTests}/${totalTests} GUARDRAIL PROPAGATION TESTS PASSED CLEANLY!`);
console.log('='.repeat(70));
