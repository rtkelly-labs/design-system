import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

/**
 * Group sync for {@link CodeTabs}.
 *
 * The behaviour every developer documentation portal has and no tab widget
 * does by default: pick `pnpm` on one code block and *every* block on the page
 * in the same group switches with it, because a reader picks a package manager
 * once, not once per snippet.
 *
 * The selection lives in a module-level store rather than a React context so
 * blocks do not have to share a provider — MDX bodies mount them at arbitrary
 * depths and there is no component in a document to hang a provider off. The
 * choice is also persisted, so it survives navigating to the next page.
 */

const STORAGE_PREFIX = 'ds-code-tabs:';

const selections = new Map<string, string>();
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** A group of one: an ungrouped block never notifies and never listens. */
function subscribeNothing() {
  return () => {};
}

function selectInGroup(group: string, label: string) {
  if (selections.get(group) === label) return;
  selections.set(group, label);
  try {
    window.localStorage.setItem(STORAGE_PREFIX + group, label);
  } catch {
    // Private windows and blocked site data both throw here. A reader who
    // cannot persist the choice still gets it for the length of the page.
  }
  emit();
}

function restoreGroup(group: string) {
  if (selections.has(group)) return;
  try {
    const stored = window.localStorage.getItem(STORAGE_PREFIX + group);
    if (stored) {
      selections.set(group, stored);
      emit();
    }
  } catch {
    // As above.
  }
}

/** Test seam: forget every selection, in memory and in storage. */
export function resetCodeTabGroups() {
  selections.clear();
  try {
    for (let i = window.localStorage.length - 1; i >= 0; i -= 1) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) window.localStorage.removeItem(key);
    }
  } catch {
    // No storage, nothing to forget.
  }
  emit();
}

/**
 * The selected label for a group, and a setter.
 *
 * `fallback` is the first tab, and it is also the value the server renders:
 * the store starts empty on both sides, so the first client render matches the
 * HTML and the stored choice is applied in an effect afterwards. Restoring
 * during render instead is what produces a hydration mismatch.
 */
export function useTabGroup(
  group: string | undefined,
  fallback: string,
): readonly [string, (label: string) => void] {
  const shared = useSyncExternalStore(
    group ? subscribe : subscribeNothing,
    () => (group ? selections.get(group) : undefined),
    () => undefined,
  );
  const [local, setLocal] = useState(fallback);

  useEffect(() => {
    if (group) restoreGroup(group);
  }, [group]);

  const select = useCallback(
    (label: string) => {
      if (group) selectInGroup(group, label);
      else setLocal(label);
    },
    [group],
  );

  return [group ? (shared ?? fallback) : local, select] as const;
}
