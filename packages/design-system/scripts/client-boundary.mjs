#!/usr/bin/env node
/**
 * Which shipped modules must carry `'use client'`, decided by reading them.
 *
 * ## Why this exists
 *
 * Until #301 `dist/` was one flat file with no directive, and React's server
 * build has no `createContext`, so importing *anything* from the package in a
 * Next App Router server component failed at module evaluation:
 * `TypeError: createContext is not a function`. A consumer had to reach every
 * component through a `'use client'` file of their own, `Card` and `LEVELS`
 * included.
 *
 * `dist/` is now one file per source module, so the directive can sit on
 * exactly the modules that need it. A server component can then render `Card`
 * as a server component, and `Select` arrives as a client reference, both from
 * the same root import.
 *
 * ## The rule
 *
 * A module needs the directive when it does something a server component
 * cannot:
 *
 *   - calls a hook — any `useX(...)`, React's or this package's — or
 *     `createContext`;
 *   - hands a function to an element as a prop — an inline arrow, a function
 *     expression, or an `onX` bound to a function declared in the module —
 *     because functions do not cross the server/client boundary;
 *   - takes a value from a package that renders with hooks and ships no
 *     directive of its own (`CLIENT_PACKAGES`). Base UI and lucide mark their
 *     own modules, so rendering them does not make a module client.
 *
 * Everything else stays a server module. Over-marking is safe but gives away
 * the point; under-marking crashes a consumer's server render. So the test
 * beside this file fails both ways: a module that needs the directive and
 * lacks it, and a module that carries it without needing it.
 *
 * One more way to be wrong: a server module that imports a *non-component*
 * value from a client module receives a client reference, and calling it on
 * the server throws. `serverImportsOfClientValues` finds those.
 *
 *   node scripts/client-boundary.mjs          print the census
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import esbuild from 'esbuild';
import ts from 'typescript';

import { ROOT, reachableModules } from './module-graph.mjs';

/**
 * Packages whose components or hooks need a client runtime and which do not
 * mark their own modules `'use client'`. Measured, not assumed: each of these
 * calls hooks in its published build and none carries the directive.
 * `@visx/scale` and `@visx/group` are hook-free and deliberately absent.
 */
export const CLIENT_PACKAGES = [
  '@visx/axis',
  '@visx/grid',
  '@visx/responsive',
  '@visx/shape',
  '@visx/text',
  '@visx/tooltip',
  '@tanstack/react-table',
  '@tanstack/react-virtual',
  '@tanstack/react-hotkeys',
];

const HOOK = /^use[A-Z]/;

/**
 * Hooks React's server build does export, and which a server component may
 * call. `useId` is the one that matters: `Hero`, `CTASection` and the field
 * frame use it to pair a heading or label with its target, and nothing else
 * about them needs the client.
 *
 * `useMemo` and `useCallback` are exported too, and deliberately not listed:
 * `const onX = useCallback(...)` is a function bound to a call rather than to
 * an arrow, so the handler check below cannot see it, and a memoised callback
 * exists to be handed to something.
 */
const SERVER_HOOKS = new Set(['useId']);

function parse(file) {
  return ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

export function hasDirective(sf) {
  for (const statement of sf.statements) {
    if (!ts.isExpressionStatement(statement) || !ts.isStringLiteral(statement.expression)) return false;
    if (statement.expression.text === 'use client') return true;
  }
  return false;
}

const isFunctionNode = (node) => node && (ts.isArrowFunction(node) || ts.isFunctionExpression(node));

/** Why this module needs `'use client'`, or an empty list when it does not. */
export function clientReasons(sf) {
  const reasons = new Set();
  const localFunctions = new Set();

  // Names declared in the module as functions, so `onClick={handleClick}` can
  // be told apart from `onClick={onClick}` passed through from props.
  const collect = (node) => {
    if (ts.isFunctionDeclaration(node) && node.name) localFunctions.add(node.name.text);
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && isFunctionNode(node.initializer)) {
      localFunctions.add(node.name.text);
    }
    ts.forEachChild(node, collect);
  };
  collect(sf);

  for (const statement of sf.statements) {
    if (!ts.isImportDeclaration(statement) || statement.importClause?.isTypeOnly) continue;
    const specifier = statement.moduleSpecifier.text;
    if (CLIENT_PACKAGES.some((name) => specifier === name || specifier.startsWith(`${name}/`))) {
      reasons.add(`imports ${specifier}`);
    }
  }

  const visit = (node) => {
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const name = ts.isIdentifier(callee)
        ? callee.text
        : ts.isPropertyAccessExpression(callee)
          ? callee.name.text
          : undefined;
      if (name && HOOK.test(name) && !SERVER_HOOKS.has(name)) reasons.add(`calls ${name}`);
      if (name === 'createContext') reasons.add('calls createContext');
    }
    if (ts.isJsxAttribute(node) && node.initializer && ts.isJsxExpression(node.initializer)) {
      const value = node.initializer.expression;
      const prop = node.name.getText(sf);
      if (isFunctionNode(value)) reasons.add(`passes a function to ${prop}`);
      if (value && ts.isIdentifier(value) && /^on[A-Z]/.test(prop) && localFunctions.has(value.text)) {
        reasons.add(`passes ${value.text} to ${prop}`);
      }
    }
    if (ts.isClassDeclaration(node) && node.heritageClauses?.length) reasons.add('declares a class component');
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return [...reasons].sort();
}

/**
 * Resolve each module's relative imports to the module file, so server → client
 * edges can be inspected. esbuild does the resolving, so `.ts` extensions,
 * directory indexes and the `@/` alias behave exactly as they do in the build.
 */
function importGraph(modules) {
  const { metafile } = esbuild.buildSync({
    entryPoints: modules,
    absWorkingDir: ROOT,
    bundle: true,
    write: false,
    metafile: true,
    packages: 'external',
    logLevel: 'silent',
    outdir: path.join(ROOT, '.client-boundary'),
    loader: { '.css': 'empty' },
  });
  const graph = new Map();
  for (const [input, meta] of Object.entries(metafile.inputs)) {
    const from = path.resolve(ROOT, input);
    graph.set(
      from,
      new Map(
        meta.imports
          .filter((edge) => !edge.external && edge.original)
          .map((edge) => [edge.original, path.resolve(ROOT, edge.path)]),
      ),
    );
  }
  return graph;
}

/**
 * Every place a server module imports a value from a client module and does
 * something other than render it as a JSX tag. Calling or reading such a value
 * on the server throws, because what the server module receives is a client
 * reference.
 */
export function serverImportsOfClientValues(modules, clientSet) {
  const graph = importGraph(modules);
  const findings = [];
  for (const file of modules) {
    if (clientSet.has(file)) continue;
    const sf = parse(file);
    const edges = graph.get(file) ?? new Map();
    const fromClient = new Map();
    for (const statement of sf.statements) {
      if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue;
      const specifier = statement.moduleSpecifier?.text;
      const target = specifier && edges.get(specifier);
      if (!target || !clientSet.has(target)) continue;
      // Re-exports pass the reference through untouched, which is fine: the
      // consumer meets it as a client reference, the same as importing the
      // client module directly.
      if (ts.isExportDeclaration(statement)) continue;
      const clause = statement.importClause;
      if (!clause || clause.isTypeOnly) continue;
      const named = clause.namedBindings;
      if (clause.name) fromClient.set(clause.name.text, specifier);
      if (named && ts.isNamespaceImport(named)) fromClient.set(named.name.text, specifier);
      if (named && ts.isNamedImports(named)) {
        for (const element of named.elements) {
          if (!element.isTypeOnly) fromClient.set(element.name.text, specifier);
        }
      }
    }
    if (fromClient.size === 0) continue;
    const visit = (node) => {
      if (ts.isIdentifier(node) && fromClient.has(node.text)) {
        const parent = node.parent;
        const asTag =
          (ts.isJsxOpeningElement(parent) || ts.isJsxSelfClosingElement(parent) || ts.isJsxClosingElement(parent)) &&
          parent.tagName === node;
        const declaration = ts.isImportSpecifier(parent) || ts.isImportClause(parent) || ts.isNamespaceImport(parent);
        const typeOnly = ts.isTypeReferenceNode(parent) || ts.isTypeQueryNode(parent) || ts.isQualifiedName(parent);
        if (!asTag && !declaration && !typeOnly) {
          findings.push({
            file: path.relative(ROOT, file),
            name: node.text,
            from: fromClient.get(node.text),
          });
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  return findings;
}

/**
 * The whole census: every shipped module, whether it carries the directive,
 * and whether — and why — it needs one.
 *
 * A module's own source decides first. Then any server module that uses a
 * client module's value as something other than a JSX tag is moved to the
 * client too, repeatedly, until nothing moves: `SiteHeader` provides a context
 * `siteNavContext` creates, and a context cannot be provided on the server.
 */
export function census() {
  const modules = reachableModules();
  const rows = new Map(
    modules.map((file) => {
      const sf = parse(file);
      return [file, { file, rel: path.relative(ROOT, file), directive: hasDirective(sf), reasons: clientReasons(sf) }];
    }),
  );
  for (;;) {
    const client = new Set([...rows.values()].filter((row) => row.reasons.length > 0).map((row) => row.file));
    const findings = serverImportsOfClientValues(modules, client);
    if (findings.length === 0) break;
    for (const finding of findings) {
      const row = rows.get(path.resolve(ROOT, finding.file));
      const reason = `uses ${finding.name} from ${finding.from}`;
      if (!row.reasons.includes(reason)) row.reasons.push(reason);
    }
  }
  return [...rows.values()].map((row) => ({ ...row, client: row.reasons.length > 0 }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const rows = census();
  const client = rows.filter((row) => row.client);
  const server = rows.filter((row) => !row.client);
  console.log(`${rows.length} shipped modules: ${client.length} client, ${server.length} server.\n`);
  console.log('Client:');
  for (const row of client) {
    console.log(`  ${row.directive ? ' ' : '!'} ${row.rel.padEnd(50)} ${row.reasons.slice(0, 3).join('; ')}`);
  }
  console.log('\nServer:');
  for (const row of server) console.log(`  ${row.directive ? '!' : ' '} ${row.rel}`);
  console.log('\n`!` marks a module whose directive disagrees with the rule.');
}
