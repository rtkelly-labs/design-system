'use client';

import { createContext, forwardRef, useCallback, useMemo, useRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { recipe } from '../lib/recipe';
import { findHueCollisions } from './buttonHues';
import type { ButtonColourRole } from './buttonHues';

/**
 * What a Button in a group tells it. `register` returns the way back out.
 * `null` outside a group, which is the normal case and costs nothing.
 */
export interface ButtonGroupContextValue {
  register: (id: string, role: ButtonColourRole) => () => void;
}

/** Read by `Button`. Not part of the public vocabulary: a caller wraps, never reads. */
export const ButtonGroupContext = createContext<ButtonGroupContextValue | null>(null);

/**
 * The one use of `process.env.NODE_ENV` in the package, written as the bare
 * expression so a consumer's bundler replaces it and strips the check from a
 * production build. Declared here, module-scoped, because the declaration build
 * reads no `@types/node`.
 */
declare const process: { env: { NODE_ENV?: string } };

const group = recipe({
  base: 'flex flex-wrap items-center gap-3',
});

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** The Buttons. Anything else is laid out beside them and ignored by the rule. */
  children: ReactNode;
}

/**
 * A row of Buttons that answer to each other: a dialog's footer, a form's
 * action bar, a danger zone.
 *
 * It renders `role="group"` and is where D3's rule lives: **a danger Button
 * never sits beside a Button of the same hue.** Colour alone must not tell a
 * destructive action from its neighbour (WCAG 1.4.1), and on both Levels
 * `accent.tertiary` and `intent.danger` resolve to the same hue. Each Button
 * inside registers the Role it paints with; in development the group compares
 * their hues on every Level through the declared `accentHue` / `intentHue`
 * maps and `console.warn`s once per distinct collision. Production builds do no
 * work at all.
 *
 * `Modal` and `AlertDialog` render their footers as a ButtonGroup, so the rule
 * applies there without the caller opting in. `findHueCollisions` is the same
 * check as a pure function, for a test.
 *
 * What it cannot see: a colour set through `className`, a Button nested inside
 * another component's own wrapper, and Buttons in two separate groups.
 *
 * ```tsx
 * <ButtonGroup aria-label="Danger zone">
 *   <Button variant="quiet">CANCEL</Button>
 *   <Button variant="danger" bracketed>DELETE ACCOUNT</Button>
 * </ButtonGroup>
 * ```
 */
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup(
  { children, className, ...rest },
  ref,
) {
  const roles = useRef(new Map<string, ButtonColourRole>());
  const warned = useRef(new Set<string>());

  const register = useCallback((id: string, role: ButtonColourRole) => {
    roles.current.set(id, role);
    if (process.env.NODE_ENV !== 'production') {
      const list = [...roles.current.values()];
      const hits = findHueCollisions(list);
      const key = hits.map((hit) => `${hit.level}:${hit.hue}`).join('|');
      if (key && !warned.current.has(key)) {
        warned.current.add(key);
        console.warn(
          '[design-system] ButtonGroup: a danger Button sits beside a Button of the same hue (' +
            hits.map((hit) => `${hit.hue} on ${hit.level}`).join(', ') +
            '). Colour alone must not tell a destructive action from its neighbour — ' +
            'make the neighbour variant="quiet" or "secondary".',
        );
      }
    }
    return () => {
      roles.current.delete(id);
    };
  }, []);

  const value = useMemo(() => ({ register }), [register]);

  return (
    <ButtonGroupContext.Provider value={value}>
      <div
        data-slot="button-group"
        ref={ref}
        role="group"
        {...rest}
        className={group({ class: className })}
      >
        {children}
      </div>
    </ButtonGroupContext.Provider>
  );
});
