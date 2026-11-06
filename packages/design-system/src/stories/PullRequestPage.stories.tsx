import type { Meta, StoryObj } from '@storybook/react-vite';
import { PullRequestPage } from '../components/review/PullRequestPage';
import { DEFAULT_PULL_REQUEST } from '../components/review/samples';
import { ThemeProvider } from '../components/ThemeProvider';

const meta: Meta<typeof PullRequestPage> = {
  title: 'SaaS/PullRequest',
  component: PullRequestPage,
  tags: ['autodocs', 'experimental'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A pull request under review: state and branches, a conversation led by a comparison tool’s verdict, reviewers and labels, checks as outcome marks, and changed files with review comments pinned under their lines. Static: section links are anchors and nothing posts.',
      },
    },
  },
  args: { pullRequest: DEFAULT_PULL_REQUEST },
};

export default meta;
type Story = StoryObj<typeof PullRequestPage>;

/** An open pull request with changes requested, a pending check and inline comments. */
export const Default: Story = {};

/** The same change merged: every check passed and both reviewers approved. */
export const Merged: Story = {
  args: {
    pullRequest: {
      ...DEFAULT_PULL_REQUEST,
      state: 'merged',
      reviewers: [
        { name: 'kestrel', state: 'approved' },
        { name: 'marlow', state: 'approved' },
      ],
      checks: DEFAULT_PULL_REQUEST.checks.map((check) => ({ ...check, status: 'pass', label: undefined })),
      verdict: { outcome: 'pass', title: 'complexity-budget@3 held: +18 against a budget of +20.', context: 'Diffra · derived outputs against merge base 216f6fc.' },
    },
  },
};

/** The light level, pinned. */
export const SketchTheme: Story = {
  render: (args) => (
    <ThemeProvider defaultLevel="sketch" scoped persist={false} followSystem={false} className="min-h-screen bg-surface-base text-content-primary">
      <PullRequestPage {...args} />
    </ThemeProvider>
  ),
};
