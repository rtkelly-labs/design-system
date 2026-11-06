import React from 'react';
import { Beaker, Boxes, Palette, Type, Sparkles, Projector, Terminal } from 'lucide-react';
import { PageTitle } from '../PageTitle';
import { Card } from '../Card';
import { Badge } from '../Badge';
import type { AccentToken } from '../../lib/theme';

export interface ExperimentItem {
  /** Stable identifier, handed back by `onSelectExperiment`. */
  id: string;
  /** Card heading, uppercased by the type scale. */
  name: string;
  /** One line under the heading saying what the experiment explores. */
  description: string;
  /** Leading glyph. A node rather than a component type, so it can carry its own size. */
  icon?: React.ReactNode;
  /**
   * Lifecycle state, shown as a badge and coloured by {@link STATUS_ACCENT} —
   * `success` for `active`, `info` for `experimental`, `quiet` for `archived`.
   */
  status: 'active' | 'archived' | 'experimental';
  /** How many primitives the experiment exercises, shown in the footer line. */
  componentCount: number;
}

/**
 * The catalogue `ExperimentsView` falls back to — ryankelly.dev's own.
 *
 * Exported so a consumer can spread it, slice it or use it as the shape of
 * their own list. Until #95 it was exported and *not* accepted as a prop, so
 * the name promised a fallback the component had no way to take.
 */
export const DEFAULT_EXPERIMENTS: ExperimentItem[] = [
  {
    id: 'component-library',
    name: 'Component Library',
    description: 'Every core primitive component rendered across the full theme ladder, side by side',
    icon: <Boxes size={36} color="var(--ds-accent-primary)" />,
    status: 'active',
    componentCount: 8,
  },
  {
    id: 'design-sandbox',
    name: 'Design System Sandbox',
    description: 'Interactive component variations, theme toggles, and live presentation playground',
    icon: <Palette size={36} color="var(--ds-accent-tertiary)" />,
    status: 'active',
    componentCount: 12,
  },
  {
    id: 'typography-proposals',
    name: 'Editorial Typography Proposals',
    description: 'Three-role font pairings (Space Grotesk + Inter + IBM Plex Mono + VT323)',
    icon: <Type size={36} color="var(--ds-accent-secondary)" />,
    status: 'active',
    componentCount: 4,
  },
  {
    id: 'presentation-decks',
    name: 'Brutalist Slide Decks',
    description: 'Keyboard-navigated presentation deck engine with fullscreen support',
    icon: <Projector size={36} color="var(--ds-intent-success)" />,
    status: 'active',
    componentCount: 6,
  },
  {
    id: 'graphics-generators',
    name: 'Graphics Generators',
    description: 'Seed-driven SVG background and hero graphics generators for talks',
    icon: <Sparkles size={36} color="var(--ds-accent-primary)" />,
    status: 'active',
    componentCount: 5,
  },
];

/**
 * How a lifecycle state is coloured.
 *
 * A `Record` over the union rather than a ternary, which is the ladder rule
 * from AGENTS.md applied to a smaller union: a fourth status becomes a compile
 * error here instead of silently falling through to whichever branch the
 * ternary ended on. The expression this replaced —
 * `status === 'active' ? 'cyan' : 'yellow'` — rendered `archived` and
 * `experimental` identically, so two different states looked the same while
 * their labels differed.
 *
 * `active` and `experimental` take **intent** roles because they are states a
 * reader acts on: one is live, one is in progress. `archived` takes `quiet`,
 * an *emphasis* role, and that is the deliberate exception — "archived" is not
 * a signal, it is the absence of one, so the right treatment is to recede
 * rather than to communicate.
 */
const STATUS_ACCENT: Record<ExperimentItem['status'], AccentToken> = {
  active: 'success',
  experimental: 'info',
  archived: 'quiet',
};

export interface ExperimentsViewProps {
  /**
   * The catalogue to render, in display order. Defaults to
   * {@link DEFAULT_EXPERIMENTS}, which is *this site's* list rather than a
   * neutral one — pass your own to use this anywhere else.
   */
  experiments?: readonly ExperimentItem[];
  /**
   * Called with the experiment's `id` when a card is chosen. Omit it and the
   * grid is a read-only display: the cards lose their pointer cursor and do
   * nothing when clicked.
   */
  onSelectExperiment?: (id: string) => void;
}

/**
 * The experiments index: a grid of cards, one per experiment, each with a
 * status badge and a component count.
 *
 * Pass `experiments` to supply the catalogue; it defaults to
 * {@link DEFAULT_EXPERIMENTS}, which is this site's own list and is exported so
 * a consumer can extend it rather than start from nothing.
 * `onSelectExperiment` turns the cards into navigation — without it the grid is
 * a read-only display.
 *
 * `status` is the only place the component uses colour to mean something, and
 * it reads from {@link STATUS_ACCENT} — intent roles for the two states a
 * reader acts on, `quiet` for `archived`. See that constant for why the third
 * one is the exception.
 */
export const ExperimentsView: React.FC<ExperimentsViewProps> = ({
  experiments = DEFAULT_EXPERIMENTS,
  onSelectExperiment,
}) => {
  return (
    <div
      style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '2rem 1.5rem',
        color: 'var(--ds-text-primary)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <Beaker size={40} color="var(--ds-accent-primary)" />
        <PageTitle subtitle="Interactive prototypes, design systems, and creative explorations" bracketed>
          EXPERIMENTS & LABS
        </PageTitle>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
        {experiments.map((exp) => (
          <div
            key={exp.id}
            onClick={() => onSelectExperiment && onSelectExperiment(exp.id)}
            className="bg-surface-raised text-content-primary border-2 border-edge-strong shadow-hard-md p-6 transition-[transform,box-shadow] duration-150 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--ds-accent-primary)] motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
            style={{
              display: 'flex',
              gap: '1.5rem',
              alignItems: 'center',
              cursor: onSelectExperiment ? 'pointer' : 'default',
            }}
          >
            <div>{exp.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.4rem' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-space-grotesk, "Space Grotesk"), sans-serif',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    margin: 0,
                    color: 'var(--ds-text-primary)',
                  }}
                >
                  {exp.name}
                </h3>
                <Badge accent={STATUS_ACCENT[exp.status]}>{exp.status.toUpperCase()}</Badge>
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-ibm-plex-mono, "IBM Plex Mono"), monospace',
                  fontSize: '0.875rem',
                  color: 'var(--ds-text-primary)',
                  opacity: 0.8,
                  margin: 0,
                }}
              >
                {exp.description}
              </p>
              <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', fontFamily: 'var(--font-ibm-plex-mono, "IBM Plex Mono"), monospace', color: 'var(--ds-accent-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Terminal size={14} />
                <span>{exp.componentCount} primitives contained</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
