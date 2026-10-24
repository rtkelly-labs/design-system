import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChangeIndex } from '../components/review/ChangeIndex';
import { CHANGE_GROUPS } from './review/fixtures';

const meta: Meta<typeof ChangeIndex> = {
  title: 'Components/Reports/ChangeIndex',
  component: ChangeIndex,
  tags: ['autodocs', 'experimental'],
  parameters: {
    docs: {
      description: {
        component:
          'The files a change touched, grouped, each group totalled before its files, each file with a count and a bar on one shared scale and a link to its diff. Plain anchors, so it works in a report with no script.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChangeIndex>;

/** Seven derived files in three groups. */
export const Default: Story = { args: { label: 'Derived files', groups: CHANGE_GROUPS } };

/** The designed zero case. */
export const Empty: Story = {
  args: { groups: [{ title: 'Derived files', files: [] }], emptyText: 'Unchanged. 7 derived files compared against 216f6fc.' },
};

/** The index on `sketch`. */
export const SketchTheme: Story = { ...Default, globals: { level: 'sketch' } };
