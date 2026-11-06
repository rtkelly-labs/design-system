import type { ReactNode } from 'react';
import { Prose } from '../../components/docs/Prose';
import { BracketText } from '../../components/BracketText';
import { semanticTokens } from '../../lib/theme';

/**
 * The frame the manifesto renders inside.
 *
 * ## Where the level comes from
 *
 * The toolbar's `Level` control, and nothing here. That is worth stating because
 * this page carried its own switch first, and the reason it could is the reason
 * it should not: Storybook's decorators wrap *stories*, so a docs page with no
 * story on it is a page the toolbar cannot reach, and a second switch was the
 * obvious way out.
 *
 * The real fix is that the specimens are stories — see `Manifesto.stories.tsx`.
 * `.storybook/preview.ts` sets `data-theme` on the preview iframe's own `<html>`
 * rather than on the story subtree, so one rendered story themes the entire
 * document, this frame and the surrounding prose included. Every colour below
 * resolves through those variables, so there is nothing left for a provider here
 * to do.
 */
export function ManifestoPage({ children }: { children: ReactNode }) {
  return (
    <div
      className="border-2 border-edge-strong bg-surface-base p-6 text-content-primary sm:p-10"
      style={{ fontFamily: semanticTokens.font.body }}
    >
      <div className="not-prose mb-8 flex flex-wrap items-center justify-between gap-4 border-b-2 border-edge-strong pb-4">
        <span
          className="text-caption font-bold tracking-[0.24em] text-content-muted uppercase"
          style={{ fontFamily: semanticTokens.font.mono }}
        >
          @rtkelly13/design-system
        </span>
        <span
          className="text-caption tracking-[0.16em] text-content-muted uppercase"
          style={{ fontFamily: semanticTokens.font.mono }}
        >
          level → toolbar
        </span>
      </div>

      {/*
        `[&_code]` with a trailing `!` is a cascade fix, and the reason is worth
        stating so it is not "tidied" into a `prose-code:` modifier — which is
        what this started as, and it does nothing.

        Storybook maps MDX's tags onto its own styled components, which carry an
        emotion class *on the element*: `.css-xxxx { color: #2e3338 }` for inline
        code. That rule is unlayered, and every Tailwind utility here — including
        everything the typography plugin emits — sits inside a cascade layer. An
        unlayered normal declaration beats a layered one whatever their
        specificity, so inline code rendered near-black on the midnight ground
        and a plain descendant selector at higher specificity still lost.
        `!important` is what outranks an unlayered declaration.

        Two other routes were tried and do not work: `sb-unstyled` guards only
        Storybook's own stylesheet selectors, not a class on the element, and
        passing this package's `mdxComponents` map through
        `parameters.docs.components` does not reach an unattached docs page.
      */}
      <Prose className="max-w-none [&_code]:bg-surface-raised! [&_code]:text-accent-secondary!">
        {children}
      </Prose>
    </div>
  );
}

/**
 * A specimen block: the bracketed label and the caption that frame one story.
 *
 * `not-prose` is load-bearing. Everything inside is chrome and rendered
 * components, and the typography plugin's selectors all exclude this class —
 * which is how a component nested in an article escapes the article's list
 * markers and link treatment.
 */
export function Specimen({
  label,
  caption,
  children,
}: {
  label: string;
  caption?: string;
  children: ReactNode;
}) {
  return (
    <section className="not-prose my-8 border-2 border-edge-default bg-surface-raised p-5">
      <h3
        className="text-caption font-bold tracking-[0.18em] uppercase"
        style={{ fontFamily: semanticTokens.font.display }}
      >
        <BracketText accent="secondary">{label}</BracketText>
      </h3>
      {caption && (
        <p
          className="mt-2 mb-5 max-w-[70ch] text-caption text-content-secondary"
          style={{ fontFamily: semanticTokens.font.mono }}
        >
          {caption}
        </p>
      )}
      <div className={caption ? '' : 'mt-5'}>{children}</div>
    </section>
  );
}
