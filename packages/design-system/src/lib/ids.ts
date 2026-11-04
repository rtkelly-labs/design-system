/** The visible part of an id: its first `count` characters and `…`, or all of it. */
export function truncateId(value: string, count = 8): string {
  if (count <= 0 || value.length <= count) return value;
  return `${value.slice(0, count)}…`;
}
