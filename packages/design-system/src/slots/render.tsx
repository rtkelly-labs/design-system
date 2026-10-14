/**
 * Render a component's stories to static markup without Storybook: meta args under story args, the
 * story's `render` (else the meta's, else the component), decorators outward. The same recipe the
 * compendium registry uses; it is not imported from there because the design system must never depend
 * on the report package.
 */

import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider } from '../components/ThemeProvider';

type Ctx = Record<string, unknown>;
interface StoryLike {
  args?: Record<string, unknown>;
  render?: (args: Record<string, unknown>, ctx: Ctx) => ReactNode;
  decorators?: ((Story: () => ReactNode, ctx: Ctx) => ReactNode)[];
}

/** Names of a module's story exports. */
export const storyNames = (mod: Record<string, unknown>) => Object.keys(mod).filter((k) => k !== 'default' && typeof mod[k] === 'object' && mod[k] !== null);

/** Static markup of one story export, or `null` when it throws. */
export function renderStory(mod: Record<string, unknown>, name: string): string | null {
  const meta = mod.default as StoryLike & { title?: string; component?: (p: never) => ReactNode };
  const story = mod[name] as StoryLike;
  const args = { ...meta.args, ...story.args };
  const ctx: Ctx = { args, globals: {}, parameters: {}, viewMode: 'story', id: name, name, title: meta.title };
  const render = story.render ?? meta.render;
  const Component = meta.component as unknown as (props: Record<string, unknown>) => ReactNode;
  let Inner: () => ReactNode = () => (render ? render(args, ctx) : createElement(Component, args));
  for (const decorate of [...(story.decorators ?? []), ...(meta.decorators ?? [])]) {
    const previous = Inner;
    Inner = () => decorate(previous, ctx);
  }
  try {
    return renderToStaticMarkup(createElement(ThemeProvider, null, createElement(Inner)));
  } catch {
    return null;
  }
}

/** Every `data-slot` value in a piece of markup, in document order. */
export const slotsIn = (markup: string): string[] => [...markup.matchAll(/data-slot="([^"]+)"/g)].map((m) => m[1]!);
