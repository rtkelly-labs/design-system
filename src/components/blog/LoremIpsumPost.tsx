import React from 'react';
import { BlogPost } from './BlogPost';
import { TLDR } from '../TLDR';
import { NoteBlock } from '../NoteBlock';
import { BracketText } from '../BracketText';

export const LoremIpsumPost: React.FC = () => {
  return (
    <BlogPost
      title="Architecture of a Brutalist Design Engine"
      subtitle="Extending terminal aesthetics and dual-mode theme propagation across web surfaces"
      date="July 26, 2026"
      readingTime="6 min read"
      tags={['Design System', 'Brutalism', 'Architecture']}
    >
      <TLDR>
        Modern web design systems often default to safe, generic rounded corners and muted colors.
        By enforcing zero border-radius, hard offset shadows, bracketed display typography, and a unified
        dual-mode (<BracketText accent="primary">DARK</BracketText> / <BracketText accent="secondary">SKETCH</BracketText>) token matrix,
        we achieve an unmistakable visual identity that scales across every application.
      </TLDR>

      <h2 style={{ fontFamily: 'var(--font-space-grotesk, "Space Grotesk"), sans-serif', fontSize: '1.75rem', fontWeight: 800, textTransform: 'uppercase', marginTop: '2.5rem', color: 'var(--ds-accent-primary)' }}>
        [ 01. The Problem with Generic Web UI ]
      </h2>
      <p style={{ marginTop: '1rem' }}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.
        Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris. Fusce nec tellus sed augue semper porta.
      </p>

      <NoteBlock type="important" title="SYSTEM RULE ENFORCEMENT">
        Never hardcode pixel border radii or hex literals inside downstream component code.
        All colors must resolve through standard CSS tokens (<code style={{ color: 'var(--ds-accent-primary)' }}>--ds-accent-primary</code>, <code style={{ color: 'var(--ds-accent-tertiary)' }}>--ds-accent-tertiary</code>) to preserve paper-and-ink theme remapping.
      </NoteBlock>

      <h2 style={{ fontFamily: 'var(--font-space-grotesk, "Space Grotesk"), sans-serif', fontSize: '1.75rem', fontWeight: 800, textTransform: 'uppercase', marginTop: '2.5rem', color: 'var(--ds-accent-tertiary)' }}>
        [ 02. Executable Design Tokens ]
      </h2>
      <p style={{ marginTop: '1rem' }}>
        Below is an example of code block rendering within the design system:
      </p>

      <div style={{ margin: '1.5rem 0', border: '2px solid var(--ds-border-strong)', backgroundColor: 'var(--ds-surface-base)' }}>
        <div style={{ padding: '0.75rem 1.25rem', backgroundColor: 'var(--ds-border-strong)', color: 'var(--ds-surface-base)', fontFamily: 'var(--font-ibm-plex-mono, "IBM Plex Mono"), monospace', fontWeight: 800, fontSize: '0.875rem' }}>
          // tailwind-preset.ts
        </div>
        {/* Scrollable at narrow widths — see `CodeBlock` for why this needs a tabIndex. */}
        <pre tabIndex={0} role="region" aria-label="Code sample" style={{ padding: '1.25rem', fontFamily: 'var(--font-ibm-plex-mono, "IBM Plex Mono"), monospace', fontSize: '0.875rem', color: 'var(--ds-intent-success)', overflowX: 'auto', margin: 0 }}>
{`export const brutalistTailwindPreset = {
  theme: {
    extend: {
      borderRadius: { none: '0px' },
      boxShadow: {
        'hard-md': '4px 4px 0px 0px var(--ds-shadow-color)',
        'hard-cyan': '4px 4px 0px 0px var(--ds-accent-primary)',
      }
    }
  }
};`}
        </pre>
      </div>

      <NoteBlock type="tip" title="DUAL-MODE THEME SYNCHRONIZATION">
        When cycling to <BracketText accent="secondary">SKETCH</BracketText> mode, the dark screen transforms into a warm paper sheet,
        while cyan and pink re-map into rich blue and red pen inks.
      </NoteBlock>

      <p style={{ marginTop: '1.5rem' }}>
        In conclusion, adopting this design system as a shared foundation guarantees that every website and project
        inherits a cohesive, high-performance visual surface.
      </p>
    </BlogPost>
  );
};
