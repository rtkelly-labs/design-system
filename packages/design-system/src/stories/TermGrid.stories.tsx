import type { Meta, StoryObj } from '@storybook/react-vite';
import { TermGrid, Term } from '../components/docs/figures/TermGrid';
import { FigureFrame } from '../components/docs/figures/FigureFrame';

const meta: Meta<typeof TermGrid> = {
  title: 'Docs/Figures/TermGrid',
  component: TermGrid,
  tags: ['autodocs', 'stable'],
  parameters: { docs: { description: { component: 'A glossary of the words a page depends on, each with a plain-language scale. Write `<Term>` children in MDX, or pass `terms` as data.' } } },
};

export default meta;
type Story = StoryObj<typeof TermGrid>;

/** Four terms as MDX children, each with a scale set in mono under the definition. */
export const Default: Story = {
  render: () => (
    <FigureFrame title="COLOUR TERMS">
      <TermGrid label="Colour terms">
        <Term term="Lightness" scale="0 = black, 1 = white">How bright a colour is.</Term>
        <Term term="Chroma" scale="0 = grey">How colourful it is.</Term>
        <Term term="Contrast ratio" scale="1:1 = identical, 21:1 = black on white">How far apart two colours read.</Term>
        <Term term="Delta E" scale="0 = indistinguishable">The distance between two colours.</Term>
      </TermGrid>
    </FigureFrame>
  ),
};

/** Terms as data, for a glossary built from a list. */
export const DataForm: Story = {
  args: {
    label: 'Data terms',
    terms: [
      { term: 'Role', scale: 'text.primary', children: 'A job a colour does.' },
      { term: 'Hue', scale: 'red, blue', children: 'A colour named for how it looks.' },
    ],
  },
  render: (args) => <FigureFrame title="DATA TERMS"><TermGrid {...args} /></FigureFrame>,
};

/** The page level is sketch here, and the grid follows it. */
export const SketchTheme: Story = { ...DataForm, globals: { level: 'sketch' } };
