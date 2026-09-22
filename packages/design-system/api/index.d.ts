import * as react from 'react';
import react__default, { ReactNode, DetailedHTMLProps, ButtonHTMLAttributes, AnchorHTMLAttributes, HTMLAttributes, ElementType, MouseEventHandler, InputHTMLAttributes, TextareaHTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes, RefObject, SVGProps } from 'react';
import { Table as Table$1, ColumnDef } from '@tanstack/react-table';
import { RegisterableHotkey } from '@tanstack/react-hotkeys';
export { ParentSize as ResponsiveChartContainer } from '@visx/responsive';
export { useTooltip as useChartTooltip } from '@visx/tooltip';

type Emphasis = 'primary' | 'secondary' | 'tertiary' | 'quiet';

type Intent = 'info' | 'success' | 'warning' | 'danger';

type Surface = 'base' | 'raised' | 'sunken' | 'overlay';

type TextTone = 'primary' | 'secondary' | 'muted' | 'inverse';

type BorderTone = 'strong' | 'default' | 'subtle';

type Hue = 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'cyan' | 'blue' | 'violet' | 'magenta' | 'pink';

type AnsiHue = Extract<Hue, 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan'>;

type HueRef = Hue | 'neutral';

type AccentToken = Emphasis | Intent;

declare function accentVar(token: AccentToken | undefined, fallback?: AccentToken): string;
declare function surfaceVar(token?: Surface): string;
declare function textVar(token?: TextTone): string;
declare function borderVar(token?: BorderTone): string;

declare const fontVar: {
    readonly display: "var(--ds-font-display)";
    readonly body: "var(--ds-font-body)";
    readonly mono: "var(--ds-font-mono)";
    readonly pixel: "var(--ds-font-pixel)";
};

declare const HEADING_EMPHASIS: Record<1 | 2 | 3 | 4 | 5 | 6, Emphasis>;

declare const semanticTokens: {
    readonly accent: Record<Emphasis, string>;
    readonly intent: Record<Intent, string>;
    readonly surface: Record<Surface, string>;
    readonly text: Record<TextTone, string>;
    readonly border: Record<BorderTone, string>;
    readonly font: {
        readonly display: "var(--ds-font-display)";
        readonly body: "var(--ds-font-body)";
        readonly mono: "var(--ds-font-mono)";
        readonly pixel: "var(--ds-font-pixel)";
    };
    readonly shadowColor: "var(--ds-shadow-color)";
};

declare const THEME_LEVELS: readonly ["midnight", "sketch"];

type ThemeLevel = (typeof THEME_LEVELS)[number];

type Polarity = 'dark' | 'light';

declare const FIXED_COLOURS: {
    readonly black: "#000000";
    readonly white: "#ffffff";
    readonly transparent: "transparent";
};
type FixedColour = keyof typeof FIXED_COLOURS;

declare const PALETTE_HUES: readonly ["red", "orange", "yellow", "green", "teal", "cyan", "blue", "violet", "magenta", "pink"];

interface LevelDefinition {

    readonly label: string;

    readonly description: string;
    readonly polarity: Polarity;
    readonly surface: Readonly<Record<Surface, string>>;
    readonly text: Readonly<Record<TextTone, string>>;
    readonly border: Readonly<Record<BorderTone, string>>;
    readonly accent: Readonly<Record<Emphasis, string>>;
    readonly intent: Readonly<Record<Intent, string>>;

    readonly palette: Readonly<Record<Hue, string>>;

    readonly paletteBright: Readonly<Record<Hue, string>>;

    readonly accentHue: Readonly<Record<Emphasis, HueRef>>;

    readonly intentHue: Readonly<Record<Intent, HueRef>>;

    readonly shadow: string;
}

declare const LEVELS: Readonly<Record<ThemeLevel, LevelDefinition>>;

declare const DEFAULT_LEVEL: ThemeLevel;

declare const SYSTEM_LEVEL: Readonly<Record<Polarity, ThemeLevel>>;

declare function isThemeLevel(value: unknown): value is ThemeLevel;

declare function nextLevel(level: ThemeLevel): ThemeLevel;

declare function assertNever(value: never, message?: string): never;

type BrutalistTheme = ThemeLevel;

declare const MEDIA: readonly ["web", "video", "graphic"];
type Medium = (typeof MEDIA)[number];

declare const CSS_MEDIUM: Medium;

interface TypeStep {
    readonly size: number;
    readonly lineHeight: number;
}

type TypeStepName = 'caption' | 'body' | 'lead' | 'title' | 'display' | 'hero';

interface Motion {

    readonly instant: number;
    readonly quick: number;
    readonly considered: number;

    readonly easing: string;
}

interface MediumDefinition {
    readonly label: string;
    readonly description: string;

    readonly unit: 'rem' | 'px' | 'viewBox';

    readonly spacing: readonly number[];
    readonly type: Readonly<Record<TypeStepName, TypeStep>>;

    readonly weight: Readonly<Record<'regular' | 'bold' | 'black', number>>;

    readonly borderWidth: Readonly<Record<'hairline' | 'edge' | 'heavy', number>>;

    readonly shadowOffset: Readonly<Record<'sm' | 'md' | 'lg', number>>;

    readonly radius: Readonly<Record<'none' | 'soft', number>>;
    readonly motion: Motion;

    readonly layer: Readonly<Record<'base' | 'raised' | 'overlay' | 'top', number>>;

    readonly focusRing: Readonly<Record<'width' | 'offset', number>>;

    readonly contrastFloor: Readonly<Record<'role' | 'hue' | 'hueBright', number>>;
}

declare const MEDIA_DEFINITIONS: Readonly<Record<Medium, MediumDefinition>>;

declare function isMedium(value: unknown): value is Medium;

interface Rgb {
    r: number;
    g: number;
    b: number;

    a: number;
}

declare function parseColor(value: string): Rgb;

declare function composite(foreground: Rgb, backdrop: Rgb): Rgb;

declare function relativeLuminance(color: Rgb): number;

declare function contrastRatio(foreground: string, background: string): number;

declare const MAXIMUM_NEUTRAL_CHROMA = 0.045;
interface HueAgreementCheck {
    readonly level: ThemeLevel;
    readonly role: string;
    readonly declared: HueRef;
    readonly value: string;

    readonly expected: string | null;
    readonly passes: boolean;
    readonly detail: string;
}
declare const MINIMUM_RATIO: {
    readonly text: 4.5;

    readonly textInverse: 4.5;
    readonly accent: 4.5;
    readonly intent: 4.5;

    readonly palette: 5.5;

    readonly paletteBright: 4.5;
    readonly borderStrong: 3;
    readonly borderDefault: 3;
    readonly borderSubtle: 1.4;

    readonly overlaySeparation: 3;

    readonly stateDevice: 3;
};
interface ContrastCheck {
    level: ThemeLevel;

    pair: string;
    foreground: string;
    background: string;
    ratio: number;
    minimum: number;
    passes: boolean;
}

declare function auditHueAgreement(ladder: Readonly<Record<ThemeLevel, LevelDefinition>>): HueAgreementCheck[];

interface ContrastFloor {
    readonly role: number;
    readonly hue: number;
    readonly hueBright: number;
}

declare const WEB_FLOOR: ContrastFloor;
declare function auditContrast(ladder: Readonly<Record<ThemeLevel, LevelDefinition>>,

floor?: ContrastFloor): ContrastCheck[];

type SelectionDevice = 'fill' | 'edge' | 'surface pair';
interface SelectionDeviceCheck {
    level: ThemeLevel;
    device: SelectionDevice;

    pair: string;
    foreground: string;
    background: string;
    ratio: number;
    minimum: number;

    passes: boolean;
}

declare function auditSelectionDevices(ladder: Readonly<Record<ThemeLevel, LevelDefinition>>): SelectionDeviceCheck[];

declare const ANSI_SLOTS: readonly ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white", "brightBlack", "brightRed", "brightGreen", "brightYellow", "brightBlue", "brightMagenta", "brightCyan", "brightWhite"];
type AnsiSlot = (typeof ANSI_SLOTS)[number];

type SlotSource = {
    readonly kind: 'hue';
    readonly hue: (typeof PALETTE_HUES)[number];
    readonly bright: boolean;
} | {
    readonly kind: 'role';
    readonly read: (level: LevelDefinition) => string;
} | {
    readonly kind: 'fixed';
    readonly read: () => string;
};

declare const SLOTS: Readonly<Record<AnsiSlot, SlotSource>>;

interface AnsiChrome {
    readonly background: string;
    readonly foreground: string;
    readonly cursor: string;
    readonly selectionBackground: string;
}
interface AnsiScheme {
    readonly level: ThemeLevel;
    readonly slots: Readonly<Record<AnsiSlot, string>>;
    readonly chrome: AnsiChrome;
}

declare function ansiScheme(level: ThemeLevel): AnsiScheme;

declare const RECOMMENDED_COLOUR_NAMESPACES: readonly ["surface", "content", "edge", "accent", "intent"];
type RecommendedColourNamespace = (typeof RECOMMENDED_COLOUR_NAMESPACES)[number];

declare const RECOMMENDED_COLOUR_ROLES: {
    readonly surface: readonly ["base", "raised", "sunken", "overlay"];
    readonly content: readonly ["primary", "secondary", "muted", "inverse"];
    readonly edge: readonly ["strong", "default", "subtle"];
    readonly accent: readonly ["primary", "secondary", "tertiary", "quiet"];
    readonly intent: readonly ["info", "success", "warning", "danger"];
};

interface RecommendedThemeColours {
    readonly surface: Readonly<Record<Surface, string>>;
    readonly content: Readonly<Record<TextTone, string>>;
    readonly edge: Readonly<Record<BorderTone, string>>;
    readonly accent: Readonly<Record<Emphasis, string>>;
    readonly intent: Readonly<Record<Intent, string>>;
}

declare const RECOMMENDED_COLOURS: Readonly<Record<ThemeLevel, RecommendedThemeColours>>;

declare function getRecommendedColours(level?: ThemeLevel): RecommendedThemeColours;

declare const RECOMMENDED_COLOUR_VARS: {
    readonly surface: {
        readonly base: "var(--ds-surface-base)";
        readonly raised: "var(--ds-surface-raised)";
        readonly sunken: "var(--ds-surface-sunken)";
        readonly overlay: "var(--ds-surface-overlay)";
    };
    readonly content: {
        readonly primary: "var(--ds-text-primary)";
        readonly secondary: "var(--ds-text-secondary)";
        readonly muted: "var(--ds-text-muted)";
        readonly inverse: "var(--ds-text-inverse)";
    };
    readonly edge: {
        readonly strong: "var(--ds-border-strong)";
        readonly default: "var(--ds-border-default)";
        readonly subtle: "var(--ds-border-subtle)";
    };
    readonly accent: {
        readonly primary: "var(--ds-accent-primary)";
        readonly secondary: "var(--ds-accent-secondary)";
        readonly tertiary: "var(--ds-accent-tertiary)";
        readonly quiet: "var(--ds-accent-quiet)";
    };
    readonly intent: {
        readonly info: "var(--ds-intent-info)";
        readonly success: "var(--ds-intent-success)";
        readonly warning: "var(--ds-intent-warning)";
        readonly danger: "var(--ds-intent-danger)";
    };
};

declare const RECOMMENDED_COLOUR_PROPERTIES: readonly ["bg", "text", "border", "ring", "divide", "placeholder", "from", "via", "to"];
type RecommendedColourProperty = (typeof RECOMMENDED_COLOUR_PROPERTIES)[number];

type RecommendedColourClass = {
    [N in RecommendedColourNamespace]: `${RecommendedColourProperty}-${N}-${(typeof RECOMMENDED_COLOUR_ROLES)[N][number]}`;
}[RecommendedColourNamespace];
declare const RECOMMENDED_COLOUR_CLASSES: readonly RecommendedColourClass[];

declare function isRecommendedColourClass(className: string): boolean;

type ClassInput = string | number | null | undefined | false | ClassInput[];

declare function cn(...inputs: ClassInput[]): string;

declare function slugify(value: string): string;

declare class Slugger {
    private readonly seen;
    slug(value: string): string;
    reset(): void;
}

declare function childrenToText(node: unknown): string;

interface UseCopyToClipboardResult {

    copied: boolean;

    failed: boolean;
    copy: (value: string) => Promise<boolean>;
}

declare function useCopyToClipboard(resetAfter?: number): UseCopyToClipboardResult;

interface UseActiveHeadingOptions {

    offset?: number;

    enabled?: boolean;
}

declare function useActiveHeading(ids: readonly string[], { offset, enabled }?: UseActiveHeadingOptions): string | null;

interface ButtonOwnProps {

    children: ReactNode;

    variant?: ButtonVariant;

    size?: 'sm' | 'md' | 'lg';

    bracketed?: boolean;

    className?: string;
}

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'default';

type ButtonElementProps = ButtonOwnProps & DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
    href?: never;
};

type ButtonLinkProps = ButtonOwnProps & DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> & {

    href: string;
};
type ButtonProps = ButtonElementProps | ButtonLinkProps;

declare const Button: react.ForwardRefExoticComponent<(Omit<ButtonElementProps, "ref"> | Omit<ButtonLinkProps, "ref">) & react.RefAttributes<HTMLButtonElement | HTMLAnchorElement>>;

type CardVariant = 'panel' | 'card';
interface CardProps extends HTMLAttributes<HTMLDivElement> {

    title?: string;

    description?: string;

    imgSrc?: string;

    href?: string;

    asciiArt?: string;

    filename?: string;

    children?: ReactNode;

    className?: string;

    accent?: AccentToken;

    badge?: string;

    panel?: boolean;

    variant?: CardVariant;
}

declare function Card({ title, description, imgSrc, href, asciiArt, filename, children, className, accent, badge, panel, variant, style, ...props }: CardProps): react.JSX.Element;

interface BadgeProps extends react__default.HTMLAttributes<HTMLSpanElement> {

    children: react__default.ReactNode;

    accent?: AccentToken;
}

declare const Badge: react__default.ForwardRefExoticComponent<BadgeProps & react__default.RefAttributes<HTMLSpanElement>>;

interface ReportMetaItem {
    label: string;
    value: ReactNode;
}
interface ReportDocumentProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {

    title: ReactNode;

    subtitle?: ReactNode;

    meta?: readonly ReportMetaItem[];

    children: ReactNode;

    className?: string;
}

declare const ReportDocument: react.ForwardRefExoticComponent<ReportDocumentProps & react.RefAttributes<HTMLElement>>;

interface ReportSectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {

    title: ReactNode;

    id?: string;

    children: ReactNode;

    className?: string;
}
declare const ReportSection: react.ForwardRefExoticComponent<ReportSectionProps & react.RefAttributes<HTMLElement>>;

interface ReportDetailsProps extends HTMLAttributes<HTMLDetailsElement> {

    summary: ReactNode;

    note?: ReactNode;

    open?: boolean;

    children: ReactNode;

    className?: string;
}
declare const ReportDetails: react.ForwardRefExoticComponent<ReportDetailsProps & react.RefAttributes<HTMLDetailsElement>>;

interface TokenRule {
    id: 'hex' | 'rawPalette' | 'legacyAlias' | 'darkVariant';
    label: string;

    pattern: RegExp;
    fix: string;
}
declare const TOKEN_RULES: readonly TokenRule[];
interface Finding<Id extends string = string> {
    ruleId: Id;
    line: number;
    match: string;

    text: string;
}

declare function scanRules<Id extends string>(source: string, rules: readonly {
    id: Id;
    pattern: RegExp;
}[]): Finding<Id>[];

declare function scanTokenRules(source: string): Finding<TokenRule['id']>[];

interface AvatarProps extends react__default.HTMLAttributes<HTMLDivElement> {
    src?: string;
    alt?: string;
    fallback?: string;
    size?: 'sm' | 'md' | 'lg';

    accent?: AccentToken;
}

declare const Avatar: react__default.ForwardRefExoticComponent<AvatarProps & react__default.RefAttributes<HTMLDivElement>>;

interface PageTitleProps extends HTMLAttributes<HTMLHeadingElement> {
    children: ReactNode;
    subtitle?: string;
    bracketed?: boolean;
    className?: string;
}
declare function PageTitle({ children, subtitle, bracketed, className, ...props }: PageTitleProps): react.JSX.Element;

interface PageHeaderProps {

    title: string;

    subtitle?: ReactNode;

    icon?: ElementType<{
        className?: string;
    }>;

    accent?: AccentToken;

    children?: ReactNode;

    className?: string;
}
declare function PageHeader({ title, subtitle, icon: Icon, accent, children, className, }: PageHeaderProps): react.JSX.Element;

interface TagProps {

    text: string;

    href?: string;

    accent?: AccentToken;

    onClick?: MouseEventHandler<HTMLElement>;

    className?: string;

    prefix?: string;
    children?: ReactNode;
}
declare const Tag: react.ForwardRefExoticComponent<TagProps & react.RefAttributes<HTMLAnchorElement | HTMLSpanElement>>;

interface PaginationProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {

    totalPages: number;

    currentPage: number;

    onPageChange?: (page: number) => void;

    getPageHref?: (page: number) => string;

    className?: string;
}

declare const Pagination: react.ForwardRefExoticComponent<PaginationProps & react.RefAttributes<HTMLDivElement>>;

type TabsOrientation = 'horizontal' | 'vertical';

type TabsVariant = 'merged' | 'underline' | 'segmented';
interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {

    value?: string;

    defaultValue?: string;

    onValueChange?: (value: string) => void;

    orientation?: TabsOrientation;

    variant?: TabsVariant;

    accent?: AccentToken;

    children: ReactNode;

    className?: string;
}

declare const Tabs: react.ForwardRefExoticComponent<TabsProps & react.RefAttributes<HTMLDivElement>>;
interface TabsListProps extends HTMLAttributes<HTMLDivElement> {

    label?: string;

    caption?: ReactNode;

    children: ReactNode;

    className?: string;
}

declare const TabsList: react.ForwardRefExoticComponent<TabsListProps & react.RefAttributes<HTMLDivElement>>;
interface TabsTabProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {

    value: string;

    children: ReactNode;

    className?: string;
}

declare const TabsTab: react.ForwardRefExoticComponent<TabsTabProps & react.RefAttributes<HTMLButtonElement>>;
interface TabsPanelProps extends HTMLAttributes<HTMLDivElement> {

    value: string;

    keepMounted?: boolean;

    children: ReactNode;

    className?: string;
}

declare const TabsPanel: react.ForwardRefExoticComponent<TabsPanelProps & react.RefAttributes<HTMLDivElement>>;

interface SectionContainerProps {
    children: ReactNode;
    className?: string;
}
declare function SectionContainer({ children, className }: SectionContainerProps): react.JSX.Element;

type DividerVariant = 'auto' | 'terminal' | 'pencil';

declare const DIVIDER_PATTERNS: Readonly<Record<Polarity, string>>;
interface DividerProps extends react__default.HTMLAttributes<HTMLDivElement> {

    variant?: DividerVariant;

    pattern?: string;
}
declare const Divider: react__default.FC<DividerProps>;

type AsciiDividerProps = DividerProps;

declare const AsciiDivider: react__default.FC<AsciiDividerProps>;

declare const THEME_STORAGE_KEY = "ds-theme-level";

declare const THEME_ATTRIBUTE = "data-theme";
interface ThemeContextValue {
    level: ThemeLevel;

    polarity: Polarity;
    setLevel: (level: ThemeLevel) => void;

    cycleLevel: () => void;

    levels: readonly ThemeLevel[];
}
interface ThemeProviderProps {
    children: react__default.ReactNode;

    defaultLevel?: ThemeLevel;

    persist?: boolean;

    followSystem?: boolean;

    scoped?: boolean;

    className?: string;
}

declare function getThemeInitScript(options?: {
    defaultLevel?: ThemeLevel;
    followSystem?: boolean;
}): string;
declare const ThemeProvider: react__default.FC<ThemeProviderProps>;
declare const useTheme: () => ThemeContextValue;

declare const useOptionalTheme: () => ThemeContextValue | undefined;

interface BracketTextProps extends HTMLAttributes<HTMLSpanElement> {
    children: ReactNode;

    accent?: AccentToken;
    className?: string;
}
declare function BracketText({ children, accent, className, ...props }: BracketTextProps): react.JSX.Element;

interface NoteBlockProps {
    type?: 'note' | 'tip' | 'warning' | 'important';
    title?: string;
    children: react__default.ReactNode;
}
declare const NoteBlock: react__default.FC<NoteBlockProps>;

interface TLDRProps {
    children: react__default.ReactNode;
}
declare const TLDR: react__default.FC<TLDRProps>;

interface FieldProps {

    label?: string;

    error?: string;

    helperText?: string;

    accent?: AccentToken;

    className?: string;
}

interface BooleanFieldProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'className' | 'defaultChecked' | 'onChange'>, FieldProps {

    checked?: boolean;

    defaultChecked?: boolean;

    onCheckedChange?: (checked: boolean) => void;

    name?: string;

    value?: string;

    disabled?: boolean;

    readOnly?: boolean;

    required?: boolean;

    id?: string;
}

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'>, FieldProps {
}

declare function Input({ label, error, helperText,

accent,

className, id, ...props }: InputProps): react.JSX.Element;
interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>, FieldProps {
}
declare function TextArea({ label, error, helperText,

accent,

className, id, ...props }: TextAreaProps): react.JSX.Element;

interface SelectOption {

    label: string;

    value: string;

    disabled?: boolean;
}
interface SelectProps extends Omit<HTMLAttributes<HTMLElement>, 'className' | 'defaultValue' | 'onChange' | 'children'>, FieldProps {

    options: SelectOption[];

    value?: string;

    defaultValue?: string;

    onValueChange?: (value: string) => void;

    placeholder?: string;

    name?: string;

    form?: string;

    autoComplete?: string;

    disabled?: boolean;

    required?: boolean;

    id?: string;

    native?: boolean;
}

declare const Select: react.ForwardRefExoticComponent<SelectProps & react.RefAttributes<HTMLElement>>;

interface CheckboxProps extends BooleanFieldProps {

    indeterminate?: boolean;
}

declare const Checkbox: react.ForwardRefExoticComponent<CheckboxProps & react.RefAttributes<HTMLSpanElement>>;

interface SwitchProps extends BooleanFieldProps {
}

declare const Switch: react.ForwardRefExoticComponent<SwitchProps & react.RefAttributes<HTMLSpanElement>>;

interface LegendProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {

    className?: string;

    children?: ReactNode;
}

declare const Legend: react.ForwardRefExoticComponent<LegendProps & react.RefAttributes<HTMLDivElement>>;
interface FieldsetProps extends Omit<HTMLAttributes<HTMLFieldSetElement>, 'className' | 'children'> {

    legend?: string;

    error?: string;

    helperText?: string;

    disabled?: boolean;

    className?: string;

    children: ReactNode;
}

declare const Fieldset: react.ForwardRefExoticComponent<FieldsetProps & react.RefAttributes<HTMLFieldSetElement>>;

interface RadioGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children' | 'defaultValue' | 'onChange'> {

    legend?: string;

    error?: string;

    helperText?: string;

    accent?: AccentToken;

    value?: string;

    defaultValue?: string;

    onValueChange?: (value: string) => void;

    name?: string;

    disabled?: boolean;

    readOnly?: boolean;

    required?: boolean;

    className?: string;

    children: ReactNode;
}

declare const RadioGroup: react.ForwardRefExoticComponent<RadioGroupProps & react.RefAttributes<HTMLDivElement>>;
interface RadioProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'className' | 'onChange'> {

    value: string;

    label?: string;

    helperText?: string;

    disabled?: boolean;

    className?: string;
}

declare const Radio: react.ForwardRefExoticComponent<RadioProps & react.RefAttributes<HTMLSpanElement>>;

interface SwatchProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {

    value: string;

    name: string;

    detail?: string;

    size?: 'sm' | 'md';
}
declare const Swatch: react.ForwardRefExoticComponent<SwatchProps & react.RefAttributes<HTMLDivElement>>;
interface SwatchGroupProps extends HTMLAttributes<HTMLElement> {

    title: string;

    entries: Record<string, string>;
    size?: SwatchProps['size'];
}

declare const SwatchGroup: react.ForwardRefExoticComponent<SwatchGroupProps & react.RefAttributes<HTMLElement>>;

type StatCardAccent = AccentToken;
interface StatCardProps {
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    subtitle?: string;
    icon?: ElementType<{
        className?: string;
    }>;
    accent?: StatCardAccent;
    className?: string;
}
declare function StatCard({ title, value, change, changeType, subtitle, icon: Icon, accent, className, }: StatCardProps): react.JSX.Element;

declare function Table({ className, containerClassName, label, ...props }: TableHTMLAttributes<HTMLTableElement> & {
    containerClassName?: string;

    label?: string;
}): react.JSX.Element;
declare function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>): react.JSX.Element;
declare function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>): react.JSX.Element;
declare function TableFooter({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>): react.JSX.Element;
declare function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>): react.JSX.Element;
declare function TableHead({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>): react.JSX.Element;
declare function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>): react.JSX.Element;
declare function TableCaption({ className, ...props }: HTMLAttributes<HTMLTableCaptionElement>): react.JSX.Element;

interface Column<T> {
    header: string;
    accessor: keyof T | ((row: T) => ReactNode);
    className?: string;
    enableSorting?: boolean;
    sortValue?: (row: T) => any;
}

interface DataTableVirtualization {

    height?: number;

    rowHeight?: number;

    overscan?: number;

    scrollElementRef?: RefObject<HTMLElement | null>;
}
type DataTableSharedProps<T> = {
    keyExtractor?: (row: T, index: number) => string | number;
    emptyText?: string;
    className?: string;
    containerClassName?: string;

    virtualize?: boolean | DataTableVirtualization;
};
type DataTableProps<T> = DataTableSharedProps<T> & ({

    table: Table$1<T>;
    columns?: never;
    data?: never;
} | {
    table?: never;

    columns: Column<T>[] | ColumnDef<T, any>[];
    data: T[];
    enableSorting?: boolean;
    pageSize?: number;
});
declare function DataTable<T>({ table: providedTable, columns, data, keyExtractor, emptyText, className, containerClassName, virtualize, ...rest }: DataTableProps<T>): react.JSX.Element;

interface ModalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children' | 'className'> {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;

    closeOnBackdropClick?: boolean;
    className?: string;
}

declare const Modal: react.ForwardRefExoticComponent<ModalProps & react.RefAttributes<HTMLDivElement>>;

interface AlertDialogProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children' | 'className'> {
    isOpen: boolean;

    onClose: () => void;

    onConfirm: () => void;
    title: string;

    children: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;

    footer?: ReactNode;
    className?: string;
}

declare const AlertDialog: react.ForwardRefExoticComponent<AlertDialogProps & react.RefAttributes<HTMLDivElement>>;

type DrawerPlacement = 'left' | 'right';
interface DrawerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children' | 'className'> {

    isOpen: boolean;

    onClose: () => void;

    title: string;

    children: ReactNode;

    placement?: DrawerPlacement;

    footer?: ReactNode;

    closeOnBackdropClick?: boolean;

    className?: string;
}

declare const Drawer: react.ForwardRefExoticComponent<DrawerProps & react.RefAttributes<HTMLDivElement>>;

interface SpinnerProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'className'> {

    label?: string;

    size?: 'sm' | 'md' | 'lg';

    accent?: AccentToken;

    className?: string;
}

declare const Spinner: react.ForwardRefExoticComponent<SpinnerProps & react.RefAttributes<HTMLSpanElement>>;

interface SkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {

    shape?: 'text' | 'heading' | 'block' | 'avatar';

    className?: string;
}

declare const Skeleton: react.ForwardRefExoticComponent<SkeletonProps & react.RefAttributes<HTMLDivElement>>;

interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'> {

    value?: number | null;

    max?: number;

    label: string;

    hideLabel?: boolean;

    showValue?: boolean;

    accent?: AccentToken;

    className?: string;
}

declare const Progress: react.ForwardRefExoticComponent<ProgressProps & react.RefAttributes<HTMLDivElement>>;

interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'className'> {

    icon?: ReactNode;

    title: string;

    description?: ReactNode;

    action?: ReactNode;

    children?: ReactNode;

    className?: string;
}

declare const EmptyState: react.ForwardRefExoticComponent<EmptyStateProps & react.RefAttributes<HTMLDivElement>>;

type ToastIntent = 'info' | 'success' | 'warning' | 'danger';

interface ToastActionOptions {

    label: string;

    onClick: () => void;
}

interface ToastOptions {

    title: string;

    description?: ReactNode;

    intent?: ToastIntent;

    action?: ToastActionOptions;

    timeout?: number;

    id?: string;

    onClose?: () => void;
}

interface ToastApi {

    show: (options: ToastOptions) => string;

    dismiss: (id?: string) => void;
}
interface ToastProviderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'className'> {

    children?: ReactNode;

    timeout?: number;

    limit?: number;

    label?: string;

    className?: string;
}

declare const ToastProvider: react.ForwardRefExoticComponent<ToastProviderProps & react.RefAttributes<HTMLDivElement>>;

declare function useToast(): ToastApi;

declare function useOptionalToast(): ToastApi | null;

declare const NERD_GLYPHS: {
    readonly sort: "";
    readonly 'sort-asc': "";
    readonly 'sort-desc': "";
    readonly 'chevron-right': "";
    readonly 'chevron-left': "";
    readonly 'chevron-up': "";
    readonly 'chevron-down': "";
    readonly 'arrow-right': "";
    readonly 'arrow-left': "";
    readonly 'arrow-up': "";
    readonly 'arrow-down': "";
    readonly expand: "";
    readonly compress: "";
    readonly 'git-branch': "";
    readonly 'git-commit': "";
    readonly 'git-merge': "";
    readonly 'git-pull-request': "";
    readonly docker: "";
    readonly kubernetes: "󱀹";
    readonly aws: "󰍝";
    readonly linux: "";
    readonly apple: "";
    readonly windows: "";
    readonly database: "";
    readonly server: "";
    readonly terminal: "";
    readonly code: "";
    readonly bug: "";
    readonly cpu: "󰌢";
    readonly ram: "󰌣";
    readonly search: "";
    readonly settings: "";
    readonly check: "";
    readonly close: "";
    readonly alert: "";
    readonly info: "";
    readonly help: "";
    readonly refresh: "";
    readonly sync: "";
    readonly copy: "";
    readonly 'external-link': "";
    readonly trash: "";
    readonly edit: "";
    readonly plus: "";
    readonly minus: "";
    readonly filter: "";
    readonly folder: "";
    readonly 'folder-open': "";
    readonly file: "";
    readonly 'file-code': "";
    readonly lock: "";
    readonly unlock: "";
    readonly link: "";
    readonly play: "";
    readonly pause: "";
    readonly stop: "";
};
type NerdIconName = keyof typeof NERD_GLYPHS;
type NerdIconAccent = 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
interface NerdIconProps extends HTMLAttributes<HTMLSpanElement> {

    name: NerdIconName;

    accent?: NerdIconAccent;

    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

    bracketed?: boolean;

    label?: string;
}

declare function NerdIcon({ name, accent, size, bracketed, label, className, ...props }: NerdIconProps): react.JSX.Element;

type SocialIconName = 'github' | 'linkedin' | 'bluesky' | 'x' | 'mail';
interface SocialIconProps extends Omit<SVGProps<SVGSVGElement>, 'color'> {

    name: SocialIconName;

    accent?: AccentToken;

    label?: string;

    href?: string;

    target?: AnchorHTMLAttributes<HTMLAnchorElement>['target'];

    rel?: string;
}

declare const SocialIcon: react.ForwardRefExoticComponent<Omit<SocialIconProps, "ref"> & react.RefAttributes<HTMLAnchorElement | SVGSVGElement>>;
type NamedSocialIconProps = Omit<SocialIconProps, 'name'>;

declare function GitHubIcon(props: NamedSocialIconProps): react.JSX.Element;

declare function LinkedInIcon(props: NamedSocialIconProps): react.JSX.Element;

declare function BlueskyIcon(props: NamedSocialIconProps): react.JSX.Element;

declare function XIcon(props: NamedSocialIconProps): react.JSX.Element;

declare function MailIcon(props: NamedSocialIconProps): react.JSX.Element;

interface GlyphProps extends HTMLAttributes<HTMLSpanElement> {

    name?: NerdIconName;

    accent?: NerdIconAccent;

    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

    bracketed?: boolean;

    children?: ReactNode;

    label?: string;
}

declare function Glyph({ name, accent, size, bracketed, children, label, className, ...props }: GlyphProps): react.JSX.Element;

interface BarChartDatum {
    label: string;
    value: number;
    accent?: AccentToken;
}
interface BarChartProps extends Omit<SVGProps<SVGSVGElement>, 'data'> {

    data: BarChartDatum[];

    width?: number;

    height?: number;

    responsive?: boolean;

    orientation?: 'vertical' | 'horizontal';

    accent?: AccentToken;

    showGrid?: boolean;

    showValues?: boolean;

    emptyMessage?: string;

    ariaLabel?: string;

    margin?: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };

    onBarClick?: (datum: BarChartDatum, index: number) => void;
}

declare const BarChart: react.ForwardRefExoticComponent<Omit<BarChartProps, "ref"> & react.RefAttributes<SVGSVGElement>>;

interface SparklineProps extends Omit<SVGProps<SVGSVGElement>, 'data'> {

    data: number[];

    width?: number;

    height?: number;

    accent?: AccentToken;

    showArea?: boolean;

    ariaLabel?: string;
}

declare const Sparkline: react.ForwardRefExoticComponent<Omit<SparklineProps, "ref"> & react.RefAttributes<SVGSVGElement>>;

interface ChartTooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    title?: ReactNode;
    accent?: AccentToken;
    top?: number;
    left?: number;
    children: ReactNode;
}

declare const ChartTooltip: react.ForwardRefExoticComponent<ChartTooltipProps & react.RefAttributes<HTMLDivElement>>;

interface BulletChartProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'color'> {

    value: number;

    target: number;

    bands?: number[];

    accent?: AccentToken;

    width?: number;

    height?: number;

    title?: string;

    summary?: string;

    label?: 'none' | 'value' | 'both';
}

declare const BulletChart: react.ForwardRefExoticComponent<BulletChartProps & react.RefAttributes<HTMLDivElement>>;

interface SlideProps {
    title?: string;
    subtitle?: string;
    children: react__default.ReactNode;

    speakerNotes?: string;
}
declare const Slide: react__default.FC<SlideProps>;

interface SlideDeckHotkey {

    hotkey: RegisterableHotkey;

    label: string;

    description: string;
    action: 'next' | 'previous' | 'fullscreen' | 'notes';

    preventsDefault?: boolean;

    requires?: 'notes';
}
declare const SLIDE_DECK_HOTKEYS: readonly SlideDeckHotkey[];
interface SlideDeckProps {
    children: react__default.ReactElement[];
    aspectRatio?: '16:9' | '4:3';

    autoPlayInterval?: number;

    slide?: number;

    onSlideChange?: (slide: number) => void;

    chrome?: boolean;
}

declare const SlideDeck: react__default.FC<SlideDeckProps>;

interface BlogPostProps {
    title: string;
    subtitle?: string;
    author?: string;
    date: string;

    readingTime?: string;

    tags?: string[];
    children: react__default.ReactNode;
}

declare const BlogPost: react__default.FC<BlogPostProps>;

declare const LoremIpsumPost: react__default.FC;

interface ExperimentItem {

    id: string;

    name: string;

    description: string;

    icon?: react__default.ReactNode;

    status: 'active' | 'archived' | 'experimental';

    componentCount: number;
}

declare const DEFAULT_EXPERIMENTS: ExperimentItem[];
interface ExperimentsViewProps {

    experiments?: readonly ExperimentItem[];

    onSelectExperiment?: (id: string) => void;
}

declare const ExperimentsView: react__default.FC<ExperimentsViewProps>;

declare const DesignSandbox: react__default.FC;

interface PricingTier {
    name: string;
    price: string;
    period?: string;
    description: string;
    features: string[];

    accent: 'primary' | 'secondary' | 'tertiary';
    highlighted?: boolean;
    ctaText?: string;
}

declare const DEFAULT_PRICING_TIERS: PricingTier[];

declare const DEFAULT_DEPLOY_LOG = "$ platform deploy --environment production\n[\u2713] Connecting to local datastore... OK\n[\u2713] Verifying 1,420 records against checksum... OK\n[\u2713] Running automation rules... APPLIED\n[\u2713] Versioned backup written to ./backups/2026-01-01/\n[*] Surface ready! Server active on http://localhost:8000";
interface SaasLandingPageProps {
    title?: string;
    subtitle?: string;
    pricingTiers?: PricingTier[];

    deployLog?: string;
}
declare const SaasLandingPage: react__default.FC<SaasLandingPageProps>;

interface AdminNavItem {
    id: string;
    label: string;

    icon?: ElementType<{
        className?: string;
    }>;
    badgeCount?: number;
}
declare const DEFAULT_ADMIN_NAV: AdminNavItem[];
interface AdminStatusBadge {
    id: string;
    label: string;
    accent?: AccentToken;

    icon?: ElementType<{
        className?: string;
    }>;
}

declare const DEFAULT_ADMIN_STATUS: AdminStatusBadge[];
interface AdminDashboardLayoutProps {
    appTitle?: string;
    navItems?: AdminNavItem[];

    statusBadges?: AdminStatusBadge[];
    activeNavId?: string;
    onNavSelect?: (id: string) => void;

    onTriggerSync?: () => void;
    children?: react__default.ReactNode;
}
declare const AdminDashboardLayout: react__default.FC<AdminDashboardLayoutProps>;

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
interface AnchorHeadingProps extends Omit<HTMLAttributes<HTMLHeadingElement>, 'id'> {
    level: HeadingLevel;
    children: ReactNode;

    id?: string;

    anchor?: boolean;

    emphasis?: AccentToken;
}

declare function AnchorHeading({ level, children, id, anchor, emphasis, className, ...rest }: AnchorHeadingProps): react.JSX.Element;

declare function createAnchorHeading(level: HeadingLevel): {
    ({ children, id, ...rest }: HTMLAttributes<HTMLHeadingElement>): react.JSX.Element;
    displayName: string;
};

interface Crumb {
    label: string;

    href?: string;
}
interface BreadcrumbsProps {
    items: readonly Crumb[];

    separator?: string;
    className?: string;
}

declare function Breadcrumbs({ items, separator, className }: BreadcrumbsProps): react.JSX.Element | null;

interface CodeBlockProps extends HTMLAttributes<HTMLPreElement> {
    children: ReactNode;

    title?: string;

    language?: string;

    copyable?: boolean;

    attached?: boolean;
}

declare const CodeBlockAttachment: react.Context<boolean>;

declare function CodeBlock({ children, title, language, copyable, attached, className, ...rest }: CodeBlockProps): react.JSX.Element;

type CodeTabsVariant = TabsVariant;
interface CodeTabProps {

    label: string;

    language?: string;
    children: ReactNode;
}

declare function CodeTab({ children }: CodeTabProps): react.JSX.Element;
interface CodeTabsProps {

    children: ReactNode;

    group?: string;
    variant?: CodeTabsVariant;

    accent?: AccentToken;

    label?: string;
    className?: string;
}
declare function CodeTabs({ children, group, variant, accent, label, className, }: CodeTabsProps): react.JSX.Element;

interface DocPagerTarget {
    label: string;
    href: string;
}
interface DocPagerProps {
    prev?: DocPagerTarget;
    next?: DocPagerTarget;
    className?: string;
}

declare function DocPager({ prev, next, className }: DocPagerProps): react.JSX.Element | null;

interface DocsNavItem {
    label: string;
    href: string;

    active?: boolean;
    external?: boolean;
}
interface DocsHeaderProps {

    title: string;

    titleHref?: string;

    icon?: ElementType<{
        className?: string;
    }>;

    nav?: readonly DocsNavItem[];

    onSearch?: () => void;

    searchShortcut?: string;

    onToggleSidebar?: () => void;
    sidebarOpen?: boolean;

    children?: ReactNode;
    className?: string;
}

declare function DocsHeader({ title, titleHref, icon: Icon, nav, onSearch, searchShortcut, onToggleSidebar, sidebarOpen, children, className, }: DocsHeaderProps): react.JSX.Element;

interface DocsLayoutProps {

    header?: ReactNode;

    sidebar?: ReactNode;

    toc?: ReactNode;
    children: ReactNode;

    sidebarOpen?: boolean;
    onCloseSidebar?: () => void;
    className?: string;
}

declare function DocsLayout({ header, sidebar, toc, children, sidebarOpen, onCloseSidebar, className, }: DocsLayoutProps): react.JSX.Element;

type DocsLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
};
interface DocsLinkProviderProps {

    component: ElementType<DocsLinkProps>;
    children: ReactNode;
}
declare function DocsLinkProvider({ component, children }: DocsLinkProviderProps): react.JSX.Element;
declare function useDocsLinkComponent(): ElementType<DocsLinkProps>;

declare function isExternalHref(href: string): boolean;

declare function DocsLink({ href, children, ...rest }: DocsLinkProps): react.JSX.Element;

interface DocsNavNode {
    label: string;

    href?: string;
    items?: readonly DocsNavNode[];

    defaultCollapsed?: boolean;
}
interface DocsSidebarProps {
    nav: readonly DocsNavNode[];

    currentPath?: string;

    label?: string | null;

    onNavigate?: () => void;
    className?: string;
}

declare function DocsSidebar({ nav, currentPath, label, onNavigate, className, }: DocsSidebarProps): react.JSX.Element;

interface ProseProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {
    children: ReactNode;

    brutalist?: boolean;
    className?: string;
}
declare function Prose({ children, brutalist, className, ...rest }: ProseProps): react.JSX.Element;

interface TocEntry {

    id: string;
    title: string;

    depth: number;
}
interface TableOfContentsProps {

    toc: readonly TocEntry[];

    fromDepth?: number;

    toDepth?: number;

    label?: string | null;

    spy?: boolean;
    className?: string;
}

declare function TableOfContents({ toc, fromDepth, toDepth, label, spy, className, }: TableOfContentsProps): react.JSX.Element | null;

declare function collectHeadings(container: ParentNode | null | undefined, selector?: string): TocEntry[];

declare function MdxPre({ children, ...rest }: HTMLAttributes<HTMLPreElement>): react.JSX.Element;
declare function MdxAnchor({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>): react.JSX.Element;

declare const mdxComponents: {
    h1: {
        ({ children, id, ...rest }: HTMLAttributes<HTMLHeadingElement>): react.JSX.Element;
        displayName: string;
    };
    h2: {
        ({ children, id, ...rest }: HTMLAttributes<HTMLHeadingElement>): react.JSX.Element;
        displayName: string;
    };
    h3: {
        ({ children, id, ...rest }: HTMLAttributes<HTMLHeadingElement>): react.JSX.Element;
        displayName: string;
    };
    h4: {
        ({ children, id, ...rest }: HTMLAttributes<HTMLHeadingElement>): react.JSX.Element;
        displayName: string;
    };
    h5: {
        ({ children, id, ...rest }: HTMLAttributes<HTMLHeadingElement>): react.JSX.Element;
        displayName: string;
    };
    h6: {
        ({ children, id, ...rest }: HTMLAttributes<HTMLHeadingElement>): react.JSX.Element;
        displayName: string;
    };
    pre: typeof MdxPre;
    a: typeof MdxAnchor;
    AnchorHeading: typeof AnchorHeading;
    NoteBlock: react.FC<NoteBlockProps>;
    TLDR: react.FC<TLDRProps>;
    Badge: react.ForwardRefExoticComponent<BadgeProps & react.RefAttributes<HTMLSpanElement>>;
    Card: typeof Card;
    Tag: react.ForwardRefExoticComponent<TagProps & react.RefAttributes<HTMLAnchorElement | HTMLSpanElement>>;
    AsciiDivider: react.FC<DividerProps>;
    CodeBlock: typeof CodeBlock;
    CodeTabs: typeof CodeTabs;
    CodeTab: typeof CodeTab;
};
type MdxComponents = typeof mdxComponents;

export {
  ANSI_SLOTS,
  type AccentToken,
  AdminDashboardLayout,
  type AdminDashboardLayoutProps,
  type AdminNavItem,
  type AdminStatusBadge,
  AlertDialog,
  type AlertDialogProps,
  AnchorHeading,
  type AnchorHeadingProps,
  type AnsiChrome,
  type AnsiHue,
  type AnsiScheme,
  type AnsiSlot,
  AsciiDivider,
  type AsciiDividerProps,
  Avatar,
  type AvatarProps,
  Badge,
  type BadgeProps,
  BarChart,
  type BarChartDatum,
  type BarChartProps,
  BlogPost,
  type BlogPostProps,
  BlueskyIcon,
  type BorderTone,
  BracketText,
  type BracketTextProps,
  Breadcrumbs,
  type BreadcrumbsProps,
  type BrutalistTheme,
  BulletChart,
  type BulletChartProps,
  Button,
  type ButtonElementProps,
  type ButtonLinkProps,
  type ButtonProps,
  type ButtonVariant,
  CSS_MEDIUM,
  Card,
  type CardProps,
  type CardVariant,
  ChartTooltip,
  type ChartTooltipProps,
  Checkbox,
  type CheckboxProps,
  type ClassInput,
  CodeBlock,
  CodeBlockAttachment,
  type CodeBlockProps,
  CodeTab,
  type CodeTabProps,
  CodeTabs,
  type CodeTabsProps,
  type CodeTabsVariant,
  type Column,
  type ContrastCheck,
  type ContrastFloor,
  type Crumb,
  DEFAULT_ADMIN_NAV,
  DEFAULT_ADMIN_STATUS,
  DEFAULT_DEPLOY_LOG,
  DEFAULT_EXPERIMENTS,
  DEFAULT_LEVEL,
  DEFAULT_PRICING_TIERS,
  DIVIDER_PATTERNS,
  DataTable,
  type DataTableProps,
  type DataTableVirtualization,
  DesignSandbox,
  Divider,
  type DividerProps,
  type DividerVariant,
  DocPager,
  type DocPagerProps,
  type DocPagerTarget,
  DocsHeader,
  type DocsHeaderProps,
  DocsLayout,
  type DocsLayoutProps,
  DocsLink,
  type DocsLinkProps,
  DocsLinkProvider,
  type DocsLinkProviderProps,
  type DocsNavItem,
  type DocsNavNode,
  DocsSidebar,
  type DocsSidebarProps,
  Drawer,
  type DrawerPlacement,
  type DrawerProps,
  type Emphasis,
  EmptyState,
  type EmptyStateProps,
  type ExperimentItem,
  ExperimentsView,
  type ExperimentsViewProps,
  FIXED_COLOURS,
  Fieldset,
  type FieldsetProps,
  type Finding,
  type FixedColour,
  GitHubIcon,
  Glyph,
  type GlyphProps,
  HEADING_EMPHASIS,
  type HeadingLevel,
  type Hue,
  type HueAgreementCheck,
  type HueRef,
  Input,
  type InputProps,
  type Intent,
  LEVELS,
  Legend,
  type LegendProps,
  type LevelDefinition,
  LinkedInIcon,
  LoremIpsumPost,
  MAXIMUM_NEUTRAL_CHROMA,
  MEDIA,
  MEDIA_DEFINITIONS,
  MINIMUM_RATIO,
  MailIcon,
  type MdxComponents,
  type Medium,
  type MediumDefinition,
  Modal,
  type ModalProps,
  type Motion,
  NERD_GLYPHS,
  NerdIcon,
  type NerdIconAccent,
  type NerdIconName,
  type NerdIconProps,
  NoteBlock,
  type NoteBlockProps,
  PALETTE_HUES,
  PageHeader,
  type PageHeaderProps,
  PageTitle,
  type PageTitleProps,
  Pagination,
  type PaginationProps,
  type Polarity,
  type PricingTier,
  Progress,
  type ProgressProps,
  Prose,
  type ProseProps,
  RECOMMENDED_COLOURS,
  RECOMMENDED_COLOUR_CLASSES,
  RECOMMENDED_COLOUR_NAMESPACES,
  RECOMMENDED_COLOUR_PROPERTIES,
  RECOMMENDED_COLOUR_ROLES,
  RECOMMENDED_COLOUR_VARS,
  Radio,
  RadioGroup,
  type RadioGroupProps,
  type RadioProps,
  type RecommendedColourClass,
  type RecommendedColourNamespace,
  type RecommendedColourProperty,
  type RecommendedThemeColours,
  ReportDetails,
  type ReportDetailsProps,
  ReportDocument,
  type ReportDocumentProps,
  type ReportMetaItem,
  ReportSection,
  type ReportSectionProps,
  type Rgb,
  SLIDE_DECK_HOTKEYS,
  SLOTS,
  SYSTEM_LEVEL,
  SaasLandingPage,
  type SaasLandingPageProps,
  SectionContainer,
  type SectionContainerProps,
  Select,
  type SelectOption,
  type SelectProps,
  type SelectionDevice,
  type SelectionDeviceCheck,
  Skeleton,
  type SkeletonProps,
  Slide,
  SlideDeck,
  type SlideDeckHotkey,
  type SlideDeckProps,
  type SlideProps,
  Slugger,
  SocialIcon,
  type SocialIconName,
  type SocialIconProps,
  Sparkline,
  type SparklineProps,
  Spinner,
  type SpinnerProps,
  StatCard,
  type StatCardAccent,
  type StatCardProps,
  type Surface,
  Swatch,
  SwatchGroup,
  type SwatchGroupProps,
  type SwatchProps,
  Switch,
  type SwitchProps,
  THEME_ATTRIBUTE,
  THEME_LEVELS,
  THEME_STORAGE_KEY,
  TLDR,
  type TLDRProps,
  TOKEN_RULES,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableOfContents,
  type TableOfContentsProps,
  TableRow,
  Tabs,
  TabsList,
  type TabsListProps,
  type TabsOrientation,
  TabsPanel,
  type TabsPanelProps,
  type TabsProps,
  TabsTab,
  type TabsTabProps,
  type TabsVariant,
  Tag,
  type TagProps,
  TextArea,
  type TextAreaProps,
  type TextTone,
  type ThemeContextValue,
  type ThemeLevel,
  ThemeProvider,
  type ThemeProviderProps,
  type ToastActionOptions,
  type ToastApi,
  type ToastIntent,
  type ToastOptions,
  ToastProvider,
  type ToastProviderProps,
  type TocEntry,
  type TokenRule,
  type TypeStep,
  type TypeStepName,
  type UseActiveHeadingOptions,
  type UseCopyToClipboardResult,
  WEB_FLOOR,
  XIcon,
  accentVar,
  ansiScheme,
  assertNever,
  auditContrast,
  auditHueAgreement,
  auditSelectionDevices,
  borderVar,
  childrenToText,
  cn,
  collectHeadings,
  composite,
  contrastRatio,
  createAnchorHeading,
  fontVar,
  getRecommendedColours,
  getThemeInitScript,
  isExternalHref,
  isMedium,
  isRecommendedColourClass,
  isThemeLevel,
  mdxComponents,
  nextLevel,
  parseColor,
  relativeLuminance,
  scanRules,
  scanTokenRules,
  semanticTokens,
  slugify,
  surfaceVar,
  textVar,
  useActiveHeading,
  useCopyToClipboard,
  useDocsLinkComponent,
  useOptionalTheme,
  useOptionalToast,
  useTheme,
  useToast,
};
