#!/usr/bin/env node
/**
 * check-design-system-guardrails.mjs
 *
 * Verifies that a repository or application correctly enforces the estate-wide
 * design system guardrails for @rtkelly-labs/design-system:
 *
 * 1. Package Scope: depends on @rtkelly-labs/design-system (not legacy @rtkelly13/* or brittle file: links).
 * 2. Filesystem Governance: .ls-lint.yml exists and enforces .css: exists:0.
 * 3. CSS Confinement: zero rogue .css files outside approved entrypoints or /escape-hatches/.
 * 4. AST / Code Guardrails: scans TSX/JSX for rounded-*, raw colors, arbitrary values, and unannotated inline styles.
 * 5. Escape Hatch Protocol: validates that any bypasses carry structured '-- ESCAPE_HATCH(domain): explanation' annotations.
 *
 * Usage:
 *   node scripts/check-design-system-guardrails.mjs [--target /path/to/repo] [--json]
 */

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
let targetDir = process.cwd();
let jsonOutput = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--target' && args[i + 1]) {
    targetDir = path.resolve(args[i + 1]);
    i++;
  } else if (args[i] === '--json') {
    jsonOutput = true;
  }
}

const IGNORED_DIRS = new Set([
  '.git',
  '.claude',
  'node_modules',
  'dist',
  'build',
  'temp',
  '.temp',
  '.next',
  '.turbo',
  'storybook-static',
  'playwright-report',
  'test-results',
  'coverage',
  '.venv',
  'vendor',
  '__fixtures__',
  '__mocks__',
]);

const ALLOWED_CSS_BASENAMES = new Set([
  'app.src.css',
  'gallery.src.css',
  'c4.src.css',
  'app.css',
  'gallery.css',
  'c4.css',
  'globals.css',
  'theme.css',
  'styles.css',
  'prose.css',
  'docs.css',
  'tailwind.css',
  'index.css',
  'studio.css',
]);

// Patterns for negative guardrails in TSX / JSX
const BANNED_PATTERNS = [
  {
    id: 'rounded-corners',
    regex: /\brounded-(?:sm|md|lg|xl|2xl|3xl|full)\b/g,
    message: 'Zero border-radius is strictly enforced. Remove rounded-* and use sharp rectangular geometry.',
  },
  {
    id: 'bare-rounded',
    regex: /\brounded\b(?!-none)/g,
    message: 'Zero border-radius is strictly enforced. Remove "rounded" or specify "rounded-none".',
  },
  {
    id: 'raw-palette-colors',
    regex: /\b(?:bg|text|border)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/g,
    message: 'Raw palette colors are banned. Use semantic tokens (e.g. text-accent-primary, bg-surface-raised, border-subtle).',
  },
  {
    id: 'raw-hex-colors',
    regex: /(?<![&\w])#[0-9a-fA-F]{3,8}\b(?![\w-])/g,
    message: 'Raw hex color literals are banned. Use semantic theme variables var(--ds-*) or Tailwind role classes.',
  },
  {
    id: 'arbitrary-bracket-values',
    regex: /(?<![\w-])(?:p|m|px|py|pt|pb|pl|pr|w|h|text|border|top|left|right|bottom)-\[[^\]\s]+\]/g,
    message: 'Arbitrary bracket spacing/sizing is banned. Use tokens on the spacing scale.',
  },
  {
    id: 'inline-styles',
    regex: /style=\{\{[^}]*(?:background|color|border|radius)[^}]*\}\}/g,
    message: 'Inline style attributes with appearance properties are banned. Use Tailwind role classes or component props.',
  },
];

const ESCAPE_HATCH_REGEX = /ESCAPE_HATCH\(([a-zA-Z0-9_-]+)\):\s*(.+)/;

const results = {
  target: targetDir,
  timestamp: new Date().toISOString(),
  passed: true,
  checks: {
    packageScope: { status: 'PENDING', details: [] },
    filesystemLsLint: { status: 'PENDING', details: [] },
    cssConfinement: { status: 'PENDING', details: [] },
    codeGuardrails: { status: 'PENDING', details: [] },
  },
  violations: [],
};

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, callback);
    } else if (entry.isFile()) {
      callback(fullPath);
    }
  }
}

// -------------------------------------------------------------
// Check 1: Package Scope
// -------------------------------------------------------------
function checkPackageScope() {
  const packageJsonFiles = [];
  walkDir(targetDir, (filePath) => {
    if (path.basename(filePath) === 'package.json') {
      packageJsonFiles.push(filePath);
    }
  });

  if (packageJsonFiles.length === 0) {
    results.checks.packageScope = { status: 'SKIPPED', details: ['No package.json found'] };
    return;
  }

  let hasValidDsDep = false;
  for (const pkgFile of packageJsonFiles) {
    try {
      const content = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
      const deps = { ...content.dependencies, ...content.devDependencies, ...content.peerDependencies };
      const rel = path.relative(targetDir, pkgFile);

      if (content.name === '@rtkelly-labs/design-system' || content.name === '@rtkelly-labs/design-system-workspace') {
        hasValidDsDep = true;
        results.checks.packageScope.details.push(`${rel}: Design system source package.`);
        continue;
      }

      if (deps['@rtkelly-labs/design-system']) {
        const spec = deps['@rtkelly-labs/design-system'];
        if (spec.startsWith('file:') || spec.startsWith('link:')) {
          results.violations.push({
            type: 'PACKAGE_SCOPE',
            file: rel,
            message: `Brittle local link detected for @rtkelly-labs/design-system: "${spec}". Use semantic versioning (e.g. ^0.20.0).`,
          });
        } else {
          hasValidDsDep = true;
          results.checks.packageScope.details.push(`${rel}: Uses @rtkelly-labs/design-system (${spec})`);
        }
      }

      if (deps['@rtkelly13/design-system']) {
        results.violations.push({
          type: 'PACKAGE_SCOPE',
          file: rel,
          message: `Legacy package scope detected: "@rtkelly13/design-system". Migrate to "@rtkelly-labs/design-system".`,
        });
      }
    } catch {
      // Ignore unparseable package.json
    }
  }

  results.checks.packageScope.status = hasValidDsDep && results.violations.every(v => v.type !== 'PACKAGE_SCOPE') ? 'PASS' : 'WARN';
}

// -------------------------------------------------------------
// Check 2: .ls-lint.yml Governance
// -------------------------------------------------------------
function checkLsLint() {
  const lsLintPath = path.join(targetDir, '.ls-lint.yml');
  if (!fs.existsSync(lsLintPath)) {
    results.violations.push({
      type: 'FILESYSTEM_GOVERNANCE',
      file: '.ls-lint.yml',
      message: 'Missing .ls-lint.yml file. Filesystem governance is mandatory across all repositories.',
    });
    results.checks.filesystemLsLint.status = 'FAIL';
    return;
  }

  const content = fs.readFileSync(lsLintPath, 'utf8');
  const hasCssBan = content.includes('.css: exists:0') || content.includes('.css: exists: 0');

  if (!hasCssBan) {
    results.violations.push({
      type: 'FILESYSTEM_GOVERNANCE',
      file: '.ls-lint.yml',
      message: '.ls-lint.yml does not enforce ".css: exists:0". Ad-hoc CSS files must be banned to protect design tokens.',
    });
    results.checks.filesystemLsLint.status = 'FAIL';
  } else {
    results.checks.filesystemLsLint.details.push('.ls-lint.yml enforces closed CSS file rules (.css: exists:0).');
  }

  // Check that @ls-lint/ls-lint is declared as a local devDependency, and dlx is banned
  const pkgPath = path.join(targetDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
      const hasLsLint = allDeps['@ls-lint/ls-lint'];

      if (!hasLsLint) {
        results.violations.push({
          type: 'LSLINT_DEV_DEPENDENCY',
          file: 'package.json',
          message: '@ls-lint/ls-lint must be declared in devDependencies. Running via pnpm dlx is strictly banned.',
        });
        results.checks.filesystemLsLint.status = 'FAIL';
      } else {
        results.checks.filesystemLsLint.details.push('package.json declares @ls-lint/ls-lint in devDependencies.');
      }

      // Check for any banned dlx usage in scripts
      if (pkg.scripts) {
        for (const [scriptName, scriptCmd] of Object.entries(pkg.scripts)) {
          if (typeof scriptCmd === 'string' && scriptCmd.includes('dlx')) {
            results.violations.push({
              type: 'BANNED_DLX_USAGE',
              file: `package.json -> scripts.${scriptName}`,
              message: `pnpm dlx is banned in scripts ("${scriptCmd}"). Use local script "ls-lint" or "pnpm exec ls-lint".`,
            });
            results.checks.filesystemLsLint.status = 'FAIL';
          }
        }
      }
    } catch {
      // Ignore unparseable package.json
    }
  }

  if (results.checks.filesystemLsLint.status !== 'FAIL') {
    results.checks.filesystemLsLint.status = 'PASS';
  }
}

// -------------------------------------------------------------
// Check 3: CSS Confinement
// -------------------------------------------------------------
function checkCssConfinement() {
  const rogueCssFiles = [];
  walkDir(targetDir, (filePath) => {
    if (filePath.endsWith('.css')) {
      const baseName = path.basename(filePath);
      const relPath = path.relative(targetDir, filePath);

      // Check if it's an allowed entrypoint or in escape-hatches folder
      const isAllowedBase = ALLOWED_CSS_BASENAMES.has(baseName);
      const isEscapeHatch = relPath.includes('escape-hatches') || relPath.includes('vendor');

      if (!isAllowedBase && !isEscapeHatch) {
        rogueCssFiles.push(relPath);
      }
    }
  });

  if (rogueCssFiles.length > 0) {
    for (const file of rogueCssFiles) {
      results.violations.push({
        type: 'CSS_CONFINEMENT',
        file,
        message: 'Ad-hoc CSS file detected. Styling must be achieved via @rtkelly-labs/design-system components and Tailwind role tokens. If native CSS is required, place in src/styles/escape-hatches/ and register in .ls-lint.yml ignore.',
      });
    }
    results.checks.cssConfinement.status = 'FAIL';
  } else {
    results.checks.cssConfinement.status = 'PASS';
    results.checks.cssConfinement.details.push('All stylesheets are confined to approved entrypoints or escape hatch directories.');
  }
}

// -------------------------------------------------------------
// Check 4: Code Guardrails (TSX / JSX) & Escape Hatch Annotation
// -------------------------------------------------------------
function checkCodeGuardrails() {
  const filesToScan = [];
  walkDir(targetDir, (filePath) => {
    const ext = path.extname(filePath);
    if (['.tsx', '.jsx'].includes(ext)) {
      filesToScan.push(filePath);
    }
  });

  let violationsCount = 0;
  for (const filePath of filesToScan) {
    const relPath = path.relative(targetDir, filePath);
    // Skip test fixtures or stories if inside node_modules/dist
    if (relPath.includes('node_modules') || relPath.includes('dist')) continue;

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      const prevLine = lineIdx > 0 ? lines[lineIdx - 1] : '';

      // Check if this line has a valid escape hatch annotation
      const hasEscapeHatch = ESCAPE_HATCH_REGEX.test(line) || ESCAPE_HATCH_REGEX.test(prevLine);

      // Check if line contains eslint-disable without ESCAPE_HATCH
      if ((line.includes('eslint-disable') || prevLine.includes('eslint-disable')) && !hasEscapeHatch) {
        results.violations.push({
          type: 'UNANNOTATED_DISABLE',
          file: `${relPath}:${lineIdx + 1}`,
          message: 'Linter disable comment lacks mandatory structured annotation. Must match "-- ESCAPE_HATCH(<domain>): <explanation>".',
        });
        violationsCount++;
      }

      // If authorized escape hatch is present, bypass further rule scanning on this line
      if (hasEscapeHatch) {
        continue;
      }

      for (const pattern of BANNED_PATTERNS) {
        pattern.regex.lastIndex = 0;
        let match;
        while ((match = pattern.regex.exec(line)) !== null) {
          // Special exception: SVG size variants like [&_svg]:size-3 are allowed
          if (line.includes('[&_svg]')) continue;

          results.violations.push({
            type: pattern.id.toUpperCase(),
            file: `${relPath}:${lineIdx + 1}`,
            matchedText: match[0],
            message: pattern.message,
          });
          violationsCount++;
        }
      }
    }
  }

  if (violationsCount > 0) {
    results.checks.codeGuardrails.status = 'FAIL';
  } else {
    results.checks.codeGuardrails.status = 'PASS';
    results.checks.codeGuardrails.details.push(`Scanned ${filesToScan.length} component files. Zero un-annotated negative guardrail violations.`);
  }
}

// -------------------------------------------------------------
// Run Checks and Output
// -------------------------------------------------------------
checkPackageScope();
checkLsLint();
checkCssConfinement();
checkCodeGuardrails();

results.passed = results.violations.length === 0;

if (jsonOutput) {
  console.log(JSON.stringify(results, null, 2));
} else {
  console.log('='.repeat(70));
  console.log('  RTKELLY LABS DESIGN SYSTEM GUARDRAILS AUDIT');
  console.log(`  Target: ${results.target}`);
  console.log('='.repeat(70));

  console.log(`\n1. Package Scope:       [ ${results.checks.packageScope.status} ]`);
  for (const d of results.checks.packageScope.details) console.log(`   - ${d}`);

  console.log(`\n2. Filesystem ls-lint:  [ ${results.checks.filesystemLsLint.status} ]`);
  for (const d of results.checks.filesystemLsLint.details) console.log(`   - ${d}`);

  console.log(`\n3. CSS Confinement:     [ ${results.checks.cssConfinement.status} ]`);
  for (const d of results.checks.cssConfinement.details) console.log(`   - ${d}`);

  console.log(`\n4. Code & Token Rules:  [ ${results.checks.codeGuardrails.status} ]`);
  for (const d of results.checks.codeGuardrails.details) console.log(`   - ${d}`);

  if (results.violations.length > 0) {
    console.log('\n' + '-'.repeat(70));
    console.log(`  VIOLATIONS DETECTED (${results.violations.length}):`);
    console.log('-'.repeat(70));

    for (const v of results.violations) {
      console.log(`\n❌ [${v.type}] ${v.file}`);
      if (v.matchedText) console.log(`   Match: "${v.matchedText}"`);
      console.log(`   Guidance: ${v.message}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('  AUDIT FAILED: Fix the violations above to align with design-system guardrails.');
    console.log('='.repeat(70));
    process.exit(1);
  } else {
    console.log('\n' + '='.repeat(70));
    console.log('  AUDIT PASSED: Repository strictly conforms to design system guardrails.');
    console.log('='.repeat(70));
    process.exit(0);
  }
}
