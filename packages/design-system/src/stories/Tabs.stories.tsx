import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs, TabsList, TabsPanel, TabsTab } from '../components/Tabs';

/**
 * Nothing on this page is about code, a language or a package manager, and
 * that is deliberate: the tablist was extracted from `CodeTabs`, and the only
 * way to show it is general is to document it somewhere else entirely.
 */
const meta: Meta<typeof Tabs> = {
  title: 'Components/Navigation/Tabs',
  component: Tabs,
  tags: ['autodocs', 'stable'],
  argTypes: {
    variant: { control: 'select', options: ['merged', 'underline', 'segmented'] },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    font: { control: 'inline-radio', options: ['sans', 'mono'] },
    accent: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'quiet', 'info', 'success', 'warning', 'danger'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

const panel = 'border-2 border-t-0 border-edge-strong bg-surface-base p-5 font-sans text-sm text-content-secondary';

const settings = (
  <>
    <TabsList label="Account settings">
      <TabsTab value="profile">Profile</TabsTab>
      <TabsTab value="notifications">Notifications</TabsTab>
      <TabsTab value="billing">Billing</TabsTab>
    </TabsList>
    <TabsPanel value="profile" className={panel}>
      Display name, pronouns and the avatar everyone else sees.
    </TabsPanel>
    <TabsPanel value="notifications" className={panel}>
      Which events send an email, and how often the digest goes out.
    </TabsPanel>
    <TabsPanel value="billing" className={panel}>
      Plan, payment method and the invoices already issued.
    </TabsPanel>
  </>
);

/**
 * The default shape: a settings dialog's three sections, selected by clicking
 * or by arrowing along the strip. Reach for tabs when the panels are
 * alternative views of one thing — if selecting one should change the URL, it
 * is navigation and wants links.
 */
export const Default: Story = {
  args: { defaultValue: 'profile', children: settings },
};

/**
 * The quietest treatment, and the one to use when the tabs sit inside
 * something already bordered: a 4px accent rule on the seam instead of a tab
 * shape. `segmented` is the third, and it adds a caption slot for a title.
 */
export const Underline: Story = {
  args: {
    defaultValue: 'notifications',
    variant: 'underline',
    accent: 'secondary',
    children: settings,
  },
};

/**
 * A vertical strip, for a settings surface with more sections than fit across
 * the top. The orientation decides the keys as well as the layout: `ArrowUp`
 * and `ArrowDown` traverse this one, and the horizontal arrows are inert.
 */
export const Vertical: Story = {
  args: {
    defaultValue: 'members',
    orientation: 'vertical',
    variant: 'underline',
    accent: 'tertiary',
    children: (
      <>
        <TabsList label="Workspace">
          <TabsTab value="members">Members</TabsTab>
          <TabsTab value="roles">Roles</TabsTab>
          <TabsTab value="audit">Audit log</TabsTab>
          <TabsTab value="retention">Retention</TabsTab>
        </TabsList>
        <TabsPanel value="members" className="border-2 border-l-0 border-edge-strong bg-surface-base p-5 font-sans text-sm text-content-secondary">
          Twelve people, two of them pending an invitation.
        </TabsPanel>
        <TabsPanel value="roles" className="border-2 border-l-0 border-edge-strong bg-surface-base p-5 font-sans text-sm text-content-secondary">
          Owner, maintainer and reader, and what each one may delete.
        </TabsPanel>
        <TabsPanel value="audit" className="border-2 border-l-0 border-edge-strong bg-surface-base p-5 font-sans text-sm text-content-secondary">
          Every privileged action, with the actor and the hour it happened.
        </TabsPanel>
        <TabsPanel value="retention" className="border-2 border-l-0 border-edge-strong bg-surface-base p-5 font-sans text-sm text-content-secondary">
          How long a deleted record stays recoverable before it is gone.
        </TabsPanel>
      </>
    ),
  },
};

/**
 * Controlled selection, for when something outside the strip has to know or
 * decide: a wizard that refuses to move on until a step is valid, a set shared
 * between two places on a page. Pass `value` and `onValueChange` together —
 * `value` alone renders a strip that never moves.
 */
export const Controlled: Story = {
  render: function ControlledTabs() {
    const [value, setValue] = useState('week');
    return (
      <div className="flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-widest text-content-muted">
          Range: {value}
        </p>
        <Tabs value={value} onValueChange={setValue} variant="segmented" accent="info">
          <TabsList label="Reporting range" caption="Deployments">
            <TabsTab value="day">Day</TabsTab>
            <TabsTab value="week">Week</TabsTab>
            <TabsTab value="quarter">Quarter</TabsTab>
          </TabsList>
          <TabsPanel value="day" className={panel}>
            Four deployments, one rolled back within the hour.
          </TabsPanel>
          <TabsPanel value="week" className={panel}>
            Twenty-six deployments across nine services.
          </TabsPanel>
          <TabsPanel value="quarter" className={panel}>
            Three hundred and eleven deployments, and two incidents.
          </TabsPanel>
        </Tabs>
      </div>
    );
  },
};

/**
 * Technical / code-oriented tab styling with `font="mono"`, retaining monospace
 * and uppercase tracking for package managers or developer toolbars.
 */
export const Monospace: Story = {
  args: {
    defaultValue: 'profile',
    font: 'mono',
    children: settings,
  },
};

/**
 * Labels as written, for filenames and other identifiers where case means
 * something: `transform="none"` turns off the house all-caps for the whole set.
 */
export const CasePreserved: Story = {
  args: { defaultValue: 'readme', variant: 'underline', transform: 'none' },
  render: (args) => (
    <Tabs {...args}>
      <TabsList label="Project files">
        <TabsTab value="readme">README.md</TabsTab>
        <TabsTab value="config">tsconfig.json</TabsTab>
        <TabsTab value="app">App.tsx</TabsTab>
      </TabsList>
      <TabsPanel value="readme" className={panel}>
        The first file anyone opens.
      </TabsPanel>
      <TabsPanel value="config" className={panel}>
        Compiler options, and the paths they resolve.
      </TabsPanel>
      <TabsPanel value="app" className={panel}>
        The root component.
      </TabsPanel>
    </Tabs>
  ),
};

/**
 * An editor's open files: `onClose` makes a tab closable and `dirty` flags
 * unsaved changes. The close control is a real button named "Close <file>",
 * beside the tab rather than inside it. The selected tab's is the next Tab stop
 * after the strip; the rest are reachable by pointer and by name. `Delete` on a
 * focused tab also closes it, and focus moves to the next. Try it: focus a tab
 * and press `Delete`, or Tab to the close button.
 */
export const ClosableAndDirty: Story = {
  render: function ClosableTabs() {
    const [files, setFiles] = useState([
      { id: 'paginate.ts', dirty: true },
      { id: 'math.ts', dirty: false },
      { id: 'README.md', dirty: false },
    ]);
    const [active, setActive] = useState('paginate.ts');
    return (
      <Tabs value={active} onValueChange={setActive} variant="underline" transform="none">
        <TabsList label="Open editors">
          {files.map((f) => (
            <TabsTab
              key={f.id}
              value={f.id}
              dirty={f.dirty}
              onClose={() => setFiles((all) => all.filter((x) => x.id !== f.id))}
            >
              {f.id}
            </TabsTab>
          ))}
        </TabsList>
        {files.map((f) => (
          <TabsPanel key={f.id} value={f.id} className={panel}>
            Contents of {f.id}.
          </TabsPanel>
        ))}
      </Tabs>
    );
  },
};
