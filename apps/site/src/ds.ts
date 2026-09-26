'use client';

/**
 * The site's one door into `@rtkelly13/design-system`.
 *
 * The package ships as a single bundle with no `"use client"` directive, and
 * that bundle calls `createContext` at module scope. A Server Component that
 * imports *anything* from it — a stateless `Card`, a pure function like
 * `getThemeInitScript` — fails the Next.js build with "You're importing a
 * module that depends on `createContext` into a React Server Component
 * module". So every import goes through this file, which declares the client
 * boundary the package does not.
 *
 * Named re-exports only: Next.js rejects `export *` from a client boundary,
 * because it cannot enumerate the references at build time. Add a name here
 * the first time the site uses it.
 *
 * The cost of the workaround is real, and is why it is tracked upstream as
 * issue 305 rather than accepted: every export becomes a client reference, so a
 * pure helper cannot be *called* in a Server Component at all, and the entire
 * package reaches the browser even for a page that renders only static cards.
 */

export {
  // Theme and routing
  ThemeProvider,
  useTheme,
  useOptionalTheme,
  getThemeInitScript,
  LinkProvider,
  LEVELS,
  // Site chrome
  SiteHeader,
  SiteNav,
  SiteNavItem,
  MobileNav,
  SiteFooter,
  // Marketing sections
  Hero,
  FeatureGrid,
  Feature,
  CTASection,
  // Primitives
  Button,
  Badge,
  Tag,
  Card,
  BracketText,
  NoteBlock,
  Divider,
  EmptyState,
  SocialIcon,
  Spinner,
  // Forms
  Input,
  TextArea,
  Select,
  Checkbox,
  Switch,
  RadioGroup,
  Radio,
  Fieldset,
  ErrorSummary,
  // Overlays
  Modal,
  AlertDialog,
  Drawer,
  Menu,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  Tooltip,
  ToastProvider,
  useToast,
  // Navigation
  Tabs,
  TabsList,
  TabsTab,
  TabsPanel,
  // Data
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
  DataTable,
  BarChart,
  Sparkline,
  StatCard,
  // Docs chrome
  DocsLayout,
  DocsHeader,
  DocsSidebar,
  TableOfContents,
  AnchorHeading,
  Breadcrumbs,
  CodeBlock,
  CodeTabs,
  CodeTab,
  DocPager,
  Prose,
} from '@rtkelly13/design-system';

export type {
  BarChartDatum,
  ButtonVariant,
  Column,
  DocsNavNode,
  ErrorSummaryError,
  LinkComponentProps,
  SelectOption,
  ThemeLevel,
  TocEntry,
} from '@rtkelly13/design-system';
