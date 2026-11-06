import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, Maximize2, Minimize2, Play, Pause } from 'lucide-react';
import { useHotkeys, type RegisterableHotkey } from '@tanstack/react-hotkeys';
import { Button } from '../Button';
import type { SlideProps } from './Slide';

/**
 * The notes on one slide, if it has any.
 *
 * Reading a child's props is not a thing to do lightly, but it is the right
 * shape here: notes belong *with* the slide that needs them, and the presenter
 * surface belongs to the deck. The alternative — a `notes` array on the deck,
 * indexed by position — puts the two halves of one fact in different files and
 * silently misaligns the moment a slide is inserted.
 */
function speakerNotesOf(node: React.ReactNode): string | undefined {
  if (!React.isValidElement(node)) return undefined;
  const notes = (node.props as Partial<SlideProps>).speakerNotes;
  return notes?.trim() ? notes : undefined;
}

/**
 * One key on the deck's keyboard surface, as registered and as documented.
 * This array is the only place a deck key is written: `SlideDeck` registers
 * it with `@tanstack/react-hotkeys`, the presenter sees it in the controls,
 * and the docs cheatsheet renders it — three consumers of one list, so none
 * of them can drift from the other two.
 */
export interface SlideDeckHotkey {
  /** The binding in @tanstack/react-hotkeys notation — `ArrowRight`, `f`. */
  hotkey: RegisterableHotkey;
  /** What the key does, in the deck's own words. */
  label: string;
  /** The one line the cheatsheet shows beside the key. */
  description: string;
  action: 'next' | 'previous' | 'fullscreen' | 'notes';
  /**
   * Whether the browser's own behaviour (caret, scroll, space-scroll) is
   * swallowed when the binding fires. `false` for fullscreen, whose `F` is
   * not a scrolling key and whose default action belongs to nobody.
   */
  preventsDefault?: boolean;
  /** A binding only exists when the deck has the feature it drives. */
  requires?: 'notes';
}

export const SLIDE_DECK_HOTKEYS: readonly SlideDeckHotkey[] = [
  { hotkey: 'ArrowRight', label: 'Next', description: 'Advance one slide, wrapping at the end', action: 'next' },
  { hotkey: 'Space', label: 'Next', description: 'Advance one slide, as → does', action: 'next' },
  { hotkey: 'ArrowLeft', label: 'Previous', description: 'Go back one slide, wrapping at the start', action: 'previous' },
  { hotkey: 'F', label: 'Fullscreen', description: 'Toggle fullscreen on the deck frame', action: 'fullscreen', preventsDefault: false },
  { hotkey: 'N', label: 'Notes', description: 'Toggle the presenter panel — bound only when a slide carries notes', action: 'notes', requires: 'notes' },
];

export interface SlideDeckProps {
  children: React.ReactElement[];
  aspectRatio?: '16:9' | '4:3';
  /**
   * Milliseconds between automatic advances. `0` — the default — disables
   * autoplay and hides the play control entirely, so a deck that does not want
   * it gains no chrome. Non-zero offers the control; it is right for a kiosk
   * and wrong for a talk, where the presenter owns the pacing.
   */
  autoPlayInterval?: number;
  /**
   * The slide to show. Pass it to drive the deck from outside — a router, a
   * story, a frame renderer — and the deck stops owning the index. Omit it and
   * the deck keeps its own, which is the existing behaviour.
   *
   * The deck holding the index is why it could not previously be screenshotted
   * at a chosen slide, deep-linked, or driven by anything but a person.
   */
  slide?: number;
  /** Fires with the slide the deck wants to move to, controlled or not. */
  onSlideChange?: (slide: number) => void;
  /**
   * The presenter affordances — control bar, arrow keys, fullscreen. On by
   * default. Turn them off for a surface that already owns its own navigation,
   * or that has no person in front of it at all.
   */
  chrome?: boolean;
}

/**
 * The presentation shell around a set of `Slide`s: framing, paging, fullscreen
 * and optional autoplay.
 *
 * It owns the aspect ratio so slides do not have to, wraps at both ends (next
 * from the last slide returns to the first), and exposes fullscreen through the
 * Fullscreen API on its own container rather than the document — so a deck
 * embedded in a page goes fullscreen without taking the page with it.
 *
 * **Presenter notes.** Any child carrying `speakerNotes` makes a notes control
 * appear, and `N` toggles a panel below the frame showing the current slide's.
 * Both the control and the panel are absent unless some slide has notes, and
 * the panel starts closed — so notes never reach a projector unasked, and a
 * deck without them renders exactly as it did before the feature existed.
 *
 * Keyboard: the bindings in `SLIDE_DECK_HOTKEYS` — `←`/`→` or space to page,
 * `F` for fullscreen, `N` for notes when any slide carries them.
 *
 * Slides are indexed by position, so the children must be a stable array. A
 * conditional slide that disappears shifts every index after it.
 *
 * ```tsx
 * <SlideDeck aspectRatio="16:9">
 *   <Slide title="Overview">…</Slide>
 *   <Slide title="Deployments">…</Slide>
 * </SlideDeck>
 * ```
 */
export const SlideDeck: React.FC<SlideDeckProps> = ({
  children,
  aspectRatio = '16:9',
  autoPlayInterval = 0,
  slide,
  onSlideChange,
  chrome = true,
}) => {
  // Only consulted when uncontrolled. `slide` winning outright is what keeps a
  // controlled deck from ever disagreeing with its caller.
  const [uncontrolledSlide, setUncontrolledSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalSlides = React.Children.count(children);
  const isControlled = slide !== undefined;
  const currentSlide = isControlled ? slide : uncontrolledSlide;
  const slideList = React.Children.toArray(children);

  /**
   * Notes are opt-in twice over: off until asked for, and invisible as a
   * feature unless some slide actually carries them. A deck without notes
   * therefore renders exactly as it did before presenter notes existed.
   */
  const deckHasNotes = slideList.some((child) => speakerNotesOf(child) !== undefined);
  const currentNotes = speakerNotesOf(slideList[currentSlide]);

  const goTo = useCallback(
    (next: number) => {
      // Guarded rather than left to the modulo: an empty deck used to send
      // `prevSlide` to -1, which indexed nothing and rendered blank.
      if (totalSlides === 0) return;
      const wrapped = ((next % totalSlides) + totalSlides) % totalSlides;
      if (!isControlled) setUncontrolledSlide(wrapped);
      onSlideChange?.(wrapped);
    },
    [isControlled, onSlideChange, totalSlides],
  );

  const nextSlide = useCallback(
    () => goTo(currentSlide + 1),
    [goTo, currentSlide],
  );
  const prevSlide = useCallback(
    () => goTo(currentSlide - 1),
    [goTo, currentSlide],
  );

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  }, []);

  const deckActions = useMemo(
    () => ({
      next: nextSlide,
      previous: prevSlide,
      fullscreen: toggleFullscreen,
      notes: () => setShowNotes((visible) => !visible),
    }),
    [nextSlide, prevSlide, toggleFullscreen],
  );

  // `SLIDE_DECK_HOTKEYS` replaces a hand-rolled `window` keydown switch:
  // registration is declarative, `enabled` stands in for the old
  // `if (!chrome) return` and the notes gate (a disabled binding does not
  // fire and does not preventDefault, but stays visible in devtools), and
  // single-key bindings default to `ignoreInputs` — the old handler stole
  // arrows and space from any focused text field, which this no longer does.
  // `stopPropagation: false` and the per-binding `preventsDefault` keep the
  // wired behaviour identical; `conflictBehavior: 'allow'` reproduces what
  // two `window` listeners did for two mounted decks — both respond, neither
  // warns. One tightening is real: the old switch read `e.key`, so Shift+F
  // and Shift+N fired; the bindings are plain F and N, which is what a
  // presenter means.
  useHotkeys(
    SLIDE_DECK_HOTKEYS.map((binding) => ({
      hotkey: binding.hotkey,
      callback: () => deckActions[binding.action](),
      options: {
        enabled: chrome && (binding.requires !== 'notes' || deckHasNotes),
        preventDefault: binding.preventsDefault !== false,
        stopPropagation: false,
        conflictBehavior: 'allow',
        meta: { name: binding.label, description: binding.description },
      },
    })),
  );

  useEffect(() => {
    if (!isPlaying || autoPlayInterval <= 0) return;
    const timer = setInterval(() => {
      nextSlide();
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [isPlaying, autoPlayInterval, nextSlide]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        maxWidth: isFullscreen ? '100vw' : '1000px',
        margin: '0 auto',
        border: '3px solid var(--ds-border-strong)',
        boxShadow: isFullscreen ? 'none' : '8px 8px 0px 0px var(--ds-shadow-color)',
        backgroundColor: 'var(--ds-surface-base)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Slide viewport */}
      <div
        style={{
          width: '100%',
          aspectRatio: isFullscreen ? 'auto' : (aspectRatio === '16:9' ? '16 / 9' : '4 / 3'),
          flex: isFullscreen ? 1 : 'none',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {slideList[currentSlide]}
      </div>

      {/* Control bar — the presenter affordances, off when `chrome` is false. */}
      {chrome && (
        <div
        style={{
          padding: '1rem 1.5rem',
          borderTop: '2px solid var(--ds-border-strong)',
          backgroundColor: 'var(--ds-surface-base)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'var(--font-ibm-plex-mono, "IBM Plex Mono"), monospace',
        }}
      >
        {/* Slide Counter */}
        <div style={{ color: 'var(--ds-accent-secondary)', fontWeight: 700, fontSize: '0.9rem' }}>
          SLIDE {String(currentSlide + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Button onClick={prevSlide} style={{ padding: '0.4rem 0.8rem' }}>
            <ChevronLeft size={16} /> PREV
          </Button>

          {autoPlayInterval > 0 && (
            <Button
              onClick={() => setIsPlaying(!isPlaying)}
              aria-pressed={isPlaying}
              aria-label={isPlaying ? 'Pause autoplay' : 'Start autoplay'}
              style={{ padding: '0.4rem 0.8rem' }}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </Button>
          )}

          <Button onClick={nextSlide} style={{ padding: '0.4rem 0.8rem' }}>
            NEXT <ChevronRight size={16} />
          </Button>

          {deckHasNotes && (
            <Button
              onClick={() => setShowNotes((visible) => !visible)}
              aria-pressed={showNotes}
              aria-label={showNotes ? 'Hide speaker notes' : 'Show speaker notes'}
              title="Speaker notes (N)"
              style={{ padding: '0.4rem 0.8rem' }}
            >
              <FileText size={16} />
            </Button>
          )}

          <Button
            onClick={toggleFullscreen}
            aria-pressed={isFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            style={{ padding: '0.4rem 0.8rem' }}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </Button>
        </div>
      </div>
      )}

      {/*
        Presenter notes. Below the control bar rather than over the slide, so
        that a deck mirrored to a projector shows the audience the slide and
        nothing else — the notes are outside the frame the viewport clips.
      */}
      {showNotes && (
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '2px solid var(--ds-border-strong)',
            backgroundColor: 'var(--ds-surface-raised)',
            fontFamily: 'var(--font-ibm-plex-mono, "IBM Plex Mono"), monospace',
            fontSize: '0.85rem',
            lineHeight: 1.6,
            color: 'var(--ds-text-primary)',
            whiteSpace: 'pre-wrap',
          }}
        >
          <div
            style={{
              fontWeight: 700,
              textTransform: 'uppercase',
              fontSize: '0.7rem',
              letterSpacing: '0.08em',
              color: 'var(--ds-accent-secondary)',
              marginBottom: '0.5rem',
            }}
          >
            [ Speaker notes ]
          </div>
          {currentNotes ?? 'No notes on this slide.'}
        </div>
      )}
    </div>
  );
};
