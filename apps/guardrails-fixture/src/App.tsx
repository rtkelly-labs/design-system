import React from 'react';
import { Button, Card, Badge, StatCard } from '@rtkelly-labs/design-system';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface-base text-primary p-6 space-y-6">
      <header className="border-b border-subtle pb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold font-display uppercase tracking-wide">
          [ GUARDRAILS TEST APPLICATION ]
        </h1>
        <Badge accent="info">VERIFIED</Badge>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Compliance Score" value="100%" subtitle="0 negative guardrail hits" />
        <StatCard title="Tokens Grounded" value="--ds-*" subtitle="Dual-theme midnight & sketch" />
        <StatCard title="Border Radius" value="0px" subtitle="Razor sharp brutalist contract" />
      </div>

      <Card variant="panel" className="p-4 space-y-4 border border-default">
        <h2 className="text-base font-bold font-display">Operational Surface</h2>
        <p className="text-sm text-secondary">
          All styles resolve cleanly through design-system semantic role tokens.
        </p>
        <div className="flex items-center gap-3">
          <Button variant="primary">EXECUTE</Button>
          <Button variant="secondary">DIFF</Button>
        </div>
      </Card>
    </div>
  );
};
