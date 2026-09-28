/**
 * How long a toast stays up — policy, kept out of `Toast.tsx` so it can be
 * tested directly without being exported from the package. `src/index.ts`
 * re-exports named members of `Toast.tsx` only, and nothing re-exports this.
 */

/** The fields of a toast the lifetime depends on. */
interface LifetimeInput {
  title: string;
  description?: unknown;
  action?: unknown;
  timeout?: number;
}

/**
 * Six seconds. Base UI's default is five; the extra second is for the reader
 * #243 names — a screen reader still announcing when the timer fires.
 */
export const DEFAULT_TIMEOUT = 6000;

/**
 * Reading time, as a floor under the lifetime.
 *
 * 200 words a minute is a conservative reading speed (300ms a word), and the
 * two seconds on top are for noticing the toast at all before reading starts.
 * Only text can be counted: a `description` that is a React node contributes
 * nothing, and the caller who built one can pass `timeout` themselves.
 */
export const MS_PER_WORD = 300;
export const NOTICE_MS = 2000;

function words(text: unknown): number {
  return typeof text === 'string' ? text.split(/\s+/).filter(Boolean).length : 0;
}

/**
 * The lifetime in milliseconds, `0` meaning "until dismissed".
 *
 * 1. An explicit `timeout` always wins — including `0`.
 * 2. A toast with an action persists. A control that can vanish on a timer is
 *    one a keyboard or screen-reader user may never reach; pausing on hover
 *    protects only the pointer.
 * 3. A provider `timeout` of `0` means every toast persists.
 * 4. Otherwise the provider's timeout, raised to the reading time of the text.
 */
export function resolveLifetime(options: LifetimeInput, providerTimeout: number): number {
  if (options.timeout !== undefined) return options.timeout;
  if (options.action) return 0;
  if (providerTimeout === 0) return 0;
  const reading = NOTICE_MS + (words(options.title) + words(options.description)) * MS_PER_WORD;
  return Math.max(providerTimeout, reading);
}
