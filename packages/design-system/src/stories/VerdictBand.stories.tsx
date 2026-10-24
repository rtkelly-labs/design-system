import type { Meta, StoryObj } from '@storybook/react-vite';
import { VerdictBand } from '../components/review/VerdictBand';

const meta: Meta<typeof VerdictBand> = {
  title: 'Components/Reports/VerdictBand',
  component: VerdictBand,
  tags: ['autodocs', 'experimental'],
  parameters: {
    docs: {
      description: {
        component:
          'The verdict, first: one outcome word, one line saying what it means, one line of context. `none` is a state of its own — a report built from a comparison with no policy applied says it carries no verdict rather than leaving the reader to infer it.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof VerdictBand>;

/** A comparison with no Assessment: the honest state for most generated diffs. */
export const Default: Story = {
  args: {
    outcome: 'none',
    title: 'Delta only. No Assessment was supplied, so nothing below is a pass or a fail.',
    children: 'Run the policy step to get an outcome; the comparison stays the same either way.',
  },
};

/** A failing policy, with the budget that failed named in the context line. */
export const Fail: Story = {
  args: {
    outcome: 'fail',
    title: 'Two complexity budgets exceeded.',
    children: 'complexity-budget@3 · Legacy +18, main generator +18 against a budget of +10.',
  },
};

/** Every outcome stacked, so the five words and their marks can be compared. */
export const AllOutcomes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <VerdictBand outcome="pass" title="All budgets held.">complexity-budget@3</VerdictBand>
      <VerdictBand outcome="warn" title="One budget within 10% of its limit.">complexity-budget@3</VerdictBand>
      <VerdictBand outcome="fail" title="Two complexity budgets exceeded.">complexity-budget@3</VerdictBand>
      <VerdictBand outcome="needs-review" title="A public API member changed.">api-contract@1</VerdictBand>
      <VerdictBand outcome="inconclusive" title="The baseline is a candidate and cannot gate.">trust policy local@1</VerdictBand>
      <VerdictBand outcome="none" title="Delta only. No Assessment was supplied." />
    </div>
  ),
};

/** The stack on `sketch`. */
export const SketchTheme: Story = { ...AllOutcomes, globals: { level: 'sketch' } };
