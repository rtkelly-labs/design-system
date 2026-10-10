import type { FileChangeNode } from '../../components/docs/figures/FileChangeTree';

/** A math-rendering changeset, laid out as a reviewer reads it. Shared by the FileChangeTree and DrawingSheet stories. */
export const MATH_CHANGESET: FileChangeNode[] = [
  {
    name: 'src/',
    children: [
      { name: 'math.js', change: 'add', note: 'Delimiter rules, the marked extension, rendering and warnings.' },
      { name: 'math-load.js', change: 'add', note: 'Loads Temml only when the draft contains a formula.' },
      { name: 'markdown.js', change: 'modify', note: 'Registers the extension.' },
      { name: 'render.js', change: 'modify', note: 'Math warnings carry line numbers; styles load only with math.' },
      { name: 'legacy-katex.js', change: 'remove', note: 'Replaced by Temml.' },
      {
        name: 'themes/',
        children: [
          { name: 'math.css', change: 'add', note: 'Block formulas scroll horizontally; error styling.' },
          { name: 'math-css.js', change: 'add', note: 'Temml-Local.css plus a 9 KB inlined font.' },
        ],
      },
    ],
  },
  {
    name: 'scripts/',
    children: [{ name: 'build.mjs', change: 'modify', note: 'Bundles Temml as a string, compiled on first use.' }],
  },
  {
    name: 'test/',
    children: [
      { name: 'math.test.js', change: 'add', note: '44 cases.' },
      { name: 'math-browser.test.js', change: 'add', note: '4 cases, headless Chrome.' },
    ],
  },
];
