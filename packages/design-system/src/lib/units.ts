/**
 * Quantities with a unit ladder: a byte count written in the largest unit that
 * keeps it under the next one.
 *
 * Everything here is pure and React-free, so a server component or a script
 * can call it.
 */

/** Options for {@link formatBytes}. */
export interface FormatBytesOptions {
  /**
   * The step between units. `1024` (the default) labels them with IEC binary
   * prefixes — `KiB`, `MiB`, `GiB`; `1000` with SI decimal prefixes — `kB`,
   * `MB`, `GB`.
   */
  base?: 1024 | 1000;
}

const IEC = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'] as const;
const SI = ['B', 'kB', 'MB', 'GB', 'TB', 'PB'] as const;

/** Whole bytes, one decimal above them, with a trailing `.0` dropped. */
function render(size: number, unit: number): string {
  return unit === 0 ? String(Math.round(size)) : size.toFixed(1).replace(/\.0$/, '');
}

/**
 * `512 B`, `1.5 KiB`, `20 MiB`, `3.2 TiB`: a byte count in the largest unit
 * that keeps it below the next one, whole for bytes and to one decimal above
 * them, with a trailing `.0` dropped as `formatShare` and `formatTraceDuration`
 * do. A space separates number and unit, as the SI and IEC conventions write
 * them.
 *
 * **Binary by default, and labelled as binary.** The counts this formats come
 * from the file system, memory and process accounting, which count in powers
 * of two — and Windows and most dashboards already divide by 1024. What they
 * get wrong is the label: `KB` for 1024 bytes is the JEDEC usage SI reserves
 * for 1000, so the same string means two numbers 2.4% apart at `KB` and 10%
 * apart at `TB`. `KiB` cannot be misread. Pass `{ base: 1000 }` for sizes
 * that are decimal by nature — network transfer, storage as a vendor states it
 * — and the labels become `kB`, `MB`, `GB`.
 *
 * The unit is chosen *after* rounding, so a value that would round up to the
 * base moves to the next unit: 1023.96 KiB is `1 MiB`, never `1024 KiB`, and
 * 1023.6 B is `1 KiB`. Petabytes are the top of the ladder; anything larger
 * stays in them (`2048 PiB`).
 *
 * A negative count — a size delta — keeps its sign (`-1.5 KiB`); `-0` is
 * `0 B`. `NaN` and `±Infinity` are `—`, as the other formatters here write a
 * value they cannot.
 */
export function formatBytes(bytes: number, options: FormatBytesOptions = {}): string {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes)) return '—';
  const base = options.base === 1000 ? 1000 : 1024;
  const labels = base === 1000 ? SI : IEC;
  const top = labels.length - 1;
  let size = Math.abs(bytes);
  let unit = 0;
  // Step up while the value, as it would be printed, reaches the base.
  while (unit < top && Number(render(size, unit)) >= base) {
    size /= base;
    unit += 1;
  }
  const text = render(size, unit);
  const sign = bytes < 0 && Number(text) !== 0 ? '-' : '';
  return `${sign}${text} ${labels[unit]}`;
}
