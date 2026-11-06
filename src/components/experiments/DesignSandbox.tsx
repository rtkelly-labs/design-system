import React, { useState } from 'react';
import { cn } from '../../lib/recipe';
import { PageTitle } from '../PageTitle';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { NoteBlock } from '../NoteBlock';
import { TLDR } from '../TLDR';
import { Input, Select } from '../Input';
import { StatCard } from '../StatCard';
import { DataTable } from '../DataTable';
import { Modal } from '../Modal';
import { Tag } from '../Tag';
import { PageHeader } from '../PageHeader';
import { SectionContainer } from '../SectionContainer';
import { SlideDeck } from '../slides/SlideDeck';
import { Slide } from '../slides/Slide';
import { LoremIpsumPost } from '../blog/LoremIpsumPost';
import { useTheme } from '../ThemeProvider';
import { LEVELS } from '../../theme/levels';
import { Activity, ShieldCheck, Cpu, DollarSign, Layers, Search, ShoppingBag } from 'lucide-react';

interface UserRecord {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'pending' | 'disabled';
  usage: string;
}

export const DesignSandbox: React.FC = () => {
  /*
   * The strict hook, deliberately. Unlike `DocsHeader` and
   * `AdminDashboardLayout`, this component does not *adapt* to the level — a
   * sandbox whose whole purpose is switching between Levels cannot render
   * meaningfully without a provider, so failing loudly is correct. The
   * distinction is required-versus-adapts; see `useOptionalTheme` for the other
   * side of it.
   */
  const { level, cycleLevel, setLevel, levels } = useTheme();
  const [activeTab, setActiveTab] = useState<'components' | 'saas' | 'ecommerce' | 'slides' | 'post'>('components');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const usersData: UserRecord[] = [
    { id: 'usr-001', name: 'Ryan Kelly', role: 'Architect & Lead', status: 'active', usage: '98.4%' },
    { id: 'usr-002', name: 'Alex Vance', role: 'DevOps Engineer', status: 'active', usage: '74.2%' },
    { id: 'usr-003', name: 'Elena Rostova', role: 'Security Ops', status: 'pending', usage: '12.0%' },
    { id: 'usr-004', name: 'Marcus Chen', role: 'Data Pipeline', status: 'disabled', usage: '0.0%' },
  ];

  const filteredUsers = usersData.filter(
    (u) => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-content-primary font-mono">
      {/* Sandbox Header */}
      <div className="flex justify-between items-start flex-wrap gap-4 mb-8">
        <div>
          <PageTitle subtitle="Universal Brutalist Component Library & Dual-Mode Surface" bracketed>
            DESIGN SYSTEM SURFACE
          </PageTitle>
        </div>

        {/* 3-Way Theme Switcher Controls */}
        <div className="flex gap-2 bg-surface-base p-2 border-2 border-edge-strong">
          {levels.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setLevel(t)}
              aria-pressed={level === t}
              title={LEVELS[t].description}
              className={cn(
                'font-mono font-bold text-xs px-3 py-1.5 border-2 border-edge-strong uppercase transition-all',
                level === t
                  ? 'bg-accent-primary text-content-inverse'
                  : 'bg-transparent text-content-primary hover:bg-surface-raised'
              )}
            >
              {LEVELS[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex gap-2 mb-8 border-b-2 border-edge-strong pb-4 overflow-x-auto">
        <Button onClick={() => setActiveTab('components')} variant={activeTab === 'components' ? 'tertiary' : 'default'} bracketed size="sm">
          COMPONENTS & THEMES
        </Button>
        <Button onClick={() => setActiveTab('saas')} variant={activeTab === 'saas' ? 'tertiary' : 'default'} bracketed size="sm">
          SAAS DASHBOARD
        </Button>
        <Button onClick={() => setActiveTab('ecommerce')} variant={activeTab === 'ecommerce' ? 'tertiary' : 'default'} bracketed size="sm">
          E-COMMERCE SHOWCASE
        </Button>
        <Button onClick={() => setActiveTab('slides')} variant={activeTab === 'slides' ? 'tertiary' : 'default'} bracketed size="sm">
          PRESENTATION DECK
        </Button>
        <Button onClick={() => setActiveTab('post')} variant={activeTab === 'post' ? 'tertiary' : 'default'} bracketed size="sm">
          EDITORIAL BLOG
        </Button>
      </div>

      {/* Tab 1: Core Components & Themes Grid */}
      {activeTab === 'components' && (
        <div className="flex flex-col gap-8">
          {/* Theme Matrix Callout */}
          <TLDR>
            The design system operates across a ladder of {levels.length} first-class levels, darkest to lightest:{' '}
            {levels.map((t, i) => (
              <React.Fragment key={t}>
                {i > 0 && (i === levels.length - 1 ? ', and ' : ', ')}
                <strong>{LEVELS[t].label.toUpperCase()}</strong> ({LEVELS[t].description.replace(/\.$/, '')})
              </React.Fragment>
            ))}
            . Every level declares its own surfaces, inks and accents; components address roles, never levels.
          </TLDR>

          {/* Card & Button Primitives */}
          <Card>
            <h3 className="font-display text-xl font-bold text-accent-primary mb-4">
              [ BADGES & BUTTON VARIANTS ]
            </h3>
            <div className="flex gap-3 flex-wrap mb-6">
              <Badge accent="primary">CYAN BADGE</Badge>
              <Badge accent="tertiary">PINK BADGE</Badge>
              <Badge accent="secondary">YELLOW BADGE</Badge>
              <Badge accent="success">NEON GREEN</Badge>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button variant="primary" bracketed>PRIMARY CYAN</Button>
              <Button variant="tertiary" bracketed>ACCENT PINK</Button>
              <Button variant="secondary" bracketed>WARNING YELLOW</Button>
              <Button onClick={cycleLevel} bracketed>CYCLE LEVEL: {LEVELS[level].label.toUpperCase()}</Button>
            </div>
          </Card>

          {/* Form Primitives */}
          <div className="bg-surface-raised border-2 border-edge-strong p-6">
            <h3 className="font-display text-xl font-bold text-accent-secondary mb-4">
              [ FORM & INPUT PRIMITIVES ]
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input label="System API Key" placeholder="sk-brutalist-..." helperText="Required for cloud SDK initialization" />
              <Select
                label="Environment Tier"
                options={[
                  { label: 'Production (US-East)', value: 'prod-us' },
                  { label: 'Staging (EU-West)', value: 'stage-eu' },
                  { label: 'Local Development Sandbox', value: 'dev-local' },
                ]}
              />
            </div>
            <Button onClick={() => setIsModalOpen(true)} variant="secondary" bracketed size="sm">
              TRIGGER ACTION DIALOG
            </Button>
          </div>

          {/* Callouts */}
          <NoteBlock title="SECURITY COMPLIANCE DIRECTIVE" type="warning">
            All design system primitives strictly enforce dual-mode token remappings. Direct hardcoded hex literals are forbidden to ensure ink-on-paper sketch mode readability.
          </NoteBlock>
        </div>
      )}

      {/* Tab 2: SaaS Dashboard Sample Page */}
      {activeTab === 'saas' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h2 className="font-display text-2xl font-bold text-accent-primary uppercase">
              [ CLOUD OPERATIONS COMMAND CENTER ]
            </h2>
            <div className="w-full sm:w-72">
              <Input
                placeholder="Search cluster workloads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* KPI Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="SYSTEM HEALTH" value="99.98%" change="+0.04%" changeType="positive" icon={Activity} accent="primary" subtitle="42 Nodes Healthy" />
            <StatCard title="COMPUTE LATENCY" value="14.2 ms" change="-3.1 ms" changeType="positive" icon={Cpu} accent="tertiary" subtitle="Sub-20ms SLA MET" />
            <StatCard title="SECURITY AUDIT" value="100%" change="PASSED" changeType="positive" icon={ShieldCheck} accent="success" subtitle="0 Critical Alerts" />
            <StatCard title="EST. CLOUD COST" value="$2,410" change="+$120" changeType="negative" icon={DollarSign} accent="secondary" subtitle="Monthly Budget" />
          </div>

          {/* Data Table */}
          <div className="mt-4">
            <h3 className="font-display text-lg font-bold text-content-primary mb-3 uppercase">
              [ AUTHORIZED WORKSPACE OPERATORS ]
            </h3>
            <DataTable<UserRecord>
              keyExtractor={(r) => r.id}
              columns={[
                { header: 'USER ID', accessor: 'id' },
                { header: 'OPERATOR NAME', accessor: 'name' },
                { header: 'ROLE ASSIGNMENT', accessor: 'role' },
                {
                  header: 'STATUS',
                  accessor: (r) => (
                    <Badge accent={r.status === 'active' ? 'success' : r.status === 'pending' ? 'secondary' : 'tertiary'}>
                      {r.status.toUpperCase()}
                    </Badge>
                  ),
                },
                { header: 'RESOURCE USAGE', accessor: 'usage' },
              ]}
              data={filteredUsers}
            />
          </div>
        </div>
      )}

      {/* Tab 3: E-Commerce & Product Showcase */}
      {activeTab === 'ecommerce' && (
        <div className="flex flex-col gap-6">
          <PageHeader title="BRUTALIST HARDWARE GEAR" subtitle="High-performance developer gear & edge modules" accent="tertiary" icon={ShoppingBag} />

          <div className="flex gap-2 flex-wrap mb-4">
            <Tag text="ALL GEAR" accent="tertiary" />
            <Tag text="EDGE NODES" accent="primary" />
            <Tag text="TERMINAL HARDWARE" accent="secondary" />
            <Tag text="SECURITY KEYS" accent="success" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="NEON TERMINAL DISPLAY" description="Ultra-wide 4K brutalist developer monitor with anti-glare matte coating." filename="hardware_display.spec">
              <div className="mt-4 flex justify-between items-center">
                <span className="font-display text-2xl font-bold text-accent-primary">$899.00</span>
                <Button variant="primary" size="sm" bracketed>ADD TO CART</Button>
              </div>
            </Card>
            <Card title="CYBERDECK MECHANICAL" description="Hotswappable mechanical keyboard with custom laser-engraved keycaps." filename="keyboard_v2.spec">
              <div className="mt-4 flex justify-between items-center">
                <span className="font-display text-2xl font-bold text-accent-tertiary">$349.00</span>
                <Button variant="tertiary" size="sm" bracketed>ADD TO CART</Button>
              </div>
            </Card>
            <Card title="HSM HARDWARE TOKEN" description="FIPS 140-3 Level 4 physical cryptographic key with hardware destruction." filename="hsm_security.spec">
              <div className="mt-4 flex justify-between items-center">
                <span className="font-display text-2xl font-bold text-accent-secondary">$199.00</span>
                <Button variant="secondary" size="sm" bracketed>ADD TO CART</Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 4: Slide Deck Engine */}
      {activeTab === 'slides' && (
        <div className="border-4 border-edge-strong p-6 bg-surface-base">
          <SlideDeck>
            <Slide title="BUILDING SINGULAR DESIGN SURFACES">
              <p className="text-xl text-content-secondary font-mono mb-4">&gt; Dual-Mode Token Remappings across Dark, Dim, and Sketch.</p>
              <Badge accent="primary">REUSABLE ENGINE</Badge>
            </Slide>
            <Slide title="ZERO TOKEN DRIFT PRINCIPLE">
              <p className="text-xl text-content-secondary font-mono mb-4">&gt; Every downstream app imports @rtkelly13/design-system/tailwind-preset.</p>
              <Badge accent="tertiary">SINGLE SOURCE OF TRUTH</Badge>
            </Slide>
          </SlideDeck>
        </div>
      )}

      {/* Tab 5: Editorial & Blog Post */}
      {activeTab === 'post' && (
        <SectionContainer>
          <LoremIpsumPost />
        </SectionContainer>
      )}

      {/* Modal Dialog */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="CONFIRM SYSTEM OVERRIDE">
        <p className="mb-4">Are you sure you want to execute system configuration override on node <strong>cluster-us-east-1</strong>?</p>
        <p className="text-xs font-mono text-content-muted">&gt; This action will trigger a rolling reload of active workload containers.</p>
      </Modal>
    </div>
  );
};
