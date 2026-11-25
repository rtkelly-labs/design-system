/*
 * Every export of the root entry, named once. Compiled with `skipLibCheck:
 * false`, so `tsc` checks the published declarations themselves — and those
 * of everything they reference — as a consumer with that setting would.
 */
import type * as DS from '@rtkelly-labs/design-system';

export type Surface = { [K in keyof typeof DS]: (typeof DS)[K] };
