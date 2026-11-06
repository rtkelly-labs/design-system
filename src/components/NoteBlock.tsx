import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { semanticTokens } from '../lib/theme';

export interface NoteBlockProps {
  type?: 'note' | 'tip' | 'warning' | 'important';
  title?: string;
  children: React.ReactNode;
}

export const NoteBlock: React.FC<NoteBlockProps> = ({
  type = 'note',
  title,
  children
}) => {
  const getStyle = () => {
    switch (type) {
      case 'tip':
        return {
          borderColor: semanticTokens.intent.success,
          color: semanticTokens.intent.success,
          icon: CheckCircle2,
          defaultTitle: 'PRO TIP'
        };
      case 'warning':
        return {
          borderColor: semanticTokens.intent.danger,
          color: semanticTokens.intent.danger,
          icon: AlertTriangle,
          defaultTitle: 'WARNING'
        };
      case 'important':
        return {
          borderColor: semanticTokens.intent.warning,
          color: semanticTokens.intent.warning,
          icon: AlertCircle,
          defaultTitle: 'IMPORTANT'
        };
      default:
        return {
          borderColor: semanticTokens.intent.info,
          color: semanticTokens.intent.info,
          icon: Info,
          defaultTitle: 'NOTE'
        };
    }
  };

  const config = getStyle();
  const Icon = config.icon;

  return (
    <div
      style={{
        margin: '1.5rem 0',
        padding: '1.25rem 1.5rem',
        border: `2px solid ${config.borderColor}`,
        backgroundColor: semanticTokens.surface.base,
        boxShadow: `4px 4px 0px 0px ${config.borderColor}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
        <Icon size={18} color={config.color} />
        <span
          style={{
            fontFamily: semanticTokens.font.display,
            fontWeight: 800,
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            color: config.color,
          }}
        >
          [ {title || config.defaultTitle} ]
        </span>
      </div>
      <div style={{ fontFamily: semanticTokens.font.mono, fontSize: '0.875rem', color: semanticTokens.text.primary, lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
};
