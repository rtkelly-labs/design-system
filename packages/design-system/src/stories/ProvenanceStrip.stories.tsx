import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProvenanceStrip } from '../components/review/ProvenanceStrip';
import { StatusMark } from '../components/review/StatusMark';
import { BASELINE_COMMIT } from './review/fixtures';

const meta: Meta<typeof ProvenanceStrip> = {
  title: 'Components/Reports/ProvenanceStrip',
  component: ProvenanceStrip,
  tags: ['autodocs', 'experimental'],
  parameters: {
    docs: {
      description: {
        component:
          'Where a result came from — subject, baseline role and commit, digest, trust, comparator — as a ruled grid of label/value cells. A fact that was not recorded is shown as a `StatusMark` rather than left out.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProvenanceStrip>;

/** A merge-base comparison against a CI artifact that has no promotion record. */
export const Default: Story = {
  args: {
    items: [
      { label: 'Subject', value: 'Parquet.SourceGenerator', note: 'candidate · PR head' },
      { label: 'Baseline role', value: 'merge-base', note: 'what did this change?' },
      { label: 'Baseline commit', value: BASELINE_COMMIT },
      { label: 'Trust', value: <StatusMark vocabulary="trust" status="candidate" />, note: 'no promotion record, so it cannot gate' },
      { label: 'Manifest digest', value: <StatusMark vocabulary="evidence" status="unavailable" label="not recorded" /> },
      { label: 'Comparator', value: 'text.normalized@1' },
    ],
  },
};

/** A trusted baseline, with every identity recorded. */
export const Trusted: Story = {
  args: {
    items: [
      { label: 'Baseline role', value: 'approved-main', note: 'how does this differ from what was accepted?' },
      { label: 'Trust', value: <StatusMark vocabulary="trust" status="trusted" /> },
      { label: 'Manifest digest', value: 'sha256:9f2c4e71d0a8b3c6e5f4a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f6' },
    ],
  },
};

/** The strip on `sketch`. */
export const SketchTheme: Story = { ...Default, globals: { level: 'sketch' } };
