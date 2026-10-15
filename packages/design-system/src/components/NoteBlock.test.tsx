// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { semanticTokens } from '../lib/theme';
import { NoteBlock } from './NoteBlock';

const borderOf = (type: 'note' | 'tip' | 'warning' | 'danger') => {
  const { container } = render(<NoteBlock type={type}>x</NoteBlock>);
  return (container.firstElementChild as HTMLElement).style.border;
};

describe('NoteBlock type names match their intents', () => {
  it('warning is intent.warning and danger is intent.danger', () => {
    expect(borderOf('warning')).toContain(semanticTokens.intent.warning);
    expect(borderOf('danger')).toContain(semanticTokens.intent.danger);
  });
});
