import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from '../components/Checkbox';
import { Fieldset, Legend } from '../components/Fieldset';
import type { FieldsetProps } from '../components/Fieldset';
import { Input } from '../components/Input';

function RegionOptions() {
  return (
    <>
      <Checkbox name="region" value="eu" label="Europe" defaultChecked />
      <Checkbox name="region" value="us" label="North America" />
      <Checkbox name="region" value="ap" label="Asia Pacific" />
    </>
  );
}

const meta: Meta<typeof Fieldset> = {
  title: 'Components/Actions & Forms/Fieldset',
  component: Fieldset,
  subcomponents: { Legend },
  tags: ['autodocs', 'stable'],
  args: {
    legend: 'Regions',
  },
  render: (args: FieldsetProps) => (
    <Fieldset {...args}>
      <RegionOptions />
    </Fieldset>
  ),
};

export default meta;
type Story = StoryObj<typeof Fieldset>;

/**
 * A set of checkboxes answering one question — choose many — with the legend
 * as the group's name. Nothing here is radio-specific: each checkbox keeps its
 * own label and its own submission, and the fieldset adds the name, the
 * description and the error for the set.
 */
export const CheckboxSet: Story = {
  args: {
    helperText: 'Where the replicas run',
  },
};

/**
 * A pair of text fields that only mean something together. Each `Input`
 * keeps its own label and error; the fieldset names the pair.
 */
export const DateRange: Story = {
  render: (args: FieldsetProps) => (
    <Fieldset {...args} legend="Maintenance window" helperText="YYYY-MM-DD, UTC, inclusive of both dates">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Starts" defaultValue="2026-10-01" />
        <Input label="Ends" defaultValue="2026-10-03" />
      </div>
    </Fieldset>
  ),
};

/**
 * An error about the set rather than any one control. It describes the
 * fieldset and every control inside it, so it is heard whichever checkbox a
 * screen reader lands on — and it is not pinned to the first one.
 */
export const WithError: Story = {
  args: {
    error: 'Choose at least one region',
  },
};

/**
 * `disabled` on the group. It is the native attribute and the fieldset
 * context Base UI's fields read, so every control inside greys and refuses
 * input without being told individually.
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    helperText: 'Regions are fixed on this plan',
  },
};

/**
 * A `Legend` placed by hand, for a name that is more than a string. It must
 * sit inside the fieldset — its id registers with the enclosing group, and
 * that registration is the association.
 */
export const CustomLegend: Story = {
  render: () => (
    <Fieldset>
      <Legend>
        Notify me about <span className="text-content-primary">main</span>
      </Legend>
      <Checkbox label="Pushes" defaultChecked />
      <Checkbox label="Failed checks" defaultChecked />
      <Checkbox label="Releases" />
    </Fieldset>
  ),
};

/**
 * Every state on one surface — the row the visual suite asserts: the legend,
 * the group description, the group error and the disabled treatment, around
 * both a checkbox set and a pair of inputs.
 */
export const AllStates: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
      <Fieldset legend="With description" helperText="Where the replicas run">
        <RegionOptions />
      </Fieldset>
      <Fieldset legend="Invalid" error="Choose at least one region">
        <Checkbox name="invalid" value="eu" label="Europe" />
        <Checkbox name="invalid" value="us" label="North America" />
      </Fieldset>
      <Fieldset legend="Disabled" disabled>
        <Checkbox label="Disabled, checked" defaultChecked />
        <Checkbox label="Disabled" />
      </Fieldset>
      <Fieldset legend="Maintenance window">
        <Input label="Starts" defaultValue="2026-10-01" />
        <Input label="Ends" defaultValue="2026-10-03" />
      </Fieldset>
    </div>
  ),
};
