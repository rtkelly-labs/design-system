/**
 * The compendium's view of the design system's slot contract. Nothing is listed here: the slot a
 * component carries comes from the design system's own contract (`scripts/slot-contract.mjs`, whose
 * aliases are the exceptions) and the committed inventory `api/slots.txt` is its snapshot.
 */

import { ALIASES, expectedSlot } from '../../design-system/scripts/slot-contract.mjs';

/** Does this set of slots, found in a render, show the component? Data carriers render nothing of their own. */
export function showsComponent(name: string, slots: readonly string[]): boolean {
  const alias = ALIASES[name];
  if (alias?.kind === 'data-carrier') return true;
  if (alias?.family) return slots.some((s) => s === alias.family || s.startsWith(`${alias.family}-`));
  return slots.includes(expectedSlot(name));
}

/** The slot (or family) a failure message should name. */
export const slotLabel = (name: string) => ALIASES[name]?.family ?? expectedSlot(name);
