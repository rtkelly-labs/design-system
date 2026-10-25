import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusMark, type StatusMarkProps } from '../components/review/StatusMark';
import { STATUS_APPEARANCE, type StatusVocabulary } from '../components/review/vocabulary';

const meta: Meta<typeof StatusMark> = {
  title: 'Components/Reports/StatusMark',
  component: StatusMark,
  tags: ['autodocs', 'experimental'],
  parameters: {
    docs: {
      description: {
        component:
          'One status from a review’s closed vocabularies — an Assessment outcome, a Delta or Evidence status, or a Baseline’s trust — as a fixed glyph and word. The colour repeats the word and never replaces it, and of the comparison words only `invalid` takes an intent colour.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusMark>;

/** A single outcome, the form a table cell or a summary row carries. */
export const Default: Story = { args: { vocabulary: 'outcome', status: 'needs-review' } };

function Vocabulary({ name }: { name: StatusVocabulary }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-xs font-bold uppercase tracking-wider text-content-muted">{name}</span>
      <div className="flex flex-wrap gap-2">
        {Object.keys(STATUS_APPEARANCE[name]).map((status) => (
          <StatusMark key={status} {...({ vocabulary: name, status } as StatusMarkProps)} />
        ))}
      </div>
    </div>
  );
}

/** Every word in all four vocabularies. States that share a colour differ by glyph and word. */
export const AllVocabularies: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      <Vocabulary name="outcome" />
      <Vocabulary name="delta" />
      <Vocabulary name="evidence" />
      <Vocabulary name="trust" />
    </div>
  ),
};

/** The same set on `sketch`, where the dashed could-not-tell marks are the ones to check. */
export const SketchTheme: Story = { ...AllVocabularies, globals: { level: 'sketch' } };
