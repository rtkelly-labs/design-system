import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SlideDeck } from './SlideDeck';
import { Slide } from './Slide';

/**
 * `SlideDeck` had no tests, and could not usefully have had any: it owned the
 * slide index in state and advanced it on a timer, so the only way to observe
 * slide 3 was to press a button twice. Every assertion below depends on the
 * index being addressable — which is the point of the change, stated as tests.
 */

const deck = (props: Record<string, unknown> = {}) =>
  render(
    <SlideDeck {...props}>
      <div>ALPHA</div>
      <div>BETA</div>
      <div>GAMMA</div>
    </SlideDeck>,
  );

const shown = () => {
  for (const label of ['ALPHA', 'BETA', 'GAMMA']) {
    if (screen.queryByText(label)) return label;
  }
  return null;
};

describe('SlideDeck — uncontrolled (the existing behaviour)', () => {
  it('starts on the first slide', () => {
    deck();
    expect(shown()).toBe('ALPHA');
  });

  it('advances and wraps at the end', () => {
    deck();
    fireEvent.click(screen.getByText(/NEXT/));
    expect(shown()).toBe('BETA');
    fireEvent.click(screen.getByText(/NEXT/));
    expect(shown()).toBe('GAMMA');
    fireEvent.click(screen.getByText(/NEXT/));
    expect(shown()).toBe('ALPHA');
  });

  it('goes back, wrapping to the last slide from the first', () => {
    deck();
    fireEvent.click(screen.getByText(/PREV/));
    expect(shown()).toBe('GAMMA');
  });

  it('still reports where it moved to', () => {
    const onSlideChange = vi.fn();
    deck({ onSlideChange });
    fireEvent.click(screen.getByText(/NEXT/));
    expect(onSlideChange).toHaveBeenCalledWith(1);
  });

  it('is driven by the arrow keys', () => {
    deck();
    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    expect(shown()).toBe('BETA');
    fireEvent.keyDown(document.body, { key: 'ArrowLeft' });
    expect(shown()).toBe('ALPHA');
  });
});

describe('SlideDeck — controlled', () => {
  it('renders the slide it is given, without any navigation', () => {
    // The assertion that was previously impossible: slide 2, directly.
    deck({ slide: 2 });
    expect(shown()).toBe('GAMMA');
  });

  it('does not move itself — the caller owns the index', () => {
    const onSlideChange = vi.fn();
    deck({ slide: 0, onSlideChange });

    fireEvent.click(screen.getByText(/NEXT/));

    expect(onSlideChange).toHaveBeenCalledWith(1);
    expect(shown()).toBe('ALPHA');
  });

  it('follows the prop when it changes', () => {
    const { rerender } = deck({ slide: 0 });
    expect(shown()).toBe('ALPHA');
    rerender(
      <SlideDeck slide={1}>
        <div>ALPHA</div>
        <div>BETA</div>
        <div>GAMMA</div>
      </SlideDeck>,
    );
    expect(shown()).toBe('BETA');
  });

  it('reports a wrapped index rather than an out-of-range one', () => {
    const onSlideChange = vi.fn();
    deck({ slide: 2, onSlideChange });
    fireEvent.click(screen.getByText(/NEXT/));
    expect(onSlideChange).toHaveBeenCalledWith(0);
  });
});

describe('SlideDeck — chrome', () => {
  it('renders the control bar by default', () => {
    deck();
    expect(screen.queryByText(/NEXT/)).not.toBeNull();
    expect(screen.queryByText(/SLIDE 01/)).not.toBeNull();
  });

  it('drops the control bar when chrome is off, keeping the slide', () => {
    deck({ chrome: false, slide: 1 });
    expect(shown()).toBe('BETA');
    expect(screen.queryByText(/NEXT/)).toBeNull();
    expect(screen.queryByText(/SLIDE/)).toBeNull();
  });

  it('leaves arrow keys to a focused text input', () => {
    // The behaviour the hand-rolled `window` switch got wrong: typing an
    // answer into a field must not page the deck behind it.
    const onSlideChange = vi.fn();
    const view = deck({ onSlideChange });
    const input = document.createElement('input');
    view.container.appendChild(input);
    input.focus();

    fireEvent.keyDown(input, { key: 'ArrowRight' });
    expect(onSlideChange).not.toHaveBeenCalled();

    input.blur();
    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    expect(onSlideChange).toHaveBeenCalledWith(1);
  });

  it('stops listening for arrow keys when chrome is off', () => {
    // A deck embedded in a page that owns its own keyboard must not also
    // silently consume the arrow keys.
    const onSlideChange = vi.fn();
    deck({ chrome: false, onSlideChange });
    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    expect(onSlideChange).not.toHaveBeenCalled();
    expect(shown()).toBe('ALPHA');
  });
});

describe('SlideDeck — edges', () => {
  it('survives an empty deck', () => {
    // Previously `prevSlide` sent the index to -1 here, which indexed nothing.
    const onSlideChange = vi.fn();
    render(<SlideDeck onSlideChange={onSlideChange}>{[]}</SlideDeck>);
    fireEvent.click(screen.getByText(/PREV/));
    expect(onSlideChange).not.toHaveBeenCalled();
  });

  it('handles a single-slide deck without moving', () => {
    // Written as an explicit array because `children` is typed
    // `React.ReactElement[]`, so a lone JSX child does not satisfy it even
    // though `React.Children.count` handles one fine. Widening that type is a
    // separate change and not what this issue is about.
    render(<SlideDeck>{[<div key="only">ONLY</div>]}</SlideDeck>);
    fireEvent.click(screen.getByText(/NEXT/));
    expect(screen.queryByText('ONLY')).not.toBeNull();
  });
});

/**
 * `Slide.speakerNotes` was accepted and rendered nowhere (#94). These cover the
 * two halves of making it honest: the notes surface when asked for, and a deck
 * without them is unchanged — the second being the one that could regress a
 * baseline without anyone noticing.
 */
function deckWithNotes() {
  return render(
    <SlideDeck>
      <Slide title="ONE" speakerNotes="Notes for the first slide.">
        <p>First</p>
      </Slide>
      <Slide title="TWO" speakerNotes="Notes for the second slide.">
        <p>Second</p>
      </Slide>
      <Slide title="THREE">
        <p>Third</p>
      </Slide>
    </SlideDeck>,
  );
}

function deckWithoutNotes() {
  return render(
    <SlideDeck>
      <Slide title="ONE">
        <p>First</p>
      </Slide>
      <Slide title="TWO">
        <p>Second</p>
      </Slide>
    </SlideDeck>,
  );
}

const notesToggle = () => screen.queryByLabelText(/speaker notes/i);

describe('SlideDeck presenter notes', () => {
  it('offers no notes control when no slide has notes', () => {
    deckWithoutNotes();
    expect(notesToggle()).toBeNull();
  });

  it('leaves N inert on a deck with no notes', () => {
    const { container } = deckWithoutNotes();
    const before = container.innerHTML;
    fireEvent.keyDown(document.body, { key: 'n' });
    expect(container.innerHTML).toBe(before);
  });

  it('offers the control when some slide has notes, closed to begin with', () => {
    deckWithNotes();
    expect(notesToggle()).not.toBeNull();
    expect(screen.queryByText(/Notes for the first slide/)).toBeNull();
  });

  it('opens and closes on the control', () => {
    deckWithNotes();
    fireEvent.click(notesToggle() as HTMLElement);
    expect(screen.getByText(/Notes for the first slide/)).toBeTruthy();
    fireEvent.click(notesToggle() as HTMLElement);
    expect(screen.queryByText(/Notes for the first slide/)).toBeNull();
  });

  it('opens on N', () => {
    deckWithNotes();
    fireEvent.keyDown(document.body, { key: 'n' });
    expect(screen.getByText(/Notes for the first slide/)).toBeTruthy();
  });

  it('follows the current slide', () => {
    deckWithNotes();
    fireEvent.keyDown(document.body, { key: 'n' });
    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    expect(screen.getByText(/Notes for the second slide/)).toBeTruthy();
    expect(screen.queryByText(/Notes for the first slide/)).toBeNull();
  });

  it('says so on a slide with no notes rather than closing the panel', () => {
    deckWithNotes();
    fireEvent.keyDown(document.body, { key: 'n' });
    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    expect(screen.getByText(/No notes on this slide/)).toBeTruthy();
  });

  it('treats whitespace-only notes as no notes', () => {
    // Two slides because `children` is typed as an array — a one-slide deck is
    // a type error, which is deliberate: the deck indexes its children.
    render(
      <SlideDeck>
        <Slide title="ONE" speakerNotes="   ">
          <p>First</p>
        </Slide>
        <Slide title="TWO">
          <p>Second</p>
        </Slide>
      </SlideDeck>,
    );
    expect(notesToggle()).toBeNull();
  });
});
