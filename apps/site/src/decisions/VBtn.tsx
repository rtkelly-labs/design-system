import { Button, NerdIcon } from '@rtkelly13/design-system';
import type { Slot } from './data';

/**
 * Site-local variant styles for the decision board. Role utilities only:
 * bg-accent-*, text-intent-*, border-edge-*, shadow-hard-*. Nothing here is
 * exported by the package; the board is scaffolding.
 */

const BASE =
  'inline-flex items-center justify-center gap-1.5 border-2 font-mono font-bold uppercase transition-colors cursor-default';

const SIZE = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
} as const;

const D4_TEXT = { 'D4-A': 'h-[28px] px-2 text-xs', 'D4-B': 'h-[32px] px-3 text-xs' } as const;
const D4_ICON = { 'D4-A': 'h-[32px] w-[32px] text-sm', 'D4-B': 'h-[40px] w-[40px] text-base' } as const;

const QUIET_A =
  'border-edge-default bg-transparent text-content-primary hover:border-accent-primary hover:shadow-hard-md';
const QUIET_B = 'border-transparent bg-transparent text-content-primary underline-offset-4 hover:underline';
const QUIET_C =
  'border-edge-default bg-transparent text-content-primary shadow-hard-sm hover:border-accent-primary';
const SEC_B = 'border-edge-strong bg-transparent text-content-primary shadow-hard-md hover:shadow-hard-lg';
const SEC_C = 'border-accent-secondary bg-transparent text-accent-secondary shadow-hard-accent-secondary';
const DANGER_SOLID = 'border-intent-danger bg-intent-danger text-content-inverse shadow-hard-md hover:shadow-hard-lg';
const DANGER_OUTLINE =
  'border-intent-danger bg-transparent text-intent-danger hover:bg-intent-danger hover:text-content-inverse focus-visible:bg-intent-danger focus-visible:text-content-inverse';

/** The 24x24 WCAG 2.5.8 target, drawn when the D4 section's debug overlay is on. */
export const DEBUG_TARGET =
  'relative after:pointer-events-none after:absolute after:left-1/2 after:top-1/2 after:hidden after:size-6 after:-translate-x-1/2 after:-translate-y-1/2 after:outline after:outline-1 after:outline-dashed after:outline-intent-warning after:content-[""] group-data-[debug=true]/d4:after:block';

interface Style {
  cls: string;
  bracket?: boolean;
}

/** The class set an option gives a role, or null when the option leaves that role as it ships today. */
function styleFor(opt: string, slot: Slot): Style | null {
  const { role } = slot;
  switch (opt) {
    case 'D1-A':
      return role === 'quiet' ? { cls: QUIET_A } : null;
    case 'D1-B':
      return role === 'quiet' ? { cls: QUIET_B, bracket: !slot.icon } : null;
    case 'D1-C':
      return role === 'quiet' ? { cls: QUIET_C } : null;
    case 'D2-B':
      return role === 'secondary' ? { cls: SEC_B } : null;
    case 'D2-C':
      return role === 'secondary' ? { cls: SEC_C } : null;
    case 'D3-A':
      return role === 'danger' || role === 'dangerFinal' ? { cls: DANGER_SOLID } : null;
    case 'D3-B':
      return role === 'danger' || role === 'dangerFinal' ? { cls: DANGER_OUTLINE } : null;
    case 'D3-C':
      if (role === 'danger') return { cls: DANGER_OUTLINE };
      return role === 'dangerFinal' ? { cls: DANGER_SOLID } : null;
    case 'D4-A':
    case 'D4-B':
      return { cls: QUIET_A };
    default:
      return null;
  }
}

const TODAY_VARIANT = {
  plain: 'tertiary',
  quiet: 'tertiary',
  primary: 'primary',
  secondary: 'inverse',
  cancel: 'inverse',
  danger: 'tertiary',
  dangerFinal: 'tertiary',
} as const;

/** One in-context button. `opt` is an option ID; `cur` renders what ships today. */
export function VBtn({ opt, slot }: { opt: string; slot: Slot }) {
  const style = opt.startsWith('CUR') ? null : styleFor(opt, slot);
  const d4 = opt.startsWith('D4') && (slot.size === 'xs' || slot.icon);
  const content = slot.icon ? <NerdIcon name={slot.icon} aria-hidden="true" className="text-[1em]" /> : slot.label;
  const aria = slot.aria ? { 'aria-label': slot.aria } : {};

  if (!style) {
    // As shipped. xs does not exist today, so it falls back to sm.
    return (
      <Button
        type="button"
        variant={TODAY_VARIANT[slot.role]}
        size={slot.size === 'md' ? 'md' : 'sm'}
        className={opt === 'CUR-D4' ? DEBUG_TARGET : undefined}
        {...aria}
      >
        {content}
      </Button>
    );
  }

  let size: string = slot.size === 'md' ? SIZE.md : SIZE.sm;
  if (d4) {
    const key = opt as keyof typeof D4_TEXT;
    size = slot.icon ? D4_ICON[key] : D4_TEXT[key];
  }
  const shadowFix = d4 ? 'hover:shadow-hard-sm' : '';

  return (
    <button type="button" className={`${BASE} ${size} ${style.cls} ${shadowFix} ${d4 ? DEBUG_TARGET : ''}`} {...aria}>
      {style.bracket ? (
        <>
          <span aria-hidden="true">[</span>
          <span>{content}</span>
          <span aria-hidden="true">]</span>
        </>
      ) : (
        content
      )}
    </button>
  );
}
