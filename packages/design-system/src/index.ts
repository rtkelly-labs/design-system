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
export * from './theme/recommended';
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
// The report frame — the page a generated report is built in. Separate from
// the docs components because a report is written by a tool and read once,
// where a docs page is written by a person and read often: the frame owns the
// measure, the header strip and the print behaviour, and everything inside it
// is ordinary composition.
export * from './components/ReportDocument';

// The colour-instead-of-role rules, and the scanner over them. Published
// because a tool generating markup against this system should be able to hold
// itself to the same rule the system holds itself to — the report generator
// lints at budget zero with exactly these.
export { TOKEN_RULES, scanRules, scanTokenRules } from './lib/tokenRules';
export type { Finding, TokenRule } from './lib/tokenRules';
export * from './components/Avatar';
export * from './components/PageTitle';
export * from './components/PageHeader';
export * from './components/Tag';
export * from './components/Pagination';
// The tablist. There is exactly one in this tree: `CodeTabs` renders through
// it rather than hand-rolling a second keyboard model — see #240, and #163 for
// why it is first-party rather than a wrapper over Base UI.
export * from './components/Tabs';
export * from './components/SectionContainer';
export * from './components/Divider';
export * from './components/AsciiDivider';
export * from './components/ThemeProvider';
export * from './components/BracketText';
export * from './components/NoteBlock';
export * from './components/TLDR';
// Named rather than `export *`: `Input.tsx` also exports the field recipe
// `Select` draws its trigger with, and a recipe's type is `tailwind-variants`'.
export { Input, TextArea } from './components/Input';
export type { InputProps, TextAreaProps } from './components/Input';
// One of a fixed set (#164): the same field as `Input`, with a listbox this
// system paints instead of the operating system's, and `native` for the
// platform picker when that is the better phone experience.
export * from './components/Select';
// The booleans, added together: one capability in two presentations,
// composing the same Field as the text controls above.
export * from './components/Checkbox';
export * from './components/Switch';
// The groups (#239): `Fieldset` and `Legend` are the set's label, description
// and error on the same Field contract, and `RadioGroup` / `Radio` are the
// choose-one control built on that frame rather than beside it.
export * from './components/Fieldset';
export * from './components/RadioGroup';
export * from './components/Swatch';
export * from './components/StatCard';
export * from './components/Table';
export * from './components/DataTable';
export * from './components/Modal';
export * from './components/AlertDialog';
export * from './components/Drawer';

// System feedback — the three states an application has besides "loaded".
// One vocabulary on purpose: the same motion tokens, the same reduced-motion
// rule, the same muted surface, so a loading card and an empty table read as
// the same system rather than as two consumers' guesses.
export * from './components/Spinner';
export * from './components/Skeleton';
export * from './components/Progress';
export * from './components/EmptyState';

// Transient notifications. Not an overlay: a toast shares neither the
// positioning nor the dismissal model of Tooltip/Popover/Menu — it is a queue,
// a live region and a lifetime (#243).
export * from './components/Toast';

export * from './components/NerdIcon';
export * from './components/SocialIcon';
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
