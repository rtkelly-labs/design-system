/**
 * The docs specimen pattern: a section that shows one design decision in
 * realistic frames, on both levels, with one legend, a role list, pass/fail
 * checks (numbers folded away) and the same theme on other surfaces.
 * Used by the Code & syntax foundations page and the decision board.
 */
export { CheckList } from './CheckList';
export { CodeFrame, GEO, NO_GUTTER, classify, seg, spec } from './CodeFrame';
export type { CTok, Geo, RowSpec, Seg } from './CodeFrame';
export { LEVEL_IDS, LevelPair, LevelPanel } from './LevelPair';
export type { Check, CodeLook, Cls, Level } from './look';
export { NumbersDisclosure, NumbersTable } from './NumbersDisclosure';
export type { NumbersTableData } from './NumbersDisclosure';
export { ANCHOR, Disclosure, Eyebrow, Label, Swatch, anchor } from './parts';
export { RoleList } from './RoleList';
export { SpecimenLegend } from './SpecimenLegend';
export type { LegendItem } from './SpecimenLegend';
export { SurfacesStrip } from './SurfacesStrip';
export type { Surface } from './SurfacesStrip';
export { TerminalFrame } from './TerminalFrame';
export type { Run } from './TerminalFrame';
