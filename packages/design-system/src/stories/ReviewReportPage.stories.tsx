import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReviewReportPage } from '../components/review/ReviewReportPage';
import { DEFAULT_REVIEW_REPORT } from '../components/review/samples';
import { ThemeProvider } from '../components/ThemeProvider';

const meta: Meta<typeof ReviewReportPage> = {
  title: 'SaaS/ReviewReport',
  component: ReviewReportPage,
  tags: ['autodocs', 'experimental'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A whole review report, the document a comparison tool such as Diffra emits: verdict, provenance, figures, numeric deltas, records by stable identity, caveats, then every changed file. Static-safe, so the same page renders in an app and in a `ds-report` file.',
      },
    },
  },
  args: { report: DEFAULT_REVIEW_REPORT },
};

export default meta;
type Story = StoryObj<typeof ReviewReportPage>;

/** The sample comparison on `midnight`: a Delta with no policy applied, so the verdict is `none`. */
export const Default: Story = {};

/** The same comparison after a policy ran and failed two complexity budgets. */
export const PolicyFailed: Story = {
  args: {
    report: {
      ...DEFAULT_REVIEW_REPORT,
      meta: [
        { label: 'Comparator', value: 'complexity.v1' },
        { label: 'Delta', value: 'changed' },
        { label: 'Policy', value: 'complexity-budget@3' },
      ],
      outcome: 'fail',
      verdict: 'Two complexity budgets exceeded.',
      verdictContext: 'Legacy +18 and the main generator +18, against a budget of +10 per assembly.',
    },
  },
};

/** The light level, pinned, where the diff grounds are the thing to check. */
export const SketchTheme: Story = {
  render: (args) => (
    <ThemeProvider defaultLevel="sketch" scoped persist={false} followSystem={false} className="min-h-screen bg-surface-base text-content-primary">
      <ReviewReportPage {...args} />
    </ThemeProvider>
  ),
};
