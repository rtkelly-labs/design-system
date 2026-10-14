/**
 * What the compendium has to cover. The classification itself lives in the design system
 * (`src/slots/exports.ts`), where the slot contract uses it too, so there is one answer to "what is a
 * standalone component, and what is a part of one"; this file adds only what is the compendium's own:
 * the exemptions. `BACKLOG` is in compendium.backlog.ts.
 */

export { analyse, isComponentExport } from '../../design-system/src/slots/exports';
export type { Analysis, ExportClass, ExportInfo, PartBasis } from '../../design-system/src/slots/exports';

/**
 * Components that deliberately get no plate. Typed, reasoned, and small on purpose: adding to this
 * list is a design decision, not a way to make the test pass. Everything a spike has merely not
 * got to yet belongs in BACKLOG, not here.
 */
export type ExemptionKind = 'kitchen-sink';
export const EXEMPT: Readonly<Record<string, { kind: ExemptionKind; reason: string }>> = {
  DesignSandbox: {
    kind: 'kitchen-sink',
    reason: 'Renders every other component several screens tall; its plate would duplicate the compendium inside itself.',
  },
};
