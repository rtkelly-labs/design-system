// @rtkelly13/design-system main entrypoint

export * from './tokens';

// The theme ladder — the single source for level names, level colours, and the
// contrast arithmetic that gates them.
export * from './theme/levels';
export {
  MEDIA,
  CSS_MEDIUM,
  MEDIA_DEFINITIONS,
  isMedium,
} from './theme/media';
export type {
  Medium,
  MediumDefinition,
  TypeStep,
  TypeStepName,
  Motion,
} from './theme/media';
export * from './theme/contrast';
export { ANSI_SLOTS, SLOTS, ansiScheme } from './theme/ansi';
export type { AnsiSlot, AnsiScheme, AnsiChrome } from './theme/ansi';

// Semantic theming — prefer these over the raw palette in `tokens`.
export * from './lib/theme';
// Only `cn` is public. `recipe`'s type comes from the library that implements
// it, so exporting it would put that library back into the published .d.ts and
// make replacing it a breaking change. Components import it directly.
export { cn } from './lib/recipe';
export type { ClassInput } from './lib/recipe';
export * from './lib/slug';

// Hooks
export * from './hooks/useCopyToClipboard';
export * from './hooks/useActiveHeading';

// Primitives & Callouts
export * from './components/Button';
export * from './components/Card';
export * from './components/Badge';
export * from './components/Avatar';
export * from './components/PageTitle';
export * from './components/PageHeader';
export * from './components/Tag';
export * from './components/Pagination';
export * from './components/SectionContainer';
export * from './components/Divider';
export * from './components/AsciiDivider';
export * from './components/ThemeProvider';
export * from './components/BracketText';
export * from './components/NoteBlock';
export * from './components/TLDR';
export * from './components/Input';
export * from './components/Swatch';
export * from './components/StatCard';
export * from './components/Table';
export * from './components/DataTable';
export * from './components/Modal';
export * from './components/NerdIcon';
export * from './components/Glyph';

// Chart Primitives & Trend Visualizers
export * from './components/BarChart';
export * from './components/Sparkline';
export * from './components/ChartTooltip';
export * from './components/BulletChart';

// Slides & Presentation Deck Engine
export * from './components/slides/Slide';
export * from './components/slides/SlideDeck';

// Blog & Editorial Post Foundations
export * from './components/blog/BlogPost';
export * from './components/blog/LoremIpsumPost';

// Experiments Page & Design System Sandbox
export * from './components/experiments/ExperimentsView';
export * from './components/experiments/DesignSandbox';

// SaaS Landing Pages & Admin Sites Foundations
export * from './components/saas/SaasLandingPage';
export * from './components/admin/AdminDashboardLayout';

// Documentation Portal Chrome & MDX Rendering
export * from './components/docs';
