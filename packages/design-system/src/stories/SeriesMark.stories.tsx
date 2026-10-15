import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SeriesLegend, SeriesMark } from '../components/SeriesMark';
import type { SeriesLegendItem } from '../components/SeriesMark';
import { Badge } from '../components/Badge';

const meta: Meta<typeof SeriesMark> = {
  title: 'Components/Content/SeriesMark',
  component: SeriesMark,
  subcomponents: { SeriesLegend },
  tags: ['autodocs', 'stable'],
  argTypes: {
    series: { control: { type: 'inline-radio' }, options: [1, 2, 3, 4, 5, 6], description: 'Which series member, 1 to 6.' },
    swatch: { description: 'Draw the colour chip. On by default.' },
    letter: { description: 'Replace the letter, when the series already has a code the reader sees elsewhere.' },
  },
};

export default meta;
type Story = StoryObj<typeof SeriesMark>;

const ITEMS: readonly SeriesLegendItem[] = [
  { label: 'Work', series: 1 },
  { label: 'Home', series: 2 },
  { label: 'Family', series: 3 },
  { label: 'Fitness', series: 4 },
  { label: 'Travel', series: 5 },
  { label: 'Team', series: 6 },
];

/**
 * What a preview does to turn the `patterns` preference on: an ancestor carries
 * `data-a11y-cvd="patterns"`. On a real page the attribute is on the document,
 * set by `getA11yInitScript()` or `A11yPreferencesProvider`.
 */
function PatternsOn({ children }: { children: ReactNode }) {
  return <div data-a11y-cvd="patterns">{children}</div>;
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-2 border-edge-strong bg-surface-raised p-4 font-mono text-sm text-content-primary">
      <h4 className="m-0 mb-3 text-xs font-bold uppercase text-content-muted">{title}</h4>
      {children}
    </section>
  );
}

/**
 * One mark: the colour chip, with the shape and letter in the markup and
 * hidden — the default for every reader. Change `series` in the controls to
 * walk the six.
 */
export const Default: Story = {
  args: { series: 1 },
};

/**
 * The legend a categorical chart carries: every series' mark beside its name in
 * text. The text is the cue that is always there, and the one WCAG 1.4.1 rests
 * on; the marks add colour.
 */
export const Legend: Story = {
  render: () => (
    <Panel title="Preference off, the default">
      <SeriesLegend items={ITEMS} />
    </Panel>
  ),
};

/**
 * The same legend with `data-a11y-cvd="patterns"` on an ancestor: each mark
 * gains its shape and letter. Nothing re-renders to get here — the glyph is in
 * the markup always and the stylesheet reveals it.
 */
export const WithPatterns: Story = {
  render: () => (
    <PatternsOn>
      <Panel title="Preference on: patterns">
        <SeriesLegend items={ITEMS} />
      </Panel>
    </PatternsOn>
  ),
};

/**
 * Both modes together, the story the visual suite asserts: colour alone above,
 * colour with shape and letter below, and the intent icons on `Badge` that the
 * same preference reveals beside danger and success.
 */
export const BothModes: Story = {
  render: () => (
    <div className="grid gap-4">
      <Panel title="Preference off, the default">
        <SeriesLegend items={ITEMS} />
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge accent="success">HEALTHY</Badge>
          <Badge accent="danger">FAILED</Badge>
        </div>
      </Panel>
      <PatternsOn>
        <Panel title="Preference on: patterns">
          <SeriesLegend items={ITEMS} />
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge accent="success">HEALTHY</Badge>
            <Badge accent="danger">FAILED</Badge>
          </div>
        </Panel>
      </PatternsOn>
    </div>
  ),
};

/**
 * A letter that is not the series' own: a calendar already calls its work
 * calendar `W`, and a second letter beside the first would be two codes for one
 * thing. The shape is the series'; the letter is the caller's. The chip is off
 * where the surrounding row is already the series colour.
 */
export const WithOwnLetter: Story = {
  render: () => (
    <PatternsOn>
      <Panel title="Preference on: patterns">
        <ul className="m-0 flex list-none gap-4 p-0">
          <li className="flex items-center gap-2">
            <SeriesMark series={1} letter="W" /> Work
          </li>
          <li className="flex items-center gap-2">
            <SeriesMark series={2} letter="H" swatch={false} /> Home
          </li>
        </ul>
      </Panel>
    </PatternsOn>
  ),
};
