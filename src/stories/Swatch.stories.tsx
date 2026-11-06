import type { Meta, StoryObj } from '@storybook/react-vite';
import { Swatch, SwatchGroup } from '../components/Swatch';
import { semanticTokens } from '../lib/theme';

/**
 * The package drawing its own palette — the one drawing it definitely owns, and
 * the one it previously could not do outside a story file.
 */
const meta: Meta<typeof Swatch> = {
  title: 'Foundations/Swatch',
  tags: ['autodocs', 'stable'],
  component: Swatch,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof Swatch>;

export const Single: Story = {
  args: { name: 'accent.primary', value: semanticTokens.accent.primary, detail: 'var(--ds-accent-primary)' },
};

/** What a consumer gets for one line: a whole group, titled and laid out. */
export const Group: StoryObj = {
  render: () => <SwatchGroup title="Intent — communicated meaning" entries={semanticTokens.intent} />,
};

export const Dense: StoryObj = {
  render: () => <SwatchGroup title="Surface — elevation" entries={semanticTokens.surface} size="sm" />,
};
