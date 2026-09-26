'use client';

import { Contrast, Layers, MousePointerClick, Palette, Square } from 'lucide-react';
import { Feature, FeatureGrid } from '@/ds';

/** Icons are client-side here only because lucide-react ships a context provider. */
export function Principles() {
  return (
    <FeatureGrid
      title="[ WHAT HOLDS IT TOGETHER ]"
      description="Rules the package checks in CI. None of them is a matter of taste."
      columns={3}
      align="start"
    >
      <Feature title="Zero radius" icon={<Square aria-hidden="true" />} accent="primary">
        A token, not a reset. Tailwind&apos;s whole radius scale is redefined to zero, so <code>rounded-lg</code> is square in your
        markup too.
      </Feature>
      <Feature title="Roles, not hues" icon={<Palette aria-hidden="true" />} accent="secondary">
        Components ask for <code>surface.raised</code> or <code>intent.danger</code>. A hue name in component code fails the build, with a
        budget of zero.
      </Feature>
      <Feature title="Two levels" icon={<Layers aria-hidden="true" />} accent="tertiary">
        Midnight and sketch are drawn separately. Neither is the other inverted, and both are tested on every change.
      </Feature>
      <Feature title="Contrast as arithmetic" icon={<Contrast aria-hidden="true" />} accent="info">
        260 role pairs, checked as numbers on every build. If the check fails, the colour is wrong, not the check.
      </Feature>
      <Feature title="One focus model" icon={<MousePointerClick aria-hidden="true" />} accent="success">
        Dialogs, menus, selects and tooltips all come from Base UI. No second library brings its own focus trap.
      </Feature>
    </FeatureGrid>
  );
}
