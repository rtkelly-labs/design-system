import { it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

it('serves the root but refuses encoded traversal into a sibling directory', async () => {
  const temp = mkdtempSync(path.join(tmpdir(), 'ds-server-'));
  const root = path.join(temp, 'public');
  mkdirSync(root);
  mkdirSync(`${root}-private`);
  writeFileSync(path.join(root, 'index.html'), 'public page');
  writeFileSync(path.join(`${root}-private`, 'secret.txt'), 'private page');
  const script = path.resolve('../../scripts/serve-deploy.mjs');
  const child = spawn(process.execPath, [script, root, '--port', '0']);
  try {
    const port = await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('exit', (code) => reject(new Error(`server exited ${code}`)));
      let output = '';
      child.stdout.on('data', (data) => {
        output += data;
        const match = output.match(/localhost:(\d+)/);
        if (match) resolve(match[1]);
      });
    });
    expect(await (await fetch(`http://127.0.0.1:${port}/`)).text()).toBe('public page');
    const response = await fetch(`http://127.0.0.1:${port}/..%2fpublic-private/secret.txt`);
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain('private page');
  } finally {
    if (child.exitCode === null) {
      const stopped = new Promise((resolve) => child.once('exit', resolve));
      child.kill();
      await stopped;
    }
    rmSync(temp, { recursive: true, force: true });
  }
});
