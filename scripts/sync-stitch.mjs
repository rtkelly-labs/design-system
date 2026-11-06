#!/usr/bin/env node
/**
 * scripts/sync-stitch.mjs
 *
 * Downloads and organizes Stitch screens into modular domain directories:
 * - components/   (Button, Input, Card, DataTable, AppShell...)
 * - foundations/  (Tokens, Swatches, Theme Ladder, Accessibility...)
 * - patterns/     (Figure Compositions, Layouts...)
 * - applied/      (Blog, Slide Deck, Admin Dashboard, Sandbox...)
 * - rig-triage/   (Diff Inspector, Command Surface, Persistent Header...)
 * - references/   (Manifesto, Storybook captures, raw screenshots...)
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const PROJECT_ID = process.argv[2] || '15584064052755862992';
const OUTPUT_ROOT = path.resolve(process.argv[3] || './stitch-assets');

function getAuthToken() {
  const raw = execSync('stitch status --token', { encoding: 'utf8' }).trim();
  try {
    const parsed = JSON.parse(raw);
    if (parsed.accessToken) return parsed.accessToken;
  } catch {}
  return raw;
}

function classify(title = '') {
  if (title.startsWith('Component —')) return 'components';
  if (title.startsWith('Foundation —') || title.startsWith('Guide —')) return 'foundations';
  if (title.startsWith('Docs pattern —')) return 'patterns';
  if (title.startsWith('Applied example —')) return 'applied';
  if (title.startsWith('Rig Triage —')) return 'rig-triage';
  return 'references';
}

function sanitize(str) {
  return str.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

/**
 * Stitch answers a download with a JSON envelope whose `dataString` holds the payload,
 * base64-encoded. Unwrap it, and accept a bare payload too in case the API stops wrapping.
 */
function unwrap(body, kind) {
  try {
    const parsed = JSON.parse(body.toString('utf8'));
    if (typeof parsed?.dataString === 'string') {
      const data = parsed.dataString;
      const isMarkup = kind === 'text' && /^\s*</.test(data);
      return isMarkup ? Buffer.from(data, 'utf8') : Buffer.from(data, 'base64');
    }
  } catch {
    // Not JSON: the body is already the payload.
  }
  return body;
}

/** Downloads one asset. Returns its path relative to the output root, or null if none is on disk. */
async function download(url, token, filePath, kind, title) {
  if (!url) return null;
  const rel = path.relative(OUTPUT_ROOT, filePath);
  const kept = () => (fs.existsSync(filePath) ? rel : null);
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      console.error(`    ✗ ${rel}: HTTP ${res.status} for ${title}`);
      return kept();
    }
    fs.writeFileSync(filePath, unwrap(Buffer.from(await res.arrayBuffer()), kind));
    console.log(`  ↓ ${rel}`);
    return rel;
  } catch (err) {
    console.error(`    ✗ ${rel}: ${err.message}`);
    return kept();
  }
}

async function main() {
  console.log(`[Stitch Sync] Fetching screens for project: ${PROJECT_ID}...`);
  const token = getAuthToken();

  const screensRaw = execSync(`stitch find screens --project ${PROJECT_ID} --json`, { encoding: 'utf8' });
  const screens = JSON.parse(screensRaw).data.items;

  console.log(`[Stitch Sync] Found ${screens.length} total screens.`);
  fs.mkdirSync(OUTPUT_ROOT, { recursive: true });

  const manifest = [];
  const usedNames = new Set();

  for (const screen of screens) {
    const category = classify(screen.title);
    const catDir = path.join(OUTPUT_ROOT, category);
    fs.mkdirSync(catDir, { recursive: true });

    // Two titles can sanitize to the same name; the id keeps the second from overwriting the first.
    let baseName = sanitize(screen.title || screen.id);
    if (usedNames.has(`${category}/${baseName}`)) baseName = `${baseName}_${sanitize(screen.id)}`;
    usedNames.add(`${category}/${baseName}`);
    const entry = {
      id: screen.id,
      title: screen.title || screen.id,
      category,
      deviceType: screen.deviceType || 'DESKTOP',
      width: screen.width,
      height: screen.height,
      screenshotFile: null,
      htmlFile: null,
    };

    // Every sync re-downloads: a screen edited in Stitch keeps its title, so a file
    // already on disk says nothing about whether it is current.
    entry.screenshotFile = await download(screen.screenshot?.downloadUrl, token, path.join(catDir, `${baseName}.png`), "binary", entry.title);
    entry.htmlFile = await download(screen.htmlCode?.downloadUrl, token, path.join(catDir, `${baseName}.html`), "text", entry.title);

    manifest.push(entry);
  }

  // Write manifest.json
  const manifestPath = path.join(OUTPUT_ROOT, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  // Write README.md index
  const categories = ['components', 'foundations', 'patterns', 'applied', 'rig-triage', 'references'];
  let md = `# Stitch Design Screens Inventory\n\nProject ID: \`${PROJECT_ID}\`\nLast synced: ${new Date().toISOString()}\n\n`;

  for (const cat of categories) {
    const items = manifest.filter(m => m.category === cat);
    if (items.length === 0) continue;
    md += `## ${cat.toUpperCase()} (${items.length})\n\n`;
    md += `| Title | Dimensions | Assets |\n| :--- | :--- | :--- |\n`;
    for (const item of items) {
      const links = [];
      if (item.screenshotFile) links.push(`[Screenshot](${item.screenshotFile})`);
      if (item.htmlFile) links.push(`[HTML](${item.htmlFile})`);
      md += `| **${item.title}** | ${item.width} × ${item.height} | ${links.join(' · ') || 'None'} |\n`;
    }
    md += `\n`;
  }

  fs.writeFileSync(path.join(OUTPUT_ROOT, 'README.md'), md, 'utf8');
  console.log(`[Stitch Sync] Done! Manifest and catalog saved to ${OUTPUT_ROOT}`);
}

main().catch(err => {
  console.error('[Stitch Sync] Fatal error:', err);
  process.exit(1);
});
