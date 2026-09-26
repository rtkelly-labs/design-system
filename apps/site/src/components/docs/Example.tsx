import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { EXAMPLES } from '@/examples';
import type { Example as ExampleDef } from '@/content/types';
import { Code } from './Code';
import { PreviewFrame } from './PreviewFrame';

const EXAMPLES_DIR = path.join(process.cwd(), 'src/examples');

/**
 * Preview and source, from one file.
 *
 * The preview mounts the component in `src/examples/<file>`; the code block
 * prints that same file, read at build time. There is no second copy of the
 * snippet to fall out of date — the thing a reader copies is the thing they
 * just clicked.
 */
export async function Example({ example }: { example: ExampleDef }) {
  const Component = EXAMPLES[example.file];
  if (!Component) throw new Error(`src/examples/index.ts has no entry for ${example.file}`);
  const source = await readFile(path.join(EXAMPLES_DIR, example.file), 'utf8');

  return (
    <div className="not-prose my-6">
      <PreviewFrame label={example.title} wide={example.wide}>
        <Component />
      </PreviewFrame>
      <Code code={source} lang="tsx" title={example.file.split('/').pop()} attached />
    </div>
  );
}
