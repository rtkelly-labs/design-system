import type { Meta, StoryObj } from '@storybook/react-vite';
import { semanticTokens } from '../lib/theme';
import { Swatch, SwatchGroup } from '../components/Swatch';
import { Badge } from '../components/Badge';
import { Tag } from '../components/Tag';
import { NoteBlock } from '../components/NoteBlock';

/**
 * Reference for the semantic layer. Components should address these roles
 * rather than the raw brutalist palette, so a retheme is a change to
 * `theme.css` alone.
 */
const meta: Meta = {
  title: 'Foundations/Semantic Tokens',
  tags: ['autodocs', 'stable'],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

export const Roles: Story = {
  render: () => (
    <div style={{ maxWidth: '640px', color: semanticTokens.text.primary }}>
      <SwatchGroup title="Accent — visual hierarchy" entries={semanticTokens.accent} />
      <SwatchGroup title="Intent — communicated meaning" entries={semanticTokens.intent} />
      <SwatchGroup title="Surface — elevation" entries={semanticTokens.surface} />
      <SwatchGroup title="Text — prominence" entries={semanticTokens.text} />
      <SwatchGroup title="Border — rule weight" entries={semanticTokens.border} />
    </div>
  ),
};

export const AppliedToComponents: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '640px' }}>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Badge accent="primary">PRIMARY</Badge>
        <Badge accent="secondary">SECONDARY</Badge>
        <Badge accent="tertiary">TERTIARY</Badge>
        <Badge accent="quiet">QUIET</Badge>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Tag text="info" accent="info" />
        <Tag text="success" accent="success" />
        <Tag text="warning" accent="warning" />
        <Tag text="danger" accent="danger" />
      </div>

      <NoteBlock type="note">Intent roles survive a retheme; hue names do not.</NoteBlock>
      <NoteBlock type="warning">Legacy palette names still resolve identically.</NoteBlock>
    </div>
  ),
};
