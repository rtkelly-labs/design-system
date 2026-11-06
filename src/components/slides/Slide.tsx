import React from 'react';

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
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '3rem 4rem',
        backgroundColor: 'var(--ds-surface-base)',
        color: 'var(--ds-text-primary)',
        boxSizing: 'border-box',
      }}
    >
      {/* Slide Header */}
      {title && (
        <div style={{ marginBottom: '2rem', borderBottom: '2px solid var(--ds-border-strong)', paddingBottom: '1rem' }}>
          <h2
            style={{
              fontFamily: 'var(--font-space-grotesk, "Space Grotesk"), sans-serif',
              fontSize: '2.5rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              color: 'var(--ds-text-primary)',
              margin: 0,
            }}
          >
            [ {title} ]
          </h2>
          {subtitle && (
            <p
              style={{
                fontFamily: 'var(--font-ibm-plex-mono, "IBM Plex Mono"), monospace',
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
          marginTop: '2rem',
          paddingTop: '1rem',
          borderTop: '2px solid var(--ds-border-strong)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'var(--font-ibm-plex-mono, "IBM Plex Mono"), monospace',
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
