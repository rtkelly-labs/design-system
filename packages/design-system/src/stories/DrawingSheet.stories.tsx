import type { Meta, StoryObj } from '@storybook/react-vite';
import { MessageSquare } from 'lucide-react';
import { DrawingSheet, SheetSection } from '../components/docs/figures/DrawingSheet';
import { FileChangeTree } from '../components/docs/figures/FileChangeTree';
import { MATH_CHANGESET } from './figures/fixtures';

const meta: Meta<typeof DrawingSheet> = {
  title: 'Docs/Figures/DrawingSheet',
  component: DrawingSheet,
  subcomponents: { SheetSection },
  tags: ['autodocs', 'stable'],
  args: { columns: 4, rows: 3 },
  parameters: { docs: { description: { component: 'An engineering drawing sheet — a hard border with numbered columns and lettered rows — holding `SheetSection`s, each a boxed section with a solid index tab, a heading and an actions slot. Use it for review write-ups where readers need to point at a part of the page ("see B2"). The grid references are decorative and hidden from assistive technology; sections are navigated by their headings.' } } },
};

export default meta;
type Story = StoryObj<typeof DrawingSheet>;

const commentButton = (
  <button type="button" aria-label="Comment on this section" className="flex size-8 items-center justify-center border-2 border-edge-default text-content-secondary hover:bg-surface-raised">
    <MessageSquare aria-hidden="true" className="size-4" />
  </button>
);

/** A review sheet: the changeset as section A, the verification as section B. */
export const ChangeReview: Story = {
  render: (args) => (
    <DrawingSheet {...args}>
      <SheetSection index="A" title="What changed" actions={commentButton}>
        <FileChangeTree nodes={MATH_CHANGESET} />
      </SheetSection>
      <SheetSection index="B" title="How it was checked">
        <p className="m-0 text-content-secondary">All tests pass, the 432-combination snapshot shows no difference, and the bundle copied out on its own renders formulas offline.</p>
      </SheetSection>
    </DrawingSheet>
  ),
};

/** A section stands on its own without the sheet when no grid references are needed. */
export const StandaloneSection: Story = {
  render: () => (
    <SheetSection index="C" title="Open questions">
      <p className="m-0 text-content-secondary">Should block formulas wrap rather than scroll on narrow screens?</p>
    </SheetSection>
  ),
};

/** Rulers and tabs hold their contrast on the sketch surface. */
export const SketchTheme: Story = {
  render: (args) => (
    <DrawingSheet {...args}>
      <SheetSection index="A" title="What changed" actions={commentButton}>
        <FileChangeTree nodes={MATH_CHANGESET} />
      </SheetSection>
    </DrawingSheet>
  ),
  globals: { level: 'sketch' },
};
