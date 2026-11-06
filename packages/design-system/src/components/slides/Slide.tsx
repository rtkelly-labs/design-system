import type React from 'react';

export interface SlideProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  /**
   * Presenter notes for this slide.
   *
   * `Slide` itself never renders them — they are for the presenter, not the
   * audience. `SlideDeck` reads them off its children and shows them in a panel
   * below the frame, toggled with `N` or the notes control, off by default. A
   * slide rendered outside a deck therefore shows nothing, which is correct.
   *
   * Whitespace-only strings count as no notes.
   */
  speakerNotes?: string;
}

export const Slide: React.FC<SlideProps> = ({
  title,
  subtitle,
  children,
}) => {
  return (
    <div data-slot="slide"
      style={{
        width: '100%',
        height: '100%',
        // In a narrow deck the stage is only a floor, so the slide fills it.
        flex: '1 1 auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        // Padding and title step down with the viewport, and reach the authored
        // 3rem / 4rem and 2.5rem from about 740px up.
        padding: 'clamp(1rem, 6.5vw, 3rem) clamp(1rem, 8.5vw, 4rem)',
        backgroundColor: 'var(--ds-surface-base)',
        color: 'var(--ds-text-primary)',
        boxSizing: 'border-box',
      }}
    >
      {/* Slide Header */}
      {title && (
        <div style={{ marginBottom: 'clamp(1rem, 4vw, 2rem)', borderBottom: '2px solid var(--ds-border-strong)', paddingBottom: '1rem' }}>
          <h2
            style={{
              fontFamily: 'var(--ds-font-display)',
              fontSize: 'clamp(1.375rem, 6vw, 2.5rem)',
              overflowWrap: 'anywhere',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              color: 'var(--ds-text-primary)',
              margin: 0,
            }}
          >
            {`[\u00a0${title}\u00a0]`}
          </h2>
          {subtitle && (
            <p
              style={{
                fontFamily: 'var(--ds-font-mono)',
                fontSize: '1rem',
                color: 'var(--ds-accent-primary)',
                marginTop: '0.5rem',
              }}
            >
              &gt; {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Slide Content Body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {children}
      </div>

      {/* Slide Footer Branding */}
      <div
        style={{
          marginTop: 'clamp(1rem, 4vw, 2rem)',
          paddingTop: '1rem',
          borderTop: '2px solid var(--ds-border-strong)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.25rem 1rem',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'var(--ds-font-mono)',
          fontSize: '0.75rem',
          color: 'var(--ds-accent-primary)',
        }}
      >
        <span>// BRUTALIST PRESENTATION ENGINE //</span>
        <span>RYANKELLY.DEV</span>
      </div>
    </div>
  );
};
