import type { Meta, StoryObj } from '@storybook/react-vite';
import { DeltaValue } from '../components/review/DeltaValue';
import { KeyedDiff } from '../components/review/KeyedDiff';

const meta: Meta<typeof KeyedDiff> = {
  title: 'Components/Reports/KeyedDiff',
  component: KeyedDiff,
  tags: ['autodocs', 'experimental'],
  parameters: {
    docs: {
      description: {
        component:
          'Records compared by stable identity rather than by line: one row per record, a change word and the measured fields beside it. A method whose signature changed is one row here where a line diff shows a removal and an addition.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof KeyedDiff>;

const lower = 'lower-is-better' as const;

/** Methods matched by symbol id, with complexity and size. */
export const Default: Story = {
  args: {
    caption: 'Methods by stable id · complexity.v1',
    identityLabel: 'Member',
    columns: ['CC ↓', 'SLOC'],
    rows: [
      { identity: 'SchemaComponent.EmitSchema(StringBuilder, TargetClassModel, bool)', change: 'changed', cells: [<DeltaValue key="a" before={3} after={3} />, <DeltaValue key="b" before={23} after={27} />] },
      { identity: 'SchemaComponent.GetFieldCreationExpression(PropertyModel, bool)', change: 'changed', cells: [<DeltaValue key="a" before={5} after={3} direction={lower} />, <DeltaValue key="b" before={46} after={15} />] },
      { identity: 'SchemaComponent.GetFieldConstructorExpression(PropertyModel)', change: 'added', cells: [<DeltaValue key="a" after={8} />, <DeltaValue key="b" after={55} />] },
      { identity: 'TargetParser.ReadColumnOptions(ISymbol)', change: 'changed', cells: [<DeltaValue key="a" before={21} after={24} direction={lower} />, <DeltaValue key="b" before={75} after={78} />] },
      { identity: 'CodeEmitter.EmitSchemaLegacy(StringBuilder)', change: 'removed', cells: [<DeltaValue key="a" before={2} />, <DeltaValue key="b" before={9} />] },
    ],
  },
};

/** A rename, matched across names by a stable key. */
export const Renamed: Story = {
  args: {
    caption: 'Packages by id',
    identityLabel: 'Package',
    columns: ['Size'],
    rows: [
      { identity: 'Diffra.Protocol → Diffra.Core', change: 'renamed', cells: [<DeltaValue key="a" before={312} after={331} unit="kB" direction={lower} />] },
      { identity: 'Diffra.Cli', change: 'unchanged', cells: [<DeltaValue key="a" before={88} after={88} unit="kB" />] },
    ],
  },
};

/** The table on `sketch`. */
export const SketchTheme: Story = { ...Default, globals: { level: 'sketch' } };
