import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Glyph } from '../components/Glyph';
import { NERD_GLYPHS, NerdIcon, type NerdIconName } from '../components/NerdIcon';

const meta: Meta<typeof NerdIcon> = {
  title: 'Foundations/NerdIcon',
  component: NerdIcon,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof NerdIcon>;

export const DeveloperGlyphs: Story = {
  render: () => {
    const devIcons: NerdIconName[] = [
      'git-branch',
      'git-commit',
      'git-merge',
      'git-pull-request',
      'docker',
      'kubernetes',
      'terminal',
      'database',
      'server',
      'code',
      'bug',
      'cpu',
      'ram',
    ];

    return (
      <div className="p-8 space-y-6 max-w-2xl font-mono">
        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-accent-primary">
          [ NERD FONTS DEVELOPER GLYPHS ]
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {devIcons.map((name) => (
            <div
              key={name}
              className="flex items-center gap-2.5 p-2.5 border-2 border-edge-strong bg-surface-raised"
            >
              <NerdIcon name={name} accent="primary" size="lg" />
              <span className="text-xs text-content-primary truncate">{name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

export const BracketedInUI: Story = {
  render: () => (
    <div className="p-8 space-y-6 max-w-2xl font-mono">
      <h3 className="font-display text-sm font-bold uppercase tracking-wider text-accent-primary">
        [ BRACKETED UI INTEGRATION ]
      </h3>

      <div className="flex flex-wrap items-center gap-3">
        <Button bracketed>
          <NerdIcon name="terminal" accent="primary" className="mr-1.5" />
          DEPLOY REPLICA
        </Button>
        <Button variant="tertiary" bracketed>
          <NerdIcon name="trash" accent="danger" className="mr-1.5" />
          PURGE POD
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge accent="primary">
          <NerdIcon name="git-branch" className="mr-1" />
          feat/nerd-fonts-iconography
        </Badge>
        <Badge accent="info">
          <NerdIcon name="docker" className="mr-1" />
          v1.28.4-edge
        </Badge>
        <Badge accent="success">
          <NerdIcon name="check" className="mr-1" />
          HEALTHY
        </Badge>
      </div>
    </div>
  ),
};

export const TableSortDemo: Story = {
  render: () => (
    <div className="p-8 max-w-xl font-mono">
      <h3 className="font-display text-sm font-bold uppercase tracking-wider text-accent-primary mb-4">
        [ MONOSPACE TABLE SORT HEADERS ]
      </h3>
      <div className="border-2 border-edge-strong bg-surface-base">
        <div className="flex border-b-2 border-edge-strong bg-surface-raised text-xs font-bold uppercase">
          <div className="px-4 py-2.5 flex-1 border-r-2 border-edge-strong flex items-center justify-between">
            <span>[ REPOSITORY ]</span>
            <NerdIcon name="sort" accent="muted" size="sm" />
          </div>
          <div className="px-4 py-2.5 w-32 border-r-2 border-edge-strong flex items-center justify-between text-accent-primary">
            <span>[ COMMITS ]</span>
            <NerdIcon name="sort-asc" accent="primary" size="sm" />
          </div>
          <div className="px-4 py-2.5 w-32 flex items-center justify-between">
            <span>[ LATENCY ]</span>
            <NerdIcon name="sort" accent="muted" size="sm" />
          </div>
        </div>
        <div className="divide-y-2 divide-edge-strong text-xs">
          <div className="flex px-4 py-2 hover:bg-surface-raised transition-colors">
            <span className="flex-1">personal/design-system</span>
            <span className="w-32">42</span>
            <span className="w-32">12ms</span>
          </div>
          <div className="flex px-4 py-2 hover:bg-surface-raised transition-colors">
            <span className="flex-1">personal/ryankelly.dev</span>
            <span className="w-32">99</span>
            <span className="w-32">18ms</span>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const TypographicAsciiMix: Story = {
  render: () => (
    <div className="p-8 space-y-4 font-mono">
      <h3 className="font-display text-sm font-bold uppercase tracking-wider text-accent-primary">
        [ UNIFIED GLYPH HYBRID MIX ]
      </h3>
      <div className="flex flex-wrap items-center gap-3">
        <Glyph bracketed accent="primary">-&gt;</Glyph>
        <Glyph bracketed accent="secondary">&lt;=</Glyph>
        <Glyph bracketed accent="tertiary">::</Glyph>
        <Glyph bracketed accent="success">[+]</Glyph>
        <Glyph bracketed accent="danger">[x]</Glyph>
        <Glyph name="git-branch" bracketed accent="primary" />
        <Glyph name="terminal" bracketed accent="secondary" />
        <Glyph name="database" bracketed accent="info" />
      </div>
    </div>
  ),
};
