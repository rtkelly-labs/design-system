import React from 'react';
import { Zap } from 'lucide-react';

export interface TLDRProps {
  children: React.ReactNode;
}

export const TLDR: React.FC<TLDRProps> = ({ children }) => {
  return (
    <div
      style={{
        margin: '2rem 0',
        padding: '1.5rem',
        border: '2px solid var(--ds-accent-secondary)',
        backgroundColor: 'var(--ds-surface-base)',
        boxShadow: '6px 6px 0px 0px var(--ds-accent-secondary)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Zap size={20} color="var(--ds-accent-secondary)" />
        <span
          style={{
            fontFamily: 'var(--font-space-grotesk, "Space Grotesk"), sans-serif',
            fontWeight: 800,
            fontSize: '1rem',
            textTransform: 'uppercase',
            color: 'var(--ds-accent-secondary)',
          }}
        >
          [ TL;DR ]
        </span>
      </div>
      <div
        style={{
          fontFamily: 'var(--font-inter, "Inter"), sans-serif',
          fontSize: '1rem',
          fontWeight: 500,
          color: 'var(--ds-text-primary)',
          lineHeight: 1.6,
        }}
      >
        {children}
      </div>
    </div>
  );
};
