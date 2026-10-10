import type { Meta, StoryObj } from '@storybook/react-vite';
import { MessageSquare } from 'lucide-react';
import { IndexedSection } from '../components/docs/figures/IndexedSection';
import { FileChangeTree } from '../components/docs/figures/FileChangeTree';
import { MATH_CHANGESET } from './figures/fixtures';

const meta: Meta<typeof IndexedSection> = {
  title: 'Docs/Figures/IndexedSection',
  component: IndexedSection,
  tags: ['autodocs', 'stable'],
  parameters: {
    docs: {
      description: {
        component:
          'A boxed, referenced section container: a solid high-contrast index tab, a heading, an optional actions slot, and a hard-ruled body. Works on its own, inside articles/RFCs, or nested within a `DrawingSheet`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof IndexedSection>;

const commentButton = (
  <button
    type="button"
    aria-label="Comment on this section"
    className="flex size-8 items-center justify-center border-2 border-edge-default text-content-secondary hover:bg-surface-raised"
  >
    <MessageSquare aria-hidden="true" className="size-4" />
  </button>
);

export const Default: Story = {
  args: {
    index: 'A',
    title: 'What changed',
    actions: commentButton,
    children: <FileChangeTree nodes={MATH_CHANGESET} />,
  },
};

export const Numbered: Story = {
  args: {
    index: '01',
    title: 'Architecture Decision',
    children: (
      <p className="m-0 text-content-secondary">
        We decouple the indexed section primitive from the coordinate grid frame to allow independent composition across docs and review sheets.
      </p>
    ),
  },
};

export const SketchTheme: Story = {
  args: {
    index: '02',
    title: 'Verification',
    actions: commentButton,
    children: (
      <p className="m-0 text-content-secondary">
        Tabs and borders maintain contrast and alignment in both dark and light sketch theme levels.
      </p>
    ),
  },
  globals: { level: 'sketch' },
};
