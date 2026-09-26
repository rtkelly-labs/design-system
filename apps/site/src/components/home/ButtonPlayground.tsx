'use client';

import { useState } from 'react';
import { Button, CodeBlock, Radio, RadioGroup, Select, Switch } from '@/ds';
import type { ButtonVariant } from '@/ds';

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'tertiary', 'inverse'];
const SIZES = [
  { value: 'sm', label: 'sm: dense rows' },
  { value: 'md', label: 'md: the default' },
  { value: 'lg', label: 'lg: the page’s one action' },
];

/** Every prop that changes how a Button looks, and the JSX that produces it. */
export function ButtonPlayground() {
  const [variant, setVariant] = useState<ButtonVariant>('primary');
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [bracketed, setBracketed] = useState(true);
  const [label, setLabel] = useState('DEPLOY');

  const attrs = [
    variant !== 'tertiary' ? `variant="${variant}"` : null,
    size !== 'md' ? `size="${size}"` : null,
    bracketed ? 'bracketed' : null,
  ].filter(Boolean);
  const jsx = `<Button${attrs.length ? ` ${attrs.join(' ')}` : ''}>${label}</Button>`;

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-5">
        <RadioGroup legend="Variant" value={variant} onValueChange={(v) => setVariant(v as ButtonVariant)}>
          {VARIANTS.map((v) => (
            <Radio key={v} value={v} label={v} />
          ))}
        </RadioGroup>
        <Select label="Size" options={SIZES} value={size} onValueChange={(v) => setSize(v as 'sm' | 'md' | 'lg')} />
        <Switch label="Bracketed" checked={bracketed} onCheckedChange={setBracketed} />
        <Select
          label="Label"
          options={['DEPLOY', 'ROLL BACK', 'PUBLISH', 'REVOKE TOKEN'].map((l) => ({ value: l, label: l }))}
          value={label}
          onValueChange={setLabel}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex min-h-48 flex-1 items-center justify-center border-2 border-dashed border-edge-default bg-surface-base p-6">
          <Button variant={variant} size={size} bracketed={bracketed}>
            {label}
          </Button>
        </div>
        <CodeBlock language="tsx" title="output">
          <code>{jsx}</code>
        </CodeBlock>
      </div>
    </div>
  );
}
