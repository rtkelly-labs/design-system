import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { formatForDisplay } from '@tanstack/react-hotkeys';
import { SlideDeck, SLIDE_DECK_HOTKEYS } from '../components/slides/SlideDeck';
import { Slide } from '../components/slides/Slide';
import { TLDR } from '../components/TLDR';
import { Badge } from '../components/Badge';

const meta: Meta<typeof SlideDeck> = {
  title: 'Presentation/SlideDeck',
  tags: ['experimental'],
  component: SlideDeck,
};

export default meta;
type Story = StoryObj<typeof SlideDeck>;

export const DefaultDeck: Story = {
  render: () => (
    <SlideDeck>
      <Slide title="WELCOME TO THE SLIDE DECK" subtitle="Brutalist presentation system for talks and decks">
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-ibm-plex-mono, "IBM Plex Mono"), monospace', fontSize: '1.25rem', color: 'var(--ds-accent-secondary)' }}>
            Use [LEFT] / [RIGHT] Arrow Keys or Spacebar to Navigate
          </p>
          <div style={{ marginTop: '2rem' }}>
            <Badge accent="success">FULLSCREEN SUPPORT (Press 'F')</Badge>
          </div>
        </div>
      </Slide>

      <Slide title="DUAL-MODE PRESENTATIONS" subtitle="Slides follow every level of the theme ladder">
        <TLDR>
          Presentations rendered with @rtkelly/design-system read perfectly on high-brightness projectors as well as OLED terminal displays.
        </TLDR>
      </Slide>

      <Slide title="SYSTEM COMPLETE" subtitle="Ready for ryankelly.dev talks">
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-ibm-plex-mono, "IBM Plex Mono"), monospace' }}>
          <p>End of Presentation</p>
        </div>
      </Slide>
    </SlideDeck>
  ),
};

/**
 * Driven from outside: the index is a prop and the presenter affordances are
 * off. This is the shape a router, a docs page, or a frame renderer wants — and
 * the reason a deck can now be shown at a chosen slide at all.
 */
export const ControlledChromeless: Story = {
  render: () => (
    <SlideDeck slide={1} chrome={false}>
      <Slide title="FIRST" subtitle="not shown — the deck is on slide 1">
        <div />
      </Slide>
      <Slide title="DRIVEN FROM OUTSIDE" subtitle="slide={1} chrome={false}">
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-ibm-plex-mono, "IBM Plex Mono"), monospace', fontSize: '1.1rem', color: 'var(--ds-accent-secondary)' }}>
            No control bar, no arrow keys, no fullscreen.
          </p>
          <div style={{ marginTop: '2rem' }}>
            <Badge accent="primary">THE CALLER OWNS THE INDEX</Badge>
          </div>
        </div>
      </Slide>
    </SlideDeck>
  ),
};

/**
 * `autoPlayInterval` in milliseconds offers a play control that advances the
 * deck on its own, wrapping at the end — right for a kiosk or a lobby screen,
 * wrong for a talk, where the presenter owns the pacing. At `0`, the default,
 * the control is not rendered at all, so a deck that does not want autoplay
 * gains no chrome from the prop existing.
 */
export const Autoplay: Story = {
  render: () => (
    <SlideDeck autoPlayInterval={3000}>
      <Slide title="SLIDE ONE"><p>Advances after three seconds.</p></Slide>
      <Slide title="SLIDE TWO"><p>And again.</p></Slide>
      <Slide title="SLIDE THREE"><p>Then wraps back to the first.</p></Slide>
    </SlideDeck>
  ),
};

/**
 * Presenter notes. Press **`N`** — or the notes control that has appeared in
 * the bar, which no other deck on this page has — to open the panel below the
 * frame; it follows the current slide, and the third slide deliberately has no
 * notes so the empty case is visible too.
 *
 * Notes live on the `Slide`, not on the deck. An array of notes indexed by
 * position would put the two halves of one fact in different places and
 * misalign the moment a slide is inserted.
 *
 * Off by default and below the viewport rather than over it: a deck mirrored to
 * a projector shows the audience the slide and nothing else.
 */
export const WithSpeakerNotes: Story = {
  render: () => (
    <SlideDeck>
      <Slide
        title="ADOPT, DO NOT MANAGE"
        subtitle="Import before the first apply"
        speakerNotes="Open on the incident: a plan proposed deleting a live domain because the resource was declared but never imported. Nobody applied it — but nobody could tell at a glance that they shouldn't."
      >
        <p>Adoption cannot delete what it does not own.</p>
      </Slide>

      <Slide
        title="ONE STACK, THREE MODES"
        subtitle="Declared once, resolved per environment"
        speakerNotes="Don't read the table out. The only number worth saying aloud is that this replaced three per-repo copies."
      >
        <p>Identity, domains and env vars live in one place; repos own how they build.</p>
      </Slide>

      <Slide title="QUESTIONS">
        <p>No notes on this one — the panel says so rather than disappearing.</p>
      </Slide>
    </SlideDeck>
  ),
};

/**
 * The keys the deck actually binds, rendered from `SLIDE_DECK_HOTKEYS` —
 * the same array the deck registers through `useHotkeys` at mount. A binding
 * changed in one is a binding changed in the other, because there is one.
 */
export const KeyboardCheatsheet: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <SlideDeck>
        <Slide title="ARROW KEYS PAGE THIS DECK">
          <p>The legend below is generated from the deck&apos;s own binding table.</p>
        </Slide>
        <Slide title="THE SECOND SLIDE">
          <p>Wraps at both ends, like always.</p>
        </Slide>
      </SlideDeck>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-2 border-edge-strong bg-surface-base p-4 font-mono text-sm">
        {SLIDE_DECK_HOTKEYS.map((binding) => (
          <React.Fragment key={binding.label}>
            <dt className="text-accent-primary">{formatForDisplay(binding.hotkey)}</dt>
            <dd className="text-content-muted">{binding.description}</dd>
          </React.Fragment>
        ))}
      </dl>
    </div>
  ),
};
