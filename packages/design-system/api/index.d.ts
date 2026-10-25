import * as react from 'react';
import react__default, { ReactNode, DetailedHTMLProps, ButtonHTMLAttributes, AnchorHTMLAttributes, HTMLAttributes, ElementType, MouseEventHandler, InputHTMLAttributes, TextareaHTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes, RefObject, ReactElement, SVGProps } from 'react';
import { Table as Table$1, ColumnDef } from '@tanstack/react-table';
import { RegisterableHotkey } from '@tanstack/react-hotkeys';
export { ParentSize as ResponsiveChartContainer } from '@visx/responsive';
export { useTooltip as useChartTooltip } from '@visx/tooltip';

type Emphasis = 'primary' | 'secondary' | 'tertiary' | 'quiet';

type Intent = 'info' | 'success' | 'warning' | 'danger';

type Delta = 'added' | 'removed' | 'moved';

type DeltaGround = 'added' | 'removed' | 'hunk';

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
    readonly delta: Record<Delta, string>;
    readonly deltaGround: Record<DeltaGround, string>;
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

    readonly delta: Readonly<Record<Delta, string>>;

    readonly deltaGround: Readonly<Record<DeltaGround, string>>;

    readonly palette: Readonly<Record<Hue, string>>;

    readonly paletteBright: Readonly<Record<Hue, string>>;

    readonly accentHue: Readonly<Record<Emphasis, HueRef>>;

    readonly intentHue: Readonly<Record<Intent, HueRef>>;

    readonly deltaHue: Readonly<Record<Delta, HueRef>>;

    readonly shadow: string;
}

declare const LEVELS: Readonly<Record<ThemeLevel, LevelDefinition>>;

declare const DEFAULT_LEVEL: ThemeLevel;

declare const SYSTEM_LEVEL: Readonly<Record<Polarity, ThemeLevel>>;

declare const INK_WEIGHT: Readonly<Record<Polarity, number>>;

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

declare function apcaContrast(foreground: string, background: string): number;

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

    apca: number | null;
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

interface TextHierarchyStep {
    level: ThemeLevel;
    ground: string;

    lc: Readonly<Record<'primary' | 'secondary' | 'muted', number>>;

    mutedStep: number;
}
declare function auditTextHierarchy(ladder: Readonly<Record<ThemeLevel, LevelDefinition>>): TextHierarchyStep[];

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

interface UseTraceClockOptions {

    running?: boolean;

    interval?: number;

    read?: () => number;
}

declare function useTraceClock({ running, interval, read }?: UseTraceClockOptions): number;

interface UseTraceReplayOptions {

    autoPlay?: boolean;

    loop?: boolean;

    speed?: number;

    loopDelay?: number;
}
interface TraceReplay {

    elapsed: number;
    playing: boolean;
    speed: number;
    play: () => void;
    pause: () => void;
    toggle: () => void;

    restart: () => void;

    seek: (elapsed: number) => void;
    setSpeed: (speed: number) => void;
}

declare function useTraceReplay(duration: number, { autoPlay, loop, speed: initialSpeed, loopDelay }?: UseTraceReplayOptions): TraceReplay;

interface ButtonOwnProps {

    children: ReactNode;

    variant?: ButtonVariant;

    appearance: ButtonAppearance;

    size?: 'sm' | 'md' | 'lg';

    bracketed?: boolean;

    className?: string;
}

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'default';

type ButtonAppearance = 'raised' | 'flat' | 'outline';

declare const BUTTON_APPEARANCES: readonly ButtonAppearance[];

type ButtonElementProps = ButtonOwnProps & DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
    href?: never;

    pending?: boolean;

    pendingLabel?: string;
};

type ButtonLinkProps = ButtonOwnProps & DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> & {

    href: string;

    pending?: never;

    pendingLabel?: never;
};
type ButtonProps = ButtonElementProps | ButtonLinkProps;

declare const Button: react.ForwardRefExoticComponent<(Omit<ButtonElementProps, "ref"> | Omit<ButtonLinkProps, "ref">) & react.RefAttributes<HTMLButtonElement | HTMLAnchorElement>>;

type CardVariant = 'panel' | 'card';

type CardWeight = 'strong' | 'quiet';
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

    weight?: CardWeight;
}

declare const Card: react.ForwardRefExoticComponent<CardProps & react.RefAttributes<HTMLDivElement>>;

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

type AssessmentOutcome = 'pass' | 'warn' | 'fail' | 'needs-review' | 'inconclusive' | 'none';

type DeltaStatus = 'unchanged' | 'changed' | 'unavailable' | 'invalid' | 'incompatible' | 'inconclusive' | 'unsupported';

type EvidenceStatus = 'produced' | 'unavailable' | 'invalid' | 'inconclusive';

type TrustStatus = 'trusted' | 'candidate' | 'untrusted' | 'missing' | 'corrupt' | 'incompatible';

interface StatusVocabularies {
    outcome: AssessmentOutcome;
    delta: DeltaStatus;
    evidence: EvidenceStatus;
    trust: TrustStatus;
}
type StatusVocabulary = keyof StatusVocabularies;

type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'hollow';
interface StatusAppearance {
    glyph: string;
    tone: StatusTone;

    word: string;
}
declare const STATUS_APPEARANCE: {
    readonly [V in StatusVocabulary]: Readonly<Record<StatusVocabularies[V], StatusAppearance>>;
};

declare const STATUS_TONE_TEXT: Readonly<Record<StatusTone, string>>;

declare function statusAppearance<V extends StatusVocabulary>(vocabulary: V, status: StatusVocabularies[V]): StatusAppearance;

type DiffLineKind = 'added' | 'removed' | 'context';

interface DiffLineComment {

    author: string;

    meta?: string;

    body: ReactNode;
}
interface DiffLine {

    kind: DiffLineKind;

    oldNumber?: number;

    newNumber?: number;

    text: string;

    comments?: readonly DiffLineComment[];
}
interface DiffHunk {

    header: string;

    lines: DiffLine[];
}

declare function parseUnifiedDiff(text: string): DiffHunk[];

declare function countDiff(hunks: readonly DiffHunk[]): {
    added: number;
    removed: number;
};

declare function diffAnchor(path: string): string;

type StatusMarkOwnProps = {
    [V in StatusVocabulary]: {

        vocabulary: V;

        status: StatusVocabularies[V];
    };
}[StatusVocabulary];
type StatusMarkProps = StatusMarkOwnProps & Omit<react.HTMLAttributes<HTMLSpanElement>, 'children'> & {

    label?: string;

    className?: string;
};

declare const StatusMark: react.ForwardRefExoticComponent<StatusMarkProps & react.RefAttributes<HTMLSpanElement>>;

interface VerdictBandProps extends Omit<react.HTMLAttributes<HTMLDivElement>, 'title'> {

    outcome: AssessmentOutcome;

    title: ReactNode;

    children?: ReactNode;

    label?: string;

    className?: string;
}

declare const VerdictBand: react.ForwardRefExoticComponent<VerdictBandProps & react.RefAttributes<HTMLDivElement>>;

interface ProvenanceItem {

    label: string;

    value: ReactNode;

    note?: ReactNode;
}
interface ProvenanceStripProps extends react.HTMLAttributes<HTMLElement> {

    label?: string;

    items: readonly ProvenanceItem[];

    className?: string;
}

declare const ProvenanceStrip: react.ForwardRefExoticComponent<ProvenanceStripProps & react.RefAttributes<HTMLElement>>;

type MetricDirection = 'higher-is-better' | 'lower-is-better';
interface DeltaValueProps extends Omit<react.HTMLAttributes<HTMLSpanElement>, 'children'> {

    before?: number | null;

    after?: number | null;

    unit?: string;

    direction?: MetricDirection;

    relative?: boolean;

    format?: (value: number) => string;

    className?: string;
}

declare function deltaTrend(change: number, direction?: MetricDirection): 'against' | 'with' | undefined;

declare const DeltaValue: react.ForwardRefExoticComponent<DeltaValueProps & react.RefAttributes<HTMLSpanElement>>;

interface ChangeCountProps extends Omit<react.HTMLAttributes<HTMLSpanElement>, 'children'> {

    added: number;

    removed: number;

    moved?: number;

    noun?: readonly [one: string, other: string];

    className?: string;
}

declare const ChangeCount: react.ForwardRefExoticComponent<ChangeCountProps & react.RefAttributes<HTMLSpanElement>>;

interface ChangeBarProps extends Omit<react.SVGAttributes<SVGSVGElement>, 'children'> {

    added: number;

    removed: number;

    max?: number;

    label?: string;

    className?: string;
}

declare const ChangeBar: react.ForwardRefExoticComponent<ChangeBarProps & react.RefAttributes<SVGSVGElement>>;

interface ChangeIndexFile {

    path: string;

    added: number;

    removed: number;

    href?: string;
}
interface ChangeIndexGroup {

    title: string;

    files: readonly ChangeIndexFile[];
}
interface ChangeIndexProps extends react.HTMLAttributes<HTMLElement> {

    label?: string;

    groups: readonly ChangeIndexGroup[];

    emptyText?: react.ReactNode;

    className?: string;
}

declare const ChangeIndex: react.ForwardRefExoticComponent<ChangeIndexProps & react.RefAttributes<HTMLElement>>;

interface DiffViewProps extends Omit<react.HTMLAttributes<HTMLElement>, 'children'> {

    path: string;

    hunks: readonly DiffHunk[];

    collapsible?: boolean;

    defaultOpen?: boolean;

    wrap?: boolean;

    max?: number;

    className?: string;
}

declare const DiffView: react.ForwardRefExoticComponent<DiffViewProps & react.RefAttributes<HTMLElement>>;

type KeyedChange = 'added' | 'removed' | 'changed' | 'renamed' | 'unchanged';
interface KeyedDiffRow {

    identity: ReactNode;

    change: KeyedChange;

    cells?: readonly ReactNode[];
}
interface KeyedDiffProps extends react.HTMLAttributes<HTMLDivElement> {

    caption: ReactNode;

    identityLabel?: string;

    columns?: readonly string[];

    rows: readonly KeyedDiffRow[];

    emptyText?: ReactNode;

    changeLabels?: Partial<Record<KeyedChange, string>>;

    className?: string;
}

declare const KeyedDiff: react.ForwardRefExoticComponent<KeyedDiffProps & react.RefAttributes<HTMLDivElement>>;

interface ReviewValue {
    before?: number | null;
    after?: number | null;
    direction?: MetricDirection;
    unit?: string;
}
interface ReviewColumn {

    label: string;
    direction?: MetricDirection;
    unit?: string;
}

interface ReviewMeasurementTable {
    caption: string;

    identityLabel: string;
    columns: readonly ReviewColumn[];
    rows: readonly {
        identity: string;
        values: readonly ReviewValue[];
    }[];
}

interface ReviewRecordTable {
    caption: string;
    identityLabel: string;
    columns: readonly ReviewColumn[];
    rows: readonly {
        identity: string;
        change: KeyedChange;
        values: readonly ReviewValue[];
    }[];
}

interface ReviewFileGroup {
    title: string;
    files: readonly {
        path: string;
        hunks: readonly DiffHunk[];
    }[];
}

interface ReviewReportData {
    title: string;

    subtitle?: string;

    meta?: readonly ReportMetaItem[];

    outcome: AssessmentOutcome;

    verdict: string;

    verdictContext?: string;

    provenance: readonly ProvenanceItem[];

    figures?: readonly {
        label: string;
        value: string;
        note?: string;
    }[];

    measurements?: readonly ReviewMeasurementTable[];

    records?: ReviewRecordTable;

    caveats?: readonly {
        title: string;
        body: ReactNode;
    }[];

    files: readonly ReviewFileGroup[];
}
interface ReviewReportPageProps extends Omit<react.HTMLAttributes<HTMLElement>, 'title'> {

    report: ReviewReportData;

    className?: string;
}

declare const ReviewReportPage: react.ForwardRefExoticComponent<ReviewReportPageProps & react.RefAttributes<HTMLElement>>;

type PullRequestState = 'open' | 'draft' | 'merged' | 'closed';
type ReviewerState = 'approved' | 'changes-requested' | 'commented' | 'pending';

interface PullRequestCheck {
    name: string;
    status: AssessmentOutcome;

    label?: string;

    summary?: string;

    duration?: string;
}

interface PullRequestData {

    repository: string;
    number: number;
    title: string;
    state: PullRequestState;
    author: string;

    base: string;

    head: string;

    opened: string;
    labels?: readonly string[];

    description: readonly ReactNode[];
    reviewers: readonly {
        name: string;
        state: ReviewerState;
    }[];
    checks: readonly PullRequestCheck[];

    verdict?: {
        outcome: AssessmentOutcome;
        title: string;
        context?: string;
    };

    conversation?: readonly {
        author: string;
        meta?: string;
        body: ReactNode;
    }[];

    files: readonly {
        path: string;
        hunks: readonly DiffHunk[];
    }[];
}
interface PullRequestPageProps extends react.HTMLAttributes<HTMLElement> {

    pullRequest: PullRequestData;

    className?: string;
}

declare const PullRequestPage: react.ForwardRefExoticComponent<PullRequestPageProps & react.RefAttributes<HTMLElement>>;

declare const SAMPLE_BASELINE_COMMIT = "216f6fc28cec75077f5b8fa90cd3d7055e81db7b";
declare const SAMPLE_DUPLICATION_HUNKS: DiffHunk[];
declare const SAMPLE_METRICS_HUNKS: DiffHunk[];
declare const SAMPLE_CALLGRAPH_HUNKS: DiffHunk[];
declare const DEFAULT_REVIEW_REPORT: ReviewReportData;
declare const DEFAULT_PULL_REQUEST: PullRequestData;

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

    framed?: boolean;
    className?: string;
}
declare function PageTitle({ children, subtitle, bracketed, framed, className, ...props }: PageTitleProps): react.JSX.Element;

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
declare const Tag: react.ForwardRefExoticComponent<TagProps & react.RefAttributes<HTMLSpanElement | HTMLAnchorElement>>;

interface PaginationProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {

    totalPages: number;

    currentPage: number;

    onPageChange?: (page: number) => void;

    getPageHref?: (page: number) => string;

    className?: string;
}

declare const Pagination: react.ForwardRefExoticComponent<PaginationProps & react.RefAttributes<HTMLDivElement>>;

type TabsOrientation = 'horizontal' | 'vertical';

type TabsFont = 'sans' | 'mono';

type TabsVariant = 'merged' | 'underline' | 'segmented';
interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {

    value?: string;

    defaultValue?: string;

    onValueChange?: (value: string) => void;

    orientation?: TabsOrientation;

    variant?: TabsVariant;

    font?: TabsFont;

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

declare const DIVIDER_MARKS: Readonly<Record<Polarity, {
    start: string;
    fill: string;
    end: string;
}>>;
interface DividerProps extends react__default.HTMLAttributes<HTMLDivElement> {

    variant?: DividerVariant;

    pattern?: string;
}
declare const Divider: react__default.FC<DividerProps>;

type AsciiDividerProps = DividerProps;

declare const AsciiDivider: react__default.FC<AsciiDividerProps>;

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

declare const ThemeProvider: react__default.FC<ThemeProviderProps>;
declare const useTheme: () => ThemeContextValue;

declare const useOptionalTheme: () => ThemeContextValue | undefined;

declare const THEME_STORAGE_KEY = "ds-theme-level";

declare const THEME_ATTRIBUTE = "data-theme";

declare function getThemeInitScript(options?: {
    defaultLevel?: ThemeLevel;
    followSystem?: boolean;
}): string;

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

className, id, style, ...props }: InputProps): react.JSX.Element;
interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>, FieldProps {
}
declare function TextArea({ label, error, helperText,

accent,

className, id, style, ...props }: TextAreaProps): react.JSX.Element;

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

interface ErrorSummaryError {

    id: string;

    message: string;
}
interface ErrorSummaryProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'className' | 'children'> {

    errors: readonly ErrorSummaryError[];

    title?: string;

    headingLevel?: 2 | 3 | 4 | 5 | 6;

    focusOnAppear?: boolean;

    children?: ReactNode;

    className?: string;
}

declare const ErrorSummary: react.ForwardRefExoticComponent<ErrorSummaryProps & react.RefAttributes<HTMLElement>>;

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

type StatCardAppearance = 'boxed' | 'quiet';
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

    appearance?: StatCardAppearance;
    className?: string;
}
declare function StatCard({ title, value, change, changeType, subtitle, icon: Icon, accent, appearance, className, }: StatCardProps): react.JSX.Element;

type TableAppearance = 'grid' | 'quiet' | 'index';

type TableDensity = 'comfortable' | 'compact';
declare function Table({ className, containerClassName, label, appearance, density, ...props }: TableHTMLAttributes<HTMLTableElement> & {
    containerClassName?: string;

    label?: string;

    appearance?: TableAppearance;

    density?: TableDensity;
}): react.JSX.Element;
declare function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>): react.JSX.Element;
declare function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>): react.JSX.Element;
declare function TableFooter({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>): react.JSX.Element;
declare function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>): react.JSX.Element;

declare function TableHead({ className, scope, ...props }: ThHTMLAttributes<HTMLTableCellElement>): react.JSX.Element;
declare function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>): react.JSX.Element;
declare function TableCaption({ className, ...props }: HTMLAttributes<HTMLTableCaptionElement>): react.JSX.Element;

interface Column<T> {
    header: string;
    accessor: keyof T | ((row: T) => ReactNode);
    className?: string;
    enableSorting?: boolean;
    sortValue?: (row: T) => any;

    rowHeader?: boolean;
}

interface DataTableVirtualization {

    height?: number;

    rowHeight?: number;

    overscan?: number;

    scrollElementRef?: RefObject<HTMLElement | null>;
}
type DataTableSharedProps<T> = {

    appearance?: TableAppearance;

    density?: TableDensity;

    keyExtractor?: (row: T, index: number) => string | number;

    caption?: ReactNode;
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

declare function DataTable<T>({ table: providedTable, columns, data, keyExtractor, caption, appearance, density, emptyText, className, containerClassName, virtualize, ...rest }: DataTableProps<T>): react.JSX.Element;

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

interface AppShellProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {

    sidebar?: ReactNode;

    topbar?: ReactNode;

    children: ReactNode;

    sidebarOpen?: boolean;

    defaultSidebarOpen?: boolean;

    onSidebarOpenChange?: (open: boolean) => void;

    className?: string;
}

declare const AppShell: react.ForwardRefExoticComponent<AppShellProps & react.RefAttributes<HTMLDivElement>>;
interface AppSidebarProps extends Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'> {

    label: string;

    header?: ReactNode;

    children: ReactNode;

    footer?: ReactNode;

    className?: string;
}

declare const AppSidebar: react.ForwardRefExoticComponent<AppSidebarProps & react.RefAttributes<HTMLElement>>;

interface AppNavItem {

    id: string;

    label: ReactNode;

    href?: string;

    icon?: ElementType<{
        className?: string;
    }>;

    badge?: ReactNode;

    items?: readonly AppNavItem[];
}
interface AppSidebarNavProps extends Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'> {

    label: string;

    items: readonly AppNavItem[];

    activeId?: string;

    onNavigate?: (id: string) => void;

    heading?: ReactNode;

    className?: string;
}

declare const AppSidebarNav: react.ForwardRefExoticComponent<AppSidebarNavProps & react.RefAttributes<HTMLElement>>;
interface AppTopbarProps extends Omit<HTMLAttributes<HTMLElement>, 'className'> {

    label?: string;

    children?: ReactNode;

    actions?: ReactNode;

    sidebarToggleLabel?: string;

    className?: string;
}

declare const AppTopbar: react.ForwardRefExoticComponent<AppTopbarProps & react.RefAttributes<HTMLElement>>;
interface AppMainProps extends Omit<HTMLAttributes<HTMLElement>, 'className'> {

    label?: string;

    children: ReactNode;

    className?: string;
}

declare const AppMain: react.ForwardRefExoticComponent<AppMainProps & react.RefAttributes<HTMLElement>>;

interface SpinnerProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'className'> {

    label?: string;

    size?: 'sm' | 'md' | 'lg';

    accent?: AccentToken | 'current';

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

    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;

    description?: ReactNode;

    action?: ReactNode;

    children?: ReactNode;

    className?: string;
}

declare const EmptyState: react.ForwardRefExoticComponent<EmptyStateProps & react.RefAttributes<HTMLDivElement>>;

interface StatusPageProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children' | 'className'> {

    title: string;

    code?: ReactNode;

    description?: ReactNode;

    action?: ReactNode;

    children?: ReactNode;

    standalone?: boolean;

    className?: string;
}

declare const StatusPage: react.ForwardRefExoticComponent<StatusPageProps & react.RefAttributes<HTMLElement>>;

interface StatusPagePresetProps extends Omit<StatusPageProps, 'title'> {

    homeHref?: string;

    homeLabel?: string;
}
interface NotFoundPageProps extends StatusPagePresetProps {

    title?: string;
}

declare const NotFoundPage: react.ForwardRefExoticComponent<NotFoundPageProps & react.RefAttributes<HTMLElement>>;
interface ServerErrorPageProps extends StatusPagePresetProps {

    title?: string;

    standalone?: boolean;
}

declare const ServerErrorPage: react.ForwardRefExoticComponent<ServerErrorPageProps & react.RefAttributes<HTMLElement>>;

type OverlaySide = 'top' | 'bottom' | 'left' | 'right';

type OverlayAlign = 'start' | 'center' | 'end';
interface TooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content' | 'children' | 'className'> {

    content: ReactNode;

    children: ReactElement;

    side?: OverlaySide;

    align?: OverlayAlign;

    delay?: number;

    open?: boolean;

    defaultOpen?: boolean;

    onOpenChange?: (open: boolean) => void;

    disabled?: boolean;

    className?: string;
}

declare const Tooltip: react.ForwardRefExoticComponent<TooltipProps & react.RefAttributes<HTMLDivElement>>;

interface PopoverProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children' | 'className'> {

    trigger: ReactElement;

    title: string;

    children: ReactNode;

    side?: OverlaySide;

    align?: OverlayAlign;

    open?: boolean;

    defaultOpen?: boolean;

    onOpenChange?: (open: boolean) => void;

    className?: string;
}

declare const Popover: react.ForwardRefExoticComponent<PopoverProps & react.RefAttributes<HTMLDivElement>>;

interface MenuProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'className'> {

    trigger: ReactElement;

    children: ReactNode;

    side?: OverlaySide;

    align?: OverlayAlign;

    open?: boolean;

    defaultOpen?: boolean;

    onOpenChange?: (open: boolean) => void;

    className?: string;
}

declare const Menu: react.ForwardRefExoticComponent<MenuProps & react.RefAttributes<HTMLDivElement>>;
interface MenuItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {

    children: ReactNode;

    intent?: 'danger';

    disabled?: boolean;

    closeOnClick?: boolean;

    className?: string;
}

declare const MenuItem: react.ForwardRefExoticComponent<MenuItemProps & react.RefAttributes<HTMLDivElement>>;
interface MenuRadioGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange' | 'className'> {

    label?: string;

    value?: string;

    defaultValue?: string;

    onValueChange?: (value: string) => void;

    children: ReactNode;

    className?: string;
}

declare const MenuRadioGroup: react.ForwardRefExoticComponent<MenuRadioGroupProps & react.RefAttributes<HTMLDivElement>>;
interface MenuRadioItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {

    value: string;

    children: ReactNode;

    closeOnClick?: boolean;

    className?: string;
}

declare const MenuRadioItem: react.ForwardRefExoticComponent<MenuRadioItemProps & react.RefAttributes<HTMLDivElement>>;
interface MenuSeparatorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {

    className?: string;
}

declare const MenuSeparator: react.ForwardRefExoticComponent<MenuSeparatorProps & react.RefAttributes<HTMLDivElement>>;

type LinkComponentProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
};
interface LinkProviderProps {

    component?: ElementType<LinkComponentProps>;

    isCurrent?: (href: string) => boolean;
    children: ReactNode;
}

declare function LinkProvider({ component, isCurrent, children }: LinkProviderProps): react.JSX.Element;

declare function useLinkComponent(): ElementType<LinkComponentProps>;

declare function isExternalHref(href: string): boolean;

declare function useIsCurrentHref(href: string): boolean;
interface SiteLinkProps extends LinkComponentProps {

    current?: boolean;

    className?: string;
}

declare const SiteLink: react.ForwardRefExoticComponent<SiteLinkProps & react.RefAttributes<HTMLAnchorElement>>;

type SiteHeaderCollapse = 'sm' | 'md' | 'lg';
interface SiteHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'className'> {

    brand: ReactNode;

    brandHref?: string;

    nav?: ReactNode;

    mobileNav?: ReactNode;

    actions?: ReactNode;

    collapseAt?: SiteHeaderCollapse;

    skipTo?: string | false;

    skipLabel?: string;

    sticky?: boolean;

    className?: string;
}

declare const SiteHeader: react.ForwardRefExoticComponent<SiteHeaderProps & react.RefAttributes<HTMLElement>>;

type SiteNavOrientation = 'horizontal' | 'vertical';
interface SiteNavProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'className' | 'aria-label'> {

    label: string;

    children: ReactNode;

    orientation?: SiteNavOrientation;

    className?: string;
}

declare const SiteNav: react.ForwardRefExoticComponent<SiteNavProps & react.RefAttributes<HTMLElement>>;

interface SiteNavLinkItemProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children' | 'className'> {

    href: string;

    children: ReactNode;

    current?: boolean;

    className?: string;
    label?: never;
    defaultOpen?: never;
}

interface SiteNavGroupItemProps {

    label: string;

    children: ReactNode;

    defaultOpen?: boolean;

    className?: string;
    href?: never;
    current?: never;
}
type SiteNavItemProps = SiteNavLinkItemProps | SiteNavGroupItemProps;

declare const SiteNavItem: react.ForwardRefExoticComponent<SiteNavItemProps & react.RefAttributes<HTMLButtonElement | HTMLAnchorElement>>;

interface MobileNavProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title' | 'className'> {

    label: string;

    children: ReactNode;

    title?: string;

    triggerLabel?: string;

    open?: boolean;

    defaultOpen?: boolean;

    onOpenChange?: (open: boolean) => void;

    footer?: ReactNode;

    className?: string;
}

declare const MobileNav: react.ForwardRefExoticComponent<MobileNavProps & react.RefAttributes<HTMLDivElement>>;

interface SiteFooterProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'className'> {

    children?: ReactNode;

    nav?: ReactNode;

    meta?: ReactNode;

    className?: string;
}

declare const SiteFooter: react.ForwardRefExoticComponent<SiteFooterProps & react.RefAttributes<HTMLElement>>;

type SectionColumns = 2 | 3 | 4;

type SectionAlign = 'center' | 'start';

interface HeroProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children' | 'className'> {

    title: ReactNode;

    subtitle?: string;

    eyebrow?: ReactNode;

    actions?: ReactNode;

    children?: ReactNode;

    bracketed?: boolean;

    framed?: boolean;

    align?: SectionAlign;

    className?: string;
}

declare const Hero: react.ForwardRefExoticComponent<HeroProps & react.RefAttributes<HTMLElement>>;

interface FeatureGridProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'className'> {

    title?: ReactNode;

    description?: ReactNode;

    columns?: SectionColumns;

    align?: SectionAlign;

    children?: ReactNode;

    className?: string;
}

declare const FeatureGrid: react.ForwardRefExoticComponent<FeatureGridProps & react.RefAttributes<HTMLElement>>;
interface FeatureProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {

    title: string;

    icon?: ReactNode;

    accent?: AccentToken;

    weight?: CardWeight;

    children?: ReactNode;

    className?: string;
}

declare const Feature: react.ForwardRefExoticComponent<FeatureProps & react.RefAttributes<HTMLDivElement>>;

interface PricingGridProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'className'> {

    title?: ReactNode;

    description?: ReactNode;

    columns?: SectionColumns;

    align?: SectionAlign;

    children?: ReactNode;

    className?: string;
}

declare const PricingGrid: react.ForwardRefExoticComponent<PricingGridProps & react.RefAttributes<HTMLElement>>;

type PricingTierAccent = 'primary' | 'secondary' | 'tertiary';
interface PricingTierProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {

    name: ReactNode;

    weight?: CardWeight;

    price: ReactNode;

    period?: ReactNode;

    description?: ReactNode;

    features?: readonly ReactNode[];

    accent?: PricingTierAccent;

    badge?: string;

    action?: ReactNode;

    className?: string;
}

interface PricingTier {
    name: string;
    price: string;
    period?: string;
    description: string;
    features: string[];

    accent: PricingTierAccent;
    highlighted?: boolean;
    ctaText?: string;
}

declare const PricingTier: react.ForwardRefExoticComponent<PricingTierProps & react.RefAttributes<HTMLDivElement>>;

type CTASectionAccent = 'primary' | 'secondary' | 'tertiary';
interface CTASectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children' | 'className'> {

    title: ReactNode;

    children?: ReactNode;

    actions?: ReactNode;

    accent?: CTASectionAccent;

    align?: SectionAlign;

    className?: string;
}

declare const CTASection: react.ForwardRefExoticComponent<CTASectionProps & react.RefAttributes<HTMLElement>>;

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
    readonly 'git-merge': "";
    readonly 'git-pull-request': "";
    readonly docker: "";
    readonly kubernetes: "󱃾";
    readonly aws: "󰸏";
    readonly linux: "";
    readonly apple: "";
    readonly windows: "";
    readonly database: "";
    readonly server: "";
    readonly terminal: "";
    readonly code: "";
    readonly bug: "";
    readonly cpu: "";
    readonly ram: "";
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

type AsciiGaugeVariant = 'block' | 'shade' | 'line' | 'ascii';
interface AsciiGaugeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {

    label?: string;

    value: number;

    min?: number;

    max?: number;

    target?: number;

    length?: number;

    brackets?: [string, string] | null;

    variant?: AsciiGaugeVariant;

    accent?: AccentToken;

    showValue?: boolean;

    valueFormat?: (value: number, ratio: number) => string;
}

declare const AsciiGauge: react.ForwardRefExoticComponent<AsciiGaugeProps & react.RefAttributes<HTMLSpanElement>>;

type TelemetryMachineState = 'cruise' | 'braking' | 'halted' | 'spooling' | 'idle' | 'online';
interface TelemetryGaugeProps extends HTMLAttributes<HTMLDivElement> {

    state?: TelemetryMachineState;

    stateLabel?: string;

    value: number;

    target?: number;

    metricLabel?: string;

    barSegments?: number;

    gaugeVariant?: AsciiGaugeVariant;

    compact?: boolean;

    accent?: AccentToken;
}

declare const TelemetryGauge: react.ForwardRefExoticComponent<TelemetryGaugeProps & react.RefAttributes<HTMLDivElement>>;

interface TickerTapeProps extends HTMLAttributes<HTMLDivElement> {

    items: ReactNode[];

    pixelsPerSecond?: number;

    sticky?: boolean;

    endAddon?: ReactNode;

    title?: string;

    brakeDuration?: number;

    spoolDuration?: number;

    paused?: boolean;

    onVelocityChange?: (rate: number, percentage: number) => void;
}

declare const TickerTape: react.ForwardRefExoticComponent<TickerTapeProps & react.RefAttributes<HTMLDivElement>>;

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

type TraceAttributeValue = string | number | boolean;

type TraceSpanStatus = 'ok' | 'error' | 'unset';

interface TraceSpanInput {

    id: string;

    parentId?: string | null;

    name: string;

    service?: string;

    start: number;

    end?: number;

    duration?: number;

    status?: TraceSpanStatus;

    kind?: string;

    attributes?: Record<string, TraceAttributeValue>;
}

interface TraceSpan {
    id: string;
    parentId: string | null;
    name: string;
    service: string;
    status: TraceSpanStatus;
    kind?: string;
    attributes: Record<string, TraceAttributeValue>;

    depth: number;

    children: string[];

    offset: number;

    duration: number;

    selfTime: number;

    inFlight: boolean;

    critical: boolean;
}

interface TraceModel {

    spans: TraceSpan[];
    byId: ReadonlyMap<string, TraceSpan>;

    start: number;

    duration: number;

    services: string[];
    errorCount: number;
    inFlightCount: number;

    criticalPath: string[];
}
interface BuildTraceOptions {

    now?: number;
}

declare function buildTrace(input: readonly TraceSpanInput[] | TraceModel, options?: BuildTraceOptions): TraceModel;

declare function visibleTraceSpans(model: TraceModel, collapsed?: ReadonlySet<string>, filter?: (span: TraceSpan) => boolean): TraceSpan[];

declare function matchTraceSpan(span: TraceSpan, query: string): boolean;

declare function formatTraceDuration(ms: number): string;

declare function parseOtlpTrace(document: unknown): TraceSpanInput[];

declare function parseTraceDocument(input: unknown): TraceSpanInput[];

declare function replayTrace(input: readonly TraceSpanInput[] | TraceModel, elapsed: number): TraceSpanInput[];

interface GitHubActionsStep {
    name: string;
    number: number;
    status: string;
    conclusion: string | null;
    started_at: string | null;
    completed_at: string | null;
}

interface GitHubActionsJob {
    id: number;
    name: string;
    status: string;
    conclusion: string | null;
    created_at?: string | null;
    started_at: string | null;
    completed_at: string | null;
    runner_name?: string | null;
    labels?: string[];
    html_url?: string | null;
    steps?: GitHubActionsStep[];
}

interface GitHubActionsRun {
    id: number;
    name: string;
    status: string;
    conclusion: string | null;
    created_at?: string | null;
    run_started_at?: string | null;
    updated_at?: string | null;
    html_url?: string | null;
    head_branch?: string | null;
    head_sha?: string | null;
    event?: string | null;
    run_attempt?: number;
    display_title?: string | null;
}
interface GitHubRunTraceOptions {

    queue?: boolean;

    steps?: boolean;

    service?: string;
}

declare function ciConclusionStatus(conclusion: string | null | undefined): TraceSpanStatus;

declare function githubRunToSpans(run: GitHubActionsRun, jobs: readonly GitHubActionsJob[], options?: GitHubRunTraceOptions): TraceSpanInput[];

declare function describeTraceSpan(span: TraceSpan): string;

interface TraceWindow {
    start: number;
    end: number;
}
interface TraceWaterfallProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {

    spans: readonly TraceSpanInput[] | TraceModel;

    now?: number;

    selectedId?: string | null;

    defaultSelectedId?: string | null;

    onSelectedChange?: (id: string | null) => void;

    collapsed?: readonly string[];

    defaultCollapsed?: readonly string[];

    onCollapsedChange?: (ids: string[]) => void;

    filter?: string;

    ticks?: number;

    range?: number;

    playhead?: number;

    window?: TraceWindow | null;

    defaultWindow?: TraceWindow | null;

    onWindowChange?: (window: TraceWindow) => void;

    minimap?: 'auto' | 'always' | 'never';

    animate?: boolean;

    label?: string;
}

declare const TraceWaterfall: react.ForwardRefExoticComponent<TraceWaterfallProps & react.RefAttributes<HTMLDivElement>>;

interface TraceViewerProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {

    spans: readonly TraceSpanInput[] | TraceModel;

    now?: number;

    title?: string;

    defaultSelectedId?: string | null;

    defaultCollapsed?: readonly string[];

    searchable?: boolean;

    replay?: boolean;

    autoPlay?: boolean;

    loop?: boolean;

    defaultSpeed?: number;

    window?: TraceWindow | null;

    defaultWindow?: TraceWindow | null;

    onWindowChange?: (window: TraceWindow) => void;

    minimap?: 'auto' | 'always' | 'never';
}

declare const TraceViewer: react.ForwardRefExoticComponent<TraceViewerProps & react.RefAttributes<HTMLElement>>;

interface ViewportWindow {
    start: number;
    end: number;
}

interface ViewportRows {
    min: number;
    max: number;
}

declare const VIEWPORT_MIN_WINDOW = 0.001;

declare const VIEWPORT_FULL_WINDOW: ViewportWindow;

declare function clampViewportWindow(window: ViewportWindow, minWidth?: number): ViewportWindow;

declare function zoomViewportWindow(window: ViewportWindow, factor: number, anchor?: number, minWidth?: number): ViewportWindow;

declare function panViewportWindow(window: ViewportWindow, delta: number, minWidth?: number): ViewportWindow;

declare function fitViewportWindow(x0: number, x1: number, pad?: number, minWidth?: number): ViewportWindow;

declare function sameViewportWindow(a: ViewportWindow, b: ViewportWindow): boolean;

declare function clampViewportRows(rows: ViewportRows, last: number): ViewportRows;

declare function zoomViewportRows(rows: ViewportRows, factor: number, last: number): ViewportRows;

declare function panViewportRows(rows: ViewportRows, delta: number, last: number): ViewportRows;

declare function centreViewportRows(rows: ViewportRows, row: number, last: number): ViewportRows;

type FlameUnit = 'samples' | 'ms' | (string & {});

interface FlameStack {
    frames: readonly string[];
    value: number;
}

interface FoldedStacks {
    stacks: FlameStack[];

    skipped: number[];
}

type FlameOrder = 'alphabetical' | 'time';

interface FlameFrame {

    id: string;
    name: string;
    parentId: string | null;

    depth: number;

    total: number;

    self: number;

    x: number;

    width: number;

    children: FlameFrame[];
}

interface FlameTree {

    root: FlameFrame;

    frames: FlameFrame[];
    byId: ReadonlyMap<string, FlameFrame>;

    maxDepth: number;
    total: number;
    unit: FlameUnit;
    order: FlameOrder;
}
interface BuildFlameOptions {

    order?: FlameOrder;

    unit?: FlameUnit;

    rootName?: string;
}

declare function parseFoldedStacks(text: string): FoldedStacks;

declare function buildFlame(input: readonly FlameStack[] | FoldedStacks | string, options?: BuildFlameOptions): FlameTree;
interface FlameFromTraceOptions {

    order?: FlameOrder;

    label?: (span: {
        name: string;
        service: string;
    }) => string;
}

declare function flameFromTrace(input: readonly TraceSpanInput[] | TraceModel, options?: FlameFromTraceOptions): FlameTree;

interface FlameViewFrame {
    frame: FlameFrame;

    x: number;

    width: number;

    context: boolean;
}

declare function zoomFlame(tree: FlameTree, focusId?: string | null): FlameViewFrame[];

declare function flamePath(tree: FlameTree, id?: string | null): FlameFrame[];

interface FlameSearchResult {

    ids: Set<string>;

    matched: number;

    share: number | null;
}

declare function searchFlame(tree: FlameTree, query: string): FlameSearchResult;

declare function formatFlameValue(value: number, unit: FlameUnit): string;

declare function formatFlameShare(share: number | null): string;

declare function fitFlameLabel(name: string, width: number, charWidth: number): string;

interface FlameDelta {
    baseline: number | null;
    candidate: number | null;

    absolute: number | null;

    relative: number | null;
}

type FlameDiffStatus = 'new' | 'removed' | 'changed' | 'unchanged';

interface FlameFrameDelta {
    id: string;
    name: string;
    depth: number;
    status: FlameDiffStatus;
    total: FlameDelta;
    self: FlameDelta;
}
interface DiffFlameOptions {

    normalize?: boolean;
}

interface FlameDiff {
    compatible: true;

    tree: FlameTree;
    baseline: FlameTree;

    frames: ReadonlyMap<string, FlameFrameDelta>;

    removed: FlameFrameDelta[];

    basis: 'absolute' | 'share';
}

interface FlameDiffIncompatible {
    compatible: false;
    reason: string;
}

declare function diffFlame(baseline: FlameTree, candidate: FlameTree, options?: DiffFlameOptions): FlameDiff | FlameDiffIncompatible;

type FlameDeltaTone = 'new' | 'grew-large' | 'grew' | 'same' | 'shrank' | 'shrank-large' | 'unknown';
interface FlameDeltaToneOptions {

    metric?: 'self' | 'total';

    threshold?: number;

    large?: number;
}

declare function flameDeltaTone(change: FlameFrameDelta | undefined, options?: FlameDeltaToneOptions): FlameDeltaTone;

declare function formatFlameDelta(change: FlameFrameDelta, metric: 'self' | 'total', unit: FlameUnit, basis?: 'absolute' | 'share'): string;

interface FlameRankedFrame {

    id: string;
    name: string;
    depth: number;
    total: number;
    self: number;

    change?: FlameFrameDelta;

    frameIds?: string[];
}

declare function rankFlameFunctions(tree: FlameTree, diff?: FlameDiff | null, metric?: 'self' | 'total'): FlameRankedFrame[];

declare function rankFlameFrames(tree: FlameTree, diff?: FlameDiff | null, metric?: 'self' | 'total'): FlameRankedFrame[];

type FlameWindow = ViewportWindow;

type FlameDepthWindow = ViewportRows;

declare const FLAME_MIN_WINDOW = 0.001;

declare const FLAME_FULL_WINDOW: FlameWindow;

declare function clampFlameWindow(window: FlameWindow): FlameWindow;

declare function zoomFlameWindow(window: FlameWindow, factor: number, anchor?: number): FlameWindow;

declare function panFlameWindow(window: FlameWindow, delta: number): FlameWindow;

declare function fitFlameWindow(tree: FlameTree, id?: string | null): FlameWindow;

declare function flameSubtreeDepth(frame: FlameFrame): number;

declare function clampFlameDepth(tree: FlameTree, depth: FlameDepthWindow): FlameDepthWindow;

declare function zoomFlameDepth(tree: FlameTree, depth: FlameDepthWindow, factor: number): FlameDepthWindow;

declare function panFlameDepth(tree: FlameTree, depth: FlameDepthWindow, delta: number): FlameDepthWindow;

declare function fitFlameDepth(tree: FlameTree, id?: string | null, cap?: number): FlameDepthWindow;

type FlameWindowSpec = readonly [number, number] | {
    frameId: string;
} | 'hottest' | 'all';

declare function hottestFlameFrame(tree: FlameTree, diff?: FlameDiff | null, metric?: 'self' | 'total'): FlameFrame | null;

declare function flameWindowFrame(tree: FlameTree, spec?: FlameWindowSpec | null, diff?: FlameDiff | null, metric?: 'self' | 'total'): FlameFrame | null;

declare function resolveFlameWindow(tree: FlameTree, spec?: FlameWindowSpec | null, diff?: FlameDiff | null, metric?: 'self' | 'total'): FlameWindow;

type FlameDepthSpec = readonly [number, number] | number;

declare function resolveFlameDepth(tree: FlameTree, spec: FlameDepthSpec | null | undefined, options?: {
    window?: FlameWindow;
    anchorId?: string | null;
    cap?: number;
}): FlameDepthWindow;

interface FlameWindowFrame {
    frame: FlameFrame;

    x: number;

    width: number;

    clipped: boolean;
}

declare function windowFlame(tree: FlameTree, window: FlameWindow, depth: FlameDepthWindow): FlameWindowFrame[];

declare function sameFlameWindow(a: FlameWindow, b: FlameWindow): boolean;

type FlameRole = 'intent.danger' | 'intent.warning' | 'intent.success' | 'accent.primary' | 'accent.tertiary' | 'accent.quiet' | 'surface.base' | 'surface.raised' | 'text.primary' | 'text.muted';

interface FlameSwatch {

    fill: string;

    label: 'fill-content-inverse' | 'fill-content-primary';

    mix: readonly [FlameRole] | readonly [FlameRole, number, FlameRole];

    dark?: {
        fill: string;
        label: 'dark:fill-content-inverse' | 'dark:fill-content-primary';
        mix: readonly [FlameRole] | readonly [FlameRole, number, FlameRole];
    };
}

type FlamePalette = 'warm' | 'package' | 'theme';

declare const WARM_SWATCHES: readonly FlameSwatch[];

type FlamePackage = 'app' | 'system' | 'microsoft' | 'data' | 'runtime' | 'other';

declare const PACKAGE_SWATCHES: Readonly<Record<FlamePackage, readonly FlameSwatch[]>>;

declare const SAME_SWATCHES: readonly FlameSwatch[];

declare function flameNameHash(name: string): number;

declare function flamePackage(name: string): FlamePackage;

declare function flameSwatch(palette: FlamePalette, name: string): FlameSwatch | null;

declare function flameSameSwatch(name: string): FlameSwatch;

declare function describeFlameFrame(frame: FlameFrame, tree: FlameTree, change?: FlameFrameDelta, metric?: 'self' | 'total'): string;
interface FlamegraphProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {

    profile: FlameTree;

    mode?: 'single' | 'diff';

    baseline?: FlameTree;

    diffMetric?: 'self' | 'total';

    threshold?: number;

    large?: number;

    normalize?: boolean;

    palette?: FlamePalette;

    orientation?: 'flame' | 'icicle';

    list?: 'auto' | 'always' | 'never';

    listBy?: 'function' | 'frame';

    defaultWindow?: FlameWindowSpec;

    window?: FlameWindow;

    onWindowChange?: (window: FlameWindow) => void;

    defaultDepth?: FlameDepthSpec;

    depth?: FlameDepthWindow;

    onDepthChange?: (depth: FlameDepthWindow) => void;

    zoomedId?: string | null;

    defaultZoomedId?: string | null;

    onZoomedChange?: (id: string | null) => void;

    selectedId?: string | null;

    defaultSelectedId?: string | null;

    onSelectedChange?: (id: string | null) => void;

    search?: string;

    width?: number;

    rowHeight?: number;

    label?: string;
}

declare const Flamegraph: react.ForwardRefExoticComponent<FlamegraphProps & react.RefAttributes<HTMLDivElement>>;

type MinimapTone = 'neutral' | 'muted' | 'accent' | 'danger' | 'info' | 'added' | 'added-ground' | 'removed' | 'removed-ground';

interface MinimapMark {
    x0: number;
    x1: number;
    row: number;
    tone?: MinimapTone;
}
interface MinimapProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'children'> {

    marks: readonly MinimapMark[];

    rows: number;

    window: ViewportWindow;

    rowWindow?: ViewportRows | null;

    onWindowChange?: (window: ViewportWindow, rows: ViewportRows | null) => void;

    rowOrder?: 'top-down' | 'bottom-up';

    markStyle?: 'fill' | 'line';

    height?: number;

    minWidth?: number;

    pixelWidth?: number;

    label?: string;

    valueText?: string;

    chartClassName?: string;
}

declare const Minimap: react.ForwardRefExoticComponent<MinimapProps & react.RefAttributes<HTMLDivElement>>;

interface TimeRange {
    from: number;
    to: number;
}

interface TimeRangePreset {
    id: string;
    label: string;

    duration: number;
}

declare const TIME_RANGE_PRESETS: readonly TimeRangePreset[];

declare function presetRange(preset: TimeRangePreset, now: number): TimeRange;

declare function normaliseRange(range: TimeRange | null | undefined): TimeRange | null;

declare function clampToRange(time: number, range: TimeRange): number;

declare function formatClock(time: number, seconds?: boolean): string;

declare function formatDay(time: number): string;

declare function formatTimestamp(time: number, precision?: 'minute' | 'second' | 'millisecond'): string;

declare function formatTimeTick(time: number, span: number): string;

declare function formatRangeDuration(ms: number): string;

declare function formatRange(range: TimeRange): string;

declare function timeTicks(range: TimeRange, target?: number): number[];

declare function bucketTimes(range: TimeRange, count: number): TimeRange[];

interface TimeRangeState {

    now: number;

    range: TimeRange;

    presetId: string | null;
    presets: readonly TimeRangePreset[];

    setRange: (range: TimeRange, presetId?: string | null) => void;

    selectPreset: (id: string) => void;
}
interface TimeCursorState {

    cursor: number | null;
    setCursor: (time: number | null) => void;
}

declare function useTimeRange(): TimeRangeState | null;

declare function useTimeCursor(): TimeCursorState | null;
interface TimeRangeProviderProps {

    now: number;

    defaultPresetId?: string;

    range?: TimeRange;

    onRangeChange?: (range: TimeRange, presetId: string | null) => void;

    presets?: readonly TimeRangePreset[];
    children?: ReactNode;
}

declare function TimeRangeProvider({ now, defaultPresetId, range: rangeProp, onRangeChange, presets, children }: TimeRangeProviderProps): react.JSX.Element;
interface TimeRangePickerProps extends HTMLAttributes<HTMLDivElement> {

    label?: string;
}

declare const TimeRangePicker: react.ForwardRefExoticComponent<TimeRangePickerProps & react.RefAttributes<HTMLDivElement>>;

type LogSeverity = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

type AlertState = 'firing' | 'pending' | 'resolved' | 'silenced';

type AlertSeverity = 'critical' | 'warning' | 'info';

type Severity = LogSeverity | AlertState | AlertSeverity;

declare const SEVERITY_ACCENTS: Readonly<Record<Severity, AccentToken>>;

declare function severityAccent(severity: string): AccentToken;

interface SeverityBadgeProps extends Omit<BadgeProps, 'accent' | 'children'> {

    severity: Severity;

    children?: BadgeProps['children'];
}

declare const SeverityBadge: react.ForwardRefExoticComponent<SeverityBadgeProps & react.RefAttributes<HTMLSpanElement>>;

type TimeSeriesPoint = readonly [time: number, value: number | null];

interface TimeSeries {

    id: string;

    label: string;

    points: ReadonlyArray<TimeSeriesPoint>;

    unit?: string;

    tone?: 'primary' | 'secondary' | 'neutral' | 'info' | 'success' | 'warning' | 'danger';
}

type TimeSeriesCurve = 'linear' | 'monotone' | 'step';

interface TimeSeriesThreshold {

    value: number;

    label: string;

    intent: 'warning' | 'danger';
}

interface TimeSeriesAnnotation {

    time: number;

    label: string;

    intent?: 'info' | 'warning' | 'danger';
}

declare const TIME_SERIES_VARIANTS: {
    readonly variant: readonly ["line", "area", "stacked"];
    readonly curve: readonly ["linear", "monotone", "step"];
    readonly points: readonly ["none", "hover", "all"];
    readonly grid: readonly ["none", "horizontal", "both"];
    readonly yScale: readonly ["linear", "log"];
    readonly yDomain: readonly ["zero", "data"];
    readonly legend: readonly ["top", "bottom", "none", "inline"];
    readonly colorStrategy: readonly ["categorical", "emphasis"];
    readonly density: readonly ["regular", "compact"];
};

type TimeSeriesVariant = (typeof TIME_SERIES_VARIANTS.variant)[number];

type TimeSeriesPointMarkers = (typeof TIME_SERIES_VARIANTS.points)[number];

type TimeSeriesGrid = (typeof TIME_SERIES_VARIANTS.grid)[number];

type TimeSeriesYScale = (typeof TIME_SERIES_VARIANTS.yScale)[number];

type TimeSeriesYDomain = (typeof TIME_SERIES_VARIANTS.yDomain)[number] | readonly [min: number, max: number];

type TimeSeriesLegend = (typeof TIME_SERIES_VARIANTS.legend)[number];

type TimeSeriesColorStrategy = (typeof TIME_SERIES_VARIANTS.colorStrategy)[number];

type TimeSeriesDensity = (typeof TIME_SERIES_VARIANTS.density)[number];
interface TimeSeriesChartProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {

    series: readonly TimeSeries[];

    variant?: TimeSeriesVariant;

    curve?: TimeSeriesCurve;

    strokeWidth?: number;

    points?: TimeSeriesPointMarkers;

    fillOpacity?: number;

    grid?: TimeSeriesGrid;

    yScale?: TimeSeriesYScale;

    yDomain?: TimeSeriesYDomain;

    legend?: TimeSeriesLegend;

    colorStrategy?: TimeSeriesColorStrategy;

    emphasisSeriesId?: string;

    density?: TimeSeriesDensity;

    annotations?: readonly TimeSeriesAnnotation[];

    showAxes?: boolean;

    thresholds?: readonly TimeSeriesThreshold[];

    range?: TimeRange;

    formatValue?: (value: number) => string;

    unit?: string;

    hiddenSeries?: readonly string[];

    defaultHiddenSeries?: readonly string[];

    onHiddenSeriesChange?: (ids: string[]) => void;

    onRangeSelect?: (range: TimeRange) => void;

    zoomable?: boolean;

    height?: number;

    title?: string;

    showTitle?: boolean;
}

declare const TimeSeriesChart: react.ForwardRefExoticComponent<TimeSeriesChartProps & react.RefAttributes<HTMLDivElement>>;

interface LatencyBucket {

    from: number;

    to: number;

    count: number;
}

interface LatencyPoint {

    time: number;

    value: number;
}

interface LatencyCell {

    column: number;

    row: number;

    timeRange: TimeRange;

    latencyRange: {
        from: number;
        to: number;
    };

    count: number;
}

interface LatencyGrid {
    cells: LatencyCell[];
    columns: number;
    rows: number;

    max: number;

    total: number;
}

declare function latencyBuckets(min: number, max: number, count: number): number[];

declare function linearBuckets(min: number, max: number, count: number): number[];

declare function bucketIndex(value: number, edges: readonly number[]): number;

declare function histogram(samples: readonly number[], edges: readonly number[]): LatencyBucket[];

declare function percentile(samples: readonly number[], p: number): number;

declare function percentiles(samples: readonly number[], ps?: readonly number[]): number[];

declare function bucketPercentile(buckets: readonly LatencyBucket[], p: number): number;

declare function shareAbove(samples: readonly number[], threshold: number): number;

declare function latencyExtent(values: Iterable<number>): {
    min: number;
    max: number;
} | null;

declare function logTicks(min: number, max: number, target?: number): number[];

declare function heatmapCells(points: readonly LatencyPoint[], timeBuckets: readonly TimeRange[], latencyEdges: readonly number[]): LatencyGrid;

type IntensityScale = 'sqrt' | 'linear' | 'log' | 'quantile';

declare function intensityThresholds(counts: readonly number[], levels?: number, scale?: IntensityScale): number[];

declare function intensityLevel(count: number, thresholds: readonly number[]): number;

declare function latencyRowPosition(value: number, edges: readonly number[]): number;

declare function formatCount(value: number): string;

declare function formatShare(share: number): string;

declare function formatLatencyRange(from: number, to: number, format?: (ms: number) => string): string;

declare function formatRequests(count: number): string;

declare const LATENCY_HISTOGRAM_VARIANTS: {
    readonly scale: readonly ["log", "linear"];
    readonly binning: readonly ["log", "linear"];
    readonly bar: readonly ["bars", "steps", "outline"];
    readonly markers: readonly ["lines", "labels", "none"];
    readonly density: readonly ["regular", "compact"];
    readonly cumulative: readonly [false, true];
};

interface LatencySlo {

    value: number;

    label?: string;
}
interface LatencyHistogramProps extends HTMLAttributes<HTMLDivElement> {

    samples?: readonly number[];

    buckets?: readonly LatencyBucket[];

    percentiles?: readonly number[];

    slo?: LatencySlo;

    scale?: 'log' | 'linear';

    binning?: 'log' | 'linear';

    bins?: number;

    min?: number;

    max?: number;

    height?: number;

    title?: string;

    formatValue?: (ms: number) => string;

    bar?: 'bars' | 'steps' | 'outline';

    cumulative?: boolean;

    markers?: 'lines' | 'labels' | 'none';

    density?: 'regular' | 'compact';
}

declare const LatencyHistogram: react.ForwardRefExoticComponent<LatencyHistogramProps & react.RefAttributes<HTMLDivElement>>;

declare const LATENCY_HEATMAP_VARIANTS: {
    readonly colorScale: readonly ["sqrt", "linear", "log", "quantile"];
    readonly colorSteps: readonly [6, 3, 4, 5, 7, 8, 9];
    readonly density: readonly ["regular", "compact"];
    readonly showLegend: readonly [true, false];
    readonly zoomable: readonly [true, false];
    readonly cellGap: readonly [1, 0, 2, 4];
    readonly percentileOverlay: readonly [readonly [], readonly [50], readonly [50, 99]];
};
interface LatencyHeatmapProps extends HTMLAttributes<HTMLDivElement> {

    points: readonly LatencyPoint[];

    range?: TimeRange;

    columns?: number;

    rows?: number;

    min?: number;

    max?: number;

    height?: number;

    title?: string;

    onCellSelect?: (cell: LatencyCell) => void;

    onRangeSelect?: (range: TimeRange) => void;

    zoomable?: boolean;

    formatValue?: (ms: number) => string;

    colorSteps?: number;

    colorScale?: IntensityScale;

    cellGap?: number;

    showLegend?: boolean;

    density?: 'regular' | 'compact';

    percentileOverlay?: readonly number[];
}

declare const LatencyHeatmap: react.ForwardRefExoticComponent<LatencyHeatmapProps & react.RefAttributes<HTMLDivElement>>;

type BenchmarkDirection = MetricDirection;

declare const BENCHMARK_CLASSIFICATIONS: readonly ["slower", "faster", "inconclusive", "unchanged"];

type BenchmarkClassification = (typeof BENCHMARK_CLASSIFICATIONS)[number];

type BenchmarkInconclusiveReason = 'missing-baseline' | 'missing-candidate' | 'no-raw-samples' | 'too-few-samples' | 'non-positive-median' | 'straddles-threshold';

declare const BENCHMARK_INTERVAL_METHODS: readonly ["bootstrap", "mann-whitney"];

type BenchmarkIntervalMethod = (typeof BENCHMARK_INTERVAL_METHODS)[number];

interface SampleSummary {

    n: number;
    mean: number;
    median: number;

    stddev: number;
    min: number;
    max: number;

    p95: number;

    mad: number;
}

interface RatioInterval {

    estimate: number;
    low: number;
    high: number;

    level: number;
    method: BenchmarkIntervalMethod;
}

interface BenchmarkInput {

    id?: string;

    name: string;

    unit: string;

    direction: BenchmarkDirection;

    baseline?: readonly number[] | null;

    candidate?: readonly number[] | null;

    baselineSummary?: SampleSummary | null;

    candidateSummary?: SampleSummary | null;
}

interface BenchmarkCompareOptions {

    threshold?: number;

    level?: number;

    minSamples?: number;

    method?: BenchmarkIntervalMethod;

    resamples?: number;

    seed?: number;
}

interface BenchmarkComparison {
    id: string;
    name: string;
    unit: string;
    direction: BenchmarkDirection;
    baseline: SampleSummary | null;
    candidate: SampleSummary | null;

    ratio: number | null;

    interval: RatioInterval | null;

    band: {
        low: number;
        high: number;
    };

    threshold: number;
    classification: BenchmarkClassification;

    reason?: BenchmarkInconclusiveReason;

    samples?: {
        baseline: readonly number[] | null;
        candidate: readonly number[] | null;
    };
}

declare function mulberry32(seed: number): () => number;

declare function median(samples: readonly number[]): number;

declare function summarize(samples: readonly number[]): SampleSummary;

declare function normalQuantile(p: number): number;

declare function medianInterval(samples: readonly number[], level?: number): {
    low: number;
    high: number;
    level: number;
} | null;

declare function bootstrapRatioInterval(baseline: readonly number[], candidate: readonly number[], { level, resamples, seed }?: {
    level?: number;
    resamples?: number;
    seed?: number;
}): RatioInterval | null;

declare function mannWhitneyRatioInterval(baseline: readonly number[], candidate: readonly number[], { level }?: {
    level?: number;
}): RatioInterval | null;

declare function noiseBand(threshold: number): {
    low: number;
    high: number;
};

declare function classifyInterval(interval: {
    low: number;
    high: number;
}, band: {
    low: number;
    high: number;
}, direction: BenchmarkDirection): {
    classification: BenchmarkClassification;
    reason?: BenchmarkInconclusiveReason;
};

declare function compareBenchmark(input: BenchmarkInput, options?: BenchmarkCompareOptions): BenchmarkComparison;

declare function compareBenchmarks(inputs: readonly BenchmarkInput[], options?: BenchmarkCompareOptions): BenchmarkComparison[];

declare function benchmarkImpact(comparison: BenchmarkComparison): number;

declare function sortByImpact(comparisons: readonly BenchmarkComparison[]): BenchmarkComparison[];

declare const INCONCLUSIVE_REASON_TEXT: Readonly<Record<BenchmarkInconclusiveReason, string>>;

declare function benchmarkDisplayUnit(value: number, unit: string): {
    unit: string;
    factor: number;
};

declare function formatSignificant(value: number): string;

declare function formatBenchmarkValue(value: number, unit: string): string;

declare function formatPercent(share: number): string;

declare function formatRatio(ratio: number | null): string;

declare function formatRatioChange(ratio: number | null): string;

interface BenchmarkDotNetMeasurement {
    IterationMode: string;
    IterationStage: string;
    LaunchIndex?: number;
    IterationIndex?: number;
    Operations: number;
    Nanoseconds: number;
}

interface BenchmarkDotNetStatistics {
    OriginalValues?: number[];
    N: number;
    Min: number;
    Max: number;
    Mean: number;
    Median: number;
    StandardDeviation: number;
    Percentiles?: {
        P95?: number;
    };
}

interface BenchmarkDotNetBenchmark {
    FullName?: string;
    Namespace?: string;
    Type?: string;
    Method?: string;
    MethodTitle?: string;
    Parameters?: string;
    DisplayInfo?: string;
    Statistics?: BenchmarkDotNetStatistics | null;
    Measurements?: BenchmarkDotNetMeasurement[];
}

interface BenchmarkDotNetReport {
    Title?: string;
    Benchmarks: BenchmarkDotNetBenchmark[];
}

interface BenchmarkRun {
    id: string;
    name: string;
    unit: string;
    direction: BenchmarkDirection;

    samples: number[] | null;

    summary: SampleSummary;

    source: 'measurements' | 'original-values' | 'statistics';
}

declare function fromBenchmarkDotNet(report: BenchmarkDotNetReport): BenchmarkRun[];

declare function pairBenchmarkRuns(baseline: readonly BenchmarkRun[], candidate: readonly BenchmarkRun[]): BenchmarkInput[];

declare function kernelDensity(samples: readonly number[], from: number, to: number, points?: number): Array<{
    value: number;
    density: number;
}>;

declare const BENCHMARK_COMPARE_VARIANTS: {
    readonly sort: readonly ["impact", "input", "name"];
    readonly density: readonly ["regular", "compact"];
    readonly plot: readonly ["interval", "none"];
    readonly layout: readonly ["auto", "table", "panels"];
};

type BenchmarkCompareLayout = (typeof BENCHMARK_COMPARE_VARIANTS.layout)[number];

type BenchmarkCompareSort = (typeof BENCHMARK_COMPARE_VARIANTS.sort)[number];
interface BenchmarkCompareProps extends HTMLAttributes<HTMLDivElement> {

    comparisons: readonly BenchmarkComparison[];

    sort?: BenchmarkCompareSort;

    density?: 'regular' | 'compact';

    plot?: 'interval' | 'none';

    domain?: readonly [low: number, high: number];

    caption?: string;

    layout?: BenchmarkCompareLayout;
}

declare const BenchmarkCompare: react.ForwardRefExoticComponent<BenchmarkCompareProps & react.RefAttributes<HTMLDivElement>>;

declare const DISTRIBUTION_COMPARE_VARIANTS: {
    readonly variant: readonly ["strip", "violin"];
    readonly scale: readonly ["linear", "log"];
    readonly density: readonly ["regular", "compact"];
};

type DistributionCompareVariant = (typeof DISTRIBUTION_COMPARE_VARIANTS.variant)[number];
interface DistributionCompareProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {

    baseline: readonly number[];

    candidate: readonly number[];

    unit: string;

    direction?: BenchmarkDirection;

    comparison?: BenchmarkComparison;

    options?: BenchmarkCompareOptions;

    variant?: DistributionCompareVariant;

    scale?: 'linear' | 'log';

    density?: 'regular' | 'compact';

    level?: number;

    title?: string;

    labels?: {
        baseline?: string;
        candidate?: string;
    };
}

declare const DistributionCompare: react.ForwardRefExoticComponent<DistributionCompareProps & react.RefAttributes<HTMLDivElement>>;

declare const BENCHMARK_TREND_VARIANTS: {
    readonly interval: readonly ["whisker", "ribbon", "none"];
    readonly density: readonly ["regular", "compact"];
};

type BenchmarkTrendInterval = (typeof BENCHMARK_TREND_VARIANTS.interval)[number];

interface BenchmarkTrendPoint {

    commit: string;

    timestamp: string;

    tag?: string;

    value: number;

    low?: number;

    high?: number;
}
interface BenchmarkTrendProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {

    points: readonly BenchmarkTrendPoint[];

    candidate?: BenchmarkTrendPoint;

    unit: string;

    direction?: BenchmarkDirection;

    threshold?: number;

    interval?: BenchmarkTrendInterval;

    density?: 'regular' | 'compact';

    title?: string;
}

declare const BenchmarkTrend: react.ForwardRefExoticComponent<BenchmarkTrendProps & react.RefAttributes<HTMLDivElement>>;

type LogFieldValue = string | number | boolean;

interface LogEntry {

    id: string;

    time: number;

    severity: LogSeverity;

    message: string;

    service?: string;

    traceId?: string;

    spanId?: string;

    fields?: Record<string, LogFieldValue>;
}

declare const LOG_SEVERITIES: readonly LogSeverity[];

interface LogFilter {

    query?: string;

    severities?: readonly LogSeverity[];

    range?: TimeRange | null;
}

declare function matchLogEntry(entry: LogEntry, query: string): boolean;

declare function inLogRange(time: number, range: TimeRange): boolean;

declare function filterLogEntries(entries: readonly LogEntry[], filter?: LogFilter): LogEntry[];

declare function sortLogEntries(entries: readonly LogEntry[], order?: 'asc' | 'desc'): LogEntry[];

interface LogHighlightPart {
    text: string;
    match: boolean;
}

declare function highlightLogText(text: string, query: string | undefined): LogHighlightPart[];

declare function nearestLogIndex(entries: readonly LogEntry[], time: number | null | undefined): number | null;

declare function describeLogEntry(entry: LogEntry): string;

interface LogViewerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {

    entries: readonly LogEntry[];

    order?: 'asc' | 'desc';

    query?: string;

    severities?: readonly LogSeverity[];

    range?: TimeRange;

    followRange?: boolean;

    follow?: boolean;

    onTraceSelect?: (traceId: string, entry: LogEntry) => void;

    height?: number;

    virtualize?: boolean;

    showHeader?: boolean;

    announce?: boolean;

    defaultExpanded?: readonly string[];

    emptyText?: ReactNode;

    label?: string;
}

declare const LogViewer: react.ForwardRefExoticComponent<LogViewerProps & react.RefAttributes<HTMLDivElement>>;

type FilterOperator = '=' | '!=' | '~' | '!~';

interface Filter {

    key: string;
    operator: FilterOperator;
    value: string;
}

declare const FREE_TEXT_KEY = "*";

type FilterParseResult = {
    ok: true;
    filter: Filter;
} | {
    ok: false;
    error: string;
};

declare const FILTER_OPERATORS: readonly FilterOperator[];

declare const FILTER_OPERATOR_LABELS: Record<FilterOperator, string>;

declare function tryParseFilter(text: string): FilterParseResult | null;

declare function parseFilter(text: string): Filter | null;

declare function formatFilter(filter: Filter): string;

declare function describeFilter(filter: Filter): string;

declare function sameFilter(a: Filter, b: Filter): boolean;

declare function lookupField(record: Record<string, unknown>, key: string): unknown;

declare function matchFilters(record: Record<string, unknown>, filters: readonly Filter[]): boolean;

interface FilterBarField {

    key: string;

    label?: string;

    values?: readonly string[];
}
interface FilterBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {

    filters?: readonly Filter[];

    defaultFilters?: readonly Filter[];

    onFiltersChange?: (filters: Filter[]) => void;

    fields?: readonly FilterBarField[];

    label?: string;

    hideLabel?: boolean;

    placeholder?: string;

    summary?: ReactNode;

    clearLabel?: string;
}

declare const FilterBar: react.ForwardRefExoticComponent<FilterBarProps & react.RefAttributes<HTMLDivElement>>;

type ServiceNodeKind = 'service' | 'database' | 'queue' | 'external';

interface ServiceNode {

    id: string;

    requests: number;

    errors: number;

    avgDuration: number;

    p95Duration?: number;

    kind?: ServiceNodeKind;
}

interface ServiceEdge {

    from: string;

    to: string;

    calls: number;

    errors: number;

    avgDuration: number;
}

interface ServiceGraph {

    nodes: ServiceNode[];

    edges: ServiceEdge[];
}

declare function serviceGraph(input: readonly TraceSpanInput[] | readonly (readonly TraceSpanInput[])[]): ServiceGraph;

interface ServiceGraphPoint {
    x: number;
    y: number;
}

interface ServiceGraphLayoutNode {
    id: string;
    x: number;
    y: number;

    layer: number;

    index: number;
}

interface ServiceGraphLayoutEdge {
    from: string;
    to: string;

    source: ServiceGraphPoint;

    target: ServiceGraphPoint;

    back: boolean;

    dip?: number;
}

interface ServiceGraphLayout {

    nodes: ServiceGraphLayoutNode[];

    edges: ServiceGraphLayoutEdge[];

    width: number;
    height: number;

    nodeWidth: number;
    nodeHeight: number;

    layers: number;
}

interface ServiceGraphLayoutOptions {

    columnGap?: number;

    rowGap?: number;

    nodeWidth?: number;

    nodeHeight?: number;
}

declare function layoutServiceGraph(graph: ServiceGraph, options?: ServiceGraphLayoutOptions): ServiceGraphLayout;

declare function serviceEdgePath(edge: ServiceGraphLayoutEdge): string;

declare function serviceEdgeMidpoint(edge: ServiceGraphLayoutEdge): ServiceGraphPoint;

declare function formatServiceCount(value: number): string;

declare function formatServiceErrorRate(errors: number, total: number): string;

interface ServiceMapProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {

    graph?: ServiceGraph;

    spans?: readonly TraceSpanInput[] | readonly (readonly TraceSpanInput[])[];

    selectedId?: string | null;

    defaultSelectedId?: string | null;

    onSelectedChange?: (id: string | null) => void;

    errorThreshold?: number;

    title?: string;

    height?: number | string;

    edgeLabels?: 'auto' | 'always' | 'interactive';
}

declare const ServiceMap: react.ForwardRefExoticComponent<ServiceMapProps & react.RefAttributes<HTMLDivElement>>;

interface Alert {

    id: string;

    name: string;

    state: AlertState;

    severity: AlertSeverity;

    since: number;

    service?: string;

    summary?: string;

    value?: string;

    threshold?: string;

    trend?: readonly number[];
}

declare const ALERT_STATE_ORDER: readonly AlertState[];

declare function sortAlerts(alerts: readonly Alert[]): Alert[];

declare function formatAlertDuration(alert: Pick<Alert, 'state' | 'since'>, now: number): string;
interface AlertListProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {

    alerts: readonly Alert[];

    now: number;

    stateFilter?: readonly AlertState[];

    defaultStateFilter?: readonly AlertState[];

    onStateFilterChange?: (states: AlertState[]) => void;

    selectedId?: string | null;

    defaultSelectedId?: string | null;

    onSelectedChange?: (id: string | null) => void;

    renderActions?: (alert: Alert) => ReactNode;

    heading?: ReactNode;

    emptyMessage?: ReactNode;

    label?: string;
}

declare const AlertList: react.ForwardRefExoticComponent<AlertListProps & react.RefAttributes<HTMLDivElement>>;

type IncidentEventKind = 'detected' | 'alert' | 'acknowledged' | 'update' | 'deploy' | 'mitigated' | 'resolved';

interface IncidentEvent {

    id: string;

    time: number;

    kind: IncidentEventKind;

    title: string;

    detail?: string;

    author?: string;
}

interface IncidentSummary {

    status: 'ongoing' | 'resolved';

    start: number | null;

    timeToAcknowledge: number | null;

    timeToMitigate: number | null;

    timeToResolve: number | null;

    duration: number | null;
}

declare function summariseIncident(events: readonly IncidentEvent[], now?: number): IncidentSummary;
interface IncidentTimelineProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {

    events: readonly IncidentEvent[];

    title?: ReactNode;

    severity?: AlertSeverity;

    now?: number;

    order?: 'oldest-first' | 'newest-first';

    onEventSelect?: (event: IncidentEvent) => void;

    label?: string;
}

declare const IncidentTimeline: react.ForwardRefExoticComponent<IncidentTimelineProps & react.RefAttributes<HTMLDivElement>>;

interface FreshnessIndicatorProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {

    updatedAt: number;

    now: number;

    staleAfter?: number;

    live?: boolean;

    paused?: boolean;
}

type FreshnessState = 'fresh' | 'stale' | 'paused';

declare function formatAge(ms: number): string;

declare const FreshnessIndicator: react.ForwardRefExoticComponent<FreshnessIndicatorProps & react.RefAttributes<HTMLSpanElement>>;

declare function truncateId(value: string, count?: number): string;

interface IdChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'onCopy'> {

    value: string;

    label?: string;

    truncate?: number;

    href?: string;

    copyable?: boolean;

    onCopy?: (value: string, ok: boolean) => void;
}

declare const IdChip: react.ForwardRefExoticComponent<IdChipProps & react.RefAttributes<HTMLSpanElement>>;

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

interface BlogAuthor {

    name: string;

    initials?: string;

    avatar?: ReactNode;

    url?: string;

    description?: string;
}

interface BlogPostProps {

    title: string;

    subtitle?: string;

    author?: string | BlogAuthor;

    authorCard?: react__default.ReactNode;

    date: string;

    readingTime?: string;

    tags?: string[];

    children: react__default.ReactNode;
}

declare const BlogPost: react__default.FC<BlogPostProps>;

declare const LoremIpsumPost: react__default.FC;

interface MetadataGridSeries {

    name: string;

    part?: number;

    totalParts?: number;

    href?: string;
}
interface MetadataGridCustomItem {

    label: string;

    value: ReactNode;

    href?: string;
}
interface MetadataGridProps extends HTMLAttributes<HTMLDivElement> {

    published?: string;

    readTime?: string;

    series?: MetadataGridSeries;

    tags?: string[];

    items?: MetadataGridCustomItem[];
}

declare const MetadataGrid: react.ForwardRefExoticComponent<MetadataGridProps & react.RefAttributes<HTMLDivElement>>;

type TrackItemStatus = 'completed' | 'current' | 'upcoming';
interface TrackItem {

    id: string;

    number: string;

    title: string;

    duration?: string;

    status: TrackItemStatus;

    href?: string;

    summary?: string;
}
interface TrackCardProps extends HTMLAttributes<HTMLDivElement> {

    trackNumber: string | number;

    title: string;

    description?: string;

    items: TrackItem[];
}

declare const TrackCard: react.ForwardRefExoticComponent<TrackCardProps & react.RefAttributes<HTMLDivElement>>;

interface ColophonLink {

    label: string;

    href: string;

    icon?: 'code' | 'globe' | 'share' | 'rss' | 'external';
}
interface ColophonCardProps extends HTMLAttributes<HTMLElement> {

    authorName?: string;

    authorRole?: string;

    bio?: string;

    sectionMarker?: string;

    links?: ColophonLink[];
}

declare const ColophonCard: react.ForwardRefExoticComponent<ColophonCardProps & react.RefAttributes<HTMLElement>>;

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

declare const DEFAULT_PRICING_TIERS: PricingTier[];

declare const DEFAULT_DEPLOY_LOG = "$ platform deploy --environment production\n[\u2713] Connecting to local datastore... OK\n[\u2713] Verifying 1,420 records against checksum... OK\n[\u2713] Running automation rules... APPLIED\n[\u2713] Versioned backup written to ./backups/2026-01-01/\n[*] Surface ready! Server active on http://localhost:8000";
interface SaasLandingPageProps {

    title?: string;

    subtitle?: string;

    pricingTiers?: PricingTier[];

    deployLog?: string;
}

declare const SaasLandingPage: react__default.FC<SaasLandingPageProps>;

type View = 'overview' | 'logs' | 'traces' | 'services' | 'alerts';
interface ObservabilityConsoleProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {

    defaultView?: View;
}

declare const ObservabilityConsole: react.ForwardRefExoticComponent<ObservabilityConsoleProps & react.RefAttributes<HTMLDivElement>>;

declare const OBSERVABILITY_INCIDENT_WINDOW: {
    from: number;
    to: number;
};

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

type DocsLinkProps = LinkComponentProps;
interface DocsLinkProviderProps {

    component: ElementType<DocsLinkProps>;
    children: ReactNode;
}

declare function DocsLinkProvider({ component, children }: DocsLinkProviderProps): react.JSX.Element;
declare function useDocsLinkComponent(): ElementType<DocsLinkProps>;

declare function DocsLink(props: DocsLinkProps): react.JSX.Element;

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

type FigurePalette$1 = 'mono' | 'duo' | 'multi';
declare const GLYPH_SETS: {
    readonly shade: readonly ["·", "░", "▒", "▓", "█"];
    readonly ascii: readonly [".", "-", "=", "#", "@"];
    readonly hash: readonly [".", ":", "+", "#", "█"];
    readonly bar: readonly ["▁", "▂", "▃", "▅", "█"];
};
type GlyphSetName = keyof typeof GLYPH_SETS;
type Glyphs$1 = GlyphSetName | readonly string[];
interface FigureFrameProps extends Omit<react.ComponentProps<'figure'>, 'title'> {

    title?: string;

    corner?: string;
}

declare const FigureFrame: react.ForwardRefExoticComponent<Omit<FigureFrameProps, "ref"> & react.RefAttributes<HTMLElement>>;

type FlowTone = 'default' | 'accent' | 'muted';
interface FlowNode {

    label: string;

    tone?: FlowTone;

    stretch?: boolean;
}
interface FlowRow {

    nodes: FlowNode[];
}
interface FlowPathProps {

    children?: ReactNode;
}
interface FlowDiagramProps extends react.HTMLAttributes<HTMLDivElement> {

    label?: string;

    rows?: FlowRow[];

    children?: ReactNode;

    palette?: FigurePalette$1;

    className?: string;
}

declare const Path: ((props: FlowPathProps & {
    children?: ReactNode;
}) => null) & {
    graphItem: string;
    displayName?: string;
};

declare const FlowDiagram: react.ForwardRefExoticComponent<FlowDiagramProps & react.RefAttributes<HTMLDivElement>>;

type TimelineState = 'done' | 'now' | 'next';
interface TimelineEvent {

    date: string;

    label?: string;
    state?: TimelineState;
}
interface TimelineProps extends react.HTMLAttributes<HTMLDivElement> {

    label?: string;

    events?: TimelineEvent[];

    children?: ReactNode;

    palette?: FigurePalette$1;

    className?: string;
}

declare const Event: ((props: TimelineEvent & {
    children?: ReactNode;
}) => null) & {
    graphItem: string;
    displayName?: string;
};

declare const Timeline: react.ForwardRefExoticComponent<TimelineProps & react.RefAttributes<HTMLDivElement>>;

type DiffSign = 'add' | 'remove' | 'keep';
interface DiffRow {

    label?: string;
    value: string;
    sign?: DiffSign;
}
interface DiffLineProps extends DiffRow {

    total?: boolean;
}
interface ChangeSummaryProps extends react.HTMLAttributes<HTMLDivElement> {

    label?: string;

    rows?: DiffRow[];

    footer?: DiffRow;

    children?: ReactNode;

    palette?: FigurePalette$1;

    className?: string;
}

declare const Line: ((props: DiffLineProps & {
    children?: ReactNode;
}) => null) & {
    graphItem: string;
    displayName?: string;
};

declare const ChangeSummary: react.ForwardRefExoticComponent<ChangeSummaryProps & react.RefAttributes<HTMLDivElement>>;

interface SlopeItem {

    label?: string;
    from: number | string;
    to: number | string;
}
interface BeforeAfterProps extends react.HTMLAttributes<HTMLDivElement> {

    label?: string;

    fromLabel: string;

    toLabel: string;

    items?: SlopeItem[];

    children?: ReactNode;

    palette?: FigurePalette$1;

    className?: string;
}

declare const Slope: ((props: SlopeItem & {
    children?: ReactNode;
}) => null) & {
    graphItem: string;
    displayName?: string;
};

declare const BeforeAfter: react.ForwardRefExoticComponent<BeforeAfterProps & react.RefAttributes<HTMLDivElement>>;

type UptimeStatus = 'ok' | 'degraded' | 'down' | 'empty';
interface UptimeStripProps extends react.HTMLAttributes<HTMLDivElement> {

    label?: string;

    days: UptimeStatus[] | string;

    from?: string;

    to?: string;

    columns?: number;

    glyphs?: Glyphs$1;

    palette?: FigurePalette$1;

    className?: string;
}

declare const UptimeStrip: react.ForwardRefExoticComponent<UptimeStripProps & react.RefAttributes<HTMLDivElement>>;

interface TreeNode {
    label: string;
    meta?: string;
    accent?: boolean;
    children?: TreeNode[];
}
interface NodeProps {

    label?: string;
    meta?: string;
    accent?: boolean;
    children?: ReactNode;
}
interface TreeDiagramProps extends react.HTMLAttributes<HTMLDivElement> {

    label?: string;

    nodes?: TreeNode[];

    children?: ReactNode;

    className?: string;
}

declare const Node: ((props: NodeProps & {
    children?: ReactNode;
}) => null) & {
    graphItem: string;
    displayName?: string;
};

declare const TreeDiagram: react.ForwardRefExoticComponent<TreeDiagramProps & react.RefAttributes<HTMLDivElement>>;

type FileChange = 'add' | 'modify' | 'remove' | 'rename';
type FileChangeView = 'before' | 'changes' | 'after';
interface FileChangeNode {

    name: string;

    change?: FileChange;

    note?: ReactNode;

    children?: FileChangeNode[];
}
interface FileChangeTreeProps extends Omit<react.HTMLAttributes<HTMLDivElement>, 'children'> {

    label?: string;

    nodes: FileChangeNode[];

    view?: FileChangeView;

    defaultView?: FileChangeView;

    onViewChange?: (view: FileChangeView) => void;

    hideFooter?: boolean;

    viewGroupLabel?: string;

    viewLabels?: Partial<Record<FileChangeView, string>>;

    changeLabels?: Partial<Record<FileChange, string>>;

    className?: string;
}

declare const FileChangeTree: react.ForwardRefExoticComponent<FileChangeTreeProps & react.RefAttributes<HTMLDivElement>>;

interface DrawingSheetProps extends react.HTMLAttributes<HTMLDivElement> {

    columns?: number;

    rows?: number;

    children?: ReactNode;

    className?: string;
}

declare const DrawingSheet: react.ForwardRefExoticComponent<DrawingSheetProps & react.RefAttributes<HTMLDivElement>>;

interface IndexedSectionProps extends Omit<react.HTMLAttributes<HTMLElement>, 'title'> {

    index: ReactNode;

    title: ReactNode;

    headingLevel?: 2 | 3 | 4;

    actions?: ReactNode;

    surface?: 'base' | 'raised' | 'transparent';

    children?: ReactNode;

    className?: string;
}

declare const IndexedSection: react.ForwardRefExoticComponent<IndexedSectionProps & react.RefAttributes<HTMLElement>>;

type FigureSurface = 'base' | 'sheet';

type Glyphs = 'shade' | 'ascii' | 'hash' | 'bar' | readonly string[];
type FigurePalette = 'mono' | 'duo' | 'multi';
interface ActivityDay {

    date: string;

    count: number;
}
interface ActivityGridProps extends react.HTMLAttributes<HTMLElement> {

    data: ActivityDay[];

    weekStartsOn?: 0 | 1;

    max?: number;

    legend?: boolean;

    glyphs?: Glyphs;

    palette?: FigurePalette;

    className?: string;
}

declare const ActivityGrid: react.ForwardRefExoticComponent<ActivityGridProps & react.RefAttributes<HTMLElement>>;

interface GanttItem {
    label: string;

    start: string;

    end: string;

    complete?: number;
}
interface GanttChartProps extends react.HTMLAttributes<HTMLElement> {

    items: GanttItem[];

    range?: {
        start: string;
        end: string;
    };

    columns?: number;

    className?: string;
}

declare const GanttChart: react.ForwardRefExoticComponent<GanttChartProps & react.RefAttributes<HTMLElement>>;

interface TerminalProps extends react.HTMLAttributes<HTMLDivElement> {

    label?: string;

    prompt?: string;

    children?: ReactNode;

    className?: string;
}

declare const Terminal: react.ForwardRefExoticComponent<TerminalProps & react.RefAttributes<HTMLDivElement>>;

type StepState = 'done' | 'now' | 'next';
interface StepProps {

    title?: string;

    state?: StepState;

    children?: ReactNode;
}
interface StepsProps extends react.HTMLAttributes<HTMLDivElement> {

    label?: string;

    children?: ReactNode;

    className?: string;
}

declare const Step: ((props: StepProps & {
    children?: ReactNode;
}) => null) & {
    graphItem: string;
    displayName?: string;
};

declare const Steps: react.ForwardRefExoticComponent<StepsProps & react.RefAttributes<HTMLDivElement>>;

type VerdictTone = 'neutral' | 'success' | 'warning' | 'info';
interface SwatchColumn {

    name: string;

    verdict?: string;

    tone?: VerdictTone;
}
interface SwatchRow {

    label: string;

    values: readonly (string | null)[];
}
interface SwatchCompareProps extends react.HTMLAttributes<HTMLDivElement> {

    label?: string;

    level?: ThemeLevel;

    columns: readonly SwatchColumn[];

    rows: readonly SwatchRow[];

    className?: string;
}

declare const SwatchCompare: react.ForwardRefExoticComponent<SwatchCompareProps & react.RefAttributes<HTMLDivElement>>;

type MetricTone = 'neutral' | 'success' | 'warning' | 'danger';
interface Metric {

    value: string;

    label: string;

    tone?: MetricTone;
}
interface MetricStripProps extends react.HTMLAttributes<HTMLDivElement> {

    label?: string;

    items: readonly Metric[];

    className?: string;
}

declare const MetricStrip: react.ForwardRefExoticComponent<MetricStripProps & react.RefAttributes<HTMLDivElement>>;

interface TokenRow {

    token: string;

    before?: string | null;

    after: string;

    values?: readonly string[];

    note?: string;
}
interface TokenTableProps extends react.HTMLAttributes<HTMLDivElement> {

    label?: string;

    measures?: readonly string[];

    rows: readonly TokenRow[];

    className?: string;
}

declare const TokenTable: react.ForwardRefExoticComponent<TokenTableProps & react.RefAttributes<HTMLDivElement>>;

interface DecisionOption {

    title: string;

    cost?: string;

    picked?: boolean;

    children?: react.ReactNode;
}

declare const Option: ((props: DecisionOption & {
    children?: react.ReactNode;
}) => null) & {
    graphItem: string;
    displayName?: string;
};
interface DecisionProps extends react.HTMLAttributes<HTMLDivElement> {

    question: string;

    context?: string;

    options?: readonly DecisionOption[];

    recommendation?: react.ReactNode;

    children?: react.ReactNode;

    className?: string;
}

declare const Decision: react.ForwardRefExoticComponent<DecisionProps & react.RefAttributes<HTMLDivElement>>;

interface TermItem {

    term: string;

    scale?: string;

    children?: react.ReactNode;
}

declare const Term: ((props: TermItem & {
    children?: react.ReactNode;
}) => null) & {
    graphItem: string;
    displayName?: string;
};
interface TermGridProps extends react.HTMLAttributes<HTMLDivElement> {

    label?: string;

    terms?: readonly TermItem[];

    children?: react.ReactNode;

    className?: string;
}

declare const TermGrid: react.ForwardRefExoticComponent<TermGridProps & react.RefAttributes<HTMLDivElement>>;

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
    Card: react.ForwardRefExoticComponent<CardProps & react.RefAttributes<HTMLDivElement>>;
    Tag: react.ForwardRefExoticComponent<TagProps & react.RefAttributes<HTMLSpanElement | HTMLAnchorElement>>;
    AsciiDivider: react.FC<DividerProps>;
    CodeBlock: typeof CodeBlock;
    CodeTabs: typeof CodeTabs;
    CodeTab: typeof CodeTab;
    FigureFrame: react.ForwardRefExoticComponent<Omit<FigureFrameProps, "ref"> & react.RefAttributes<HTMLElement>>;
    ActivityGrid: react.ForwardRefExoticComponent<ActivityGridProps & react.RefAttributes<HTMLElement>>;
    BeforeAfter: react.ForwardRefExoticComponent<BeforeAfterProps & react.RefAttributes<HTMLDivElement>>;
    ChangeSummary: react.ForwardRefExoticComponent<ChangeSummaryProps & react.RefAttributes<HTMLDivElement>>;
    FlowDiagram: react.ForwardRefExoticComponent<FlowDiagramProps & react.RefAttributes<HTMLDivElement>>;
    GanttChart: react.ForwardRefExoticComponent<GanttChartProps & react.RefAttributes<HTMLElement>>;
    Timeline: react.ForwardRefExoticComponent<TimelineProps & react.RefAttributes<HTMLDivElement>>;
    TreeDiagram: react.ForwardRefExoticComponent<TreeDiagramProps & react.RefAttributes<HTMLDivElement>>;
    FileChangeTree: react.ForwardRefExoticComponent<FileChangeTreeProps & react.RefAttributes<HTMLDivElement>>;
    DrawingSheet: react.ForwardRefExoticComponent<DrawingSheetProps & react.RefAttributes<HTMLDivElement>>;
    IndexedSection: react.ForwardRefExoticComponent<IndexedSectionProps & react.RefAttributes<HTMLElement>>;
    UptimeStrip: react.ForwardRefExoticComponent<UptimeStripProps & react.RefAttributes<HTMLDivElement>>;
    Terminal: react.ForwardRefExoticComponent<TerminalProps & react.RefAttributes<HTMLDivElement>>;
    Steps: react.ForwardRefExoticComponent<StepsProps & react.RefAttributes<HTMLDivElement>>;
    Path: ((props: FlowPathProps & {
        children?: ReactNode;
    }) => null) & {
        graphItem: string;
        displayName?: string;
    };
    Event: ((props: TimelineEvent & {
        children?: ReactNode;
    }) => null) & {
        graphItem: string;
        displayName?: string;
    };
    Line: ((props: DiffLineProps & {
        children?: ReactNode;
    }) => null) & {
        graphItem: string;
        displayName?: string;
    };
    Slope: ((props: SlopeItem & {
        children?: ReactNode;
    }) => null) & {
        graphItem: string;
        displayName?: string;
    };
    Node: ((props: NodeProps & {
        children?: ReactNode;
    }) => null) & {
        graphItem: string;
        displayName?: string;
    };
    Step: ((props: StepProps & {
        children?: ReactNode;
    }) => null) & {
        graphItem: string;
        displayName?: string;
    };
    SwatchCompare: react.ForwardRefExoticComponent<SwatchCompareProps & react.RefAttributes<HTMLDivElement>>;
    MetricStrip: react.ForwardRefExoticComponent<MetricStripProps & react.RefAttributes<HTMLDivElement>>;
    TokenTable: react.ForwardRefExoticComponent<TokenTableProps & react.RefAttributes<HTMLDivElement>>;
    Decision: react.ForwardRefExoticComponent<DecisionProps & react.RefAttributes<HTMLDivElement>>;
    Option: ((props: DecisionOption & {
        children?: ReactNode;
    }) => null) & {
        graphItem: string;
        displayName?: string;
    };
    TermGrid: react.ForwardRefExoticComponent<TermGridProps & react.RefAttributes<HTMLDivElement>>;
    Term: ((props: TermItem & {
        children?: ReactNode;
    }) => null) & {
        graphItem: string;
        displayName?: string;
    };
};
type MdxComponents = typeof mdxComponents;

export {
  ALERT_STATE_ORDER,
  ANSI_SLOTS,
  type AccentToken,
  type ActivityDay,
  ActivityGrid,
  type ActivityGridProps,
  type Alert,
  AlertDialog,
  type AlertDialogProps,
  AlertList,
  type AlertListProps,
  type AlertSeverity,
  type AlertState,
  AnchorHeading,
  type AnchorHeadingProps,
  type AnsiChrome,
  type AnsiHue,
  type AnsiScheme,
  type AnsiSlot,
  AppMain,
  type AppMainProps,
  type AppNavItem,
  AppShell,
  type AppShellProps,
  AppSidebar,
  AppSidebarNav,
  type AppSidebarNavProps,
  type AppSidebarProps,
  AppTopbar,
  type AppTopbarProps,
  AsciiDivider,
  type AsciiDividerProps,
  AsciiGauge,
  type AsciiGaugeProps,
  type AsciiGaugeVariant,
  type AssessmentOutcome,
  Avatar,
  type AvatarProps,
  BENCHMARK_CLASSIFICATIONS,
  BENCHMARK_COMPARE_VARIANTS,
  BENCHMARK_INTERVAL_METHODS,
  BENCHMARK_TREND_VARIANTS,
  BUTTON_APPEARANCES,
  Badge,
  type BadgeProps,
  BarChart,
  type BarChartDatum,
  type BarChartProps,
  BeforeAfter,
  type BeforeAfterProps,
  type BenchmarkClassification,
  BenchmarkCompare,
  type BenchmarkCompareLayout,
  type BenchmarkCompareOptions,
  type BenchmarkCompareProps,
  type BenchmarkCompareSort,
  type BenchmarkComparison,
  type BenchmarkDirection,
  type BenchmarkDotNetBenchmark,
  type BenchmarkDotNetMeasurement,
  type BenchmarkDotNetReport,
  type BenchmarkDotNetStatistics,
  type BenchmarkInconclusiveReason,
  type BenchmarkInput,
  type BenchmarkIntervalMethod,
  type BenchmarkRun,
  BenchmarkTrend,
  type BenchmarkTrendInterval,
  type BenchmarkTrendPoint,
  type BenchmarkTrendProps,
  type BlogAuthor,
  BlogPost,
  type BlogPostProps,
  BlueskyIcon,
  type BorderTone,
  BracketText,
  type BracketTextProps,
  Breadcrumbs,
  type BreadcrumbsProps,
  type BrutalistTheme,
  type BuildFlameOptions,
  type BuildTraceOptions,
  BulletChart,
  type BulletChartProps,
  Button,
  type ButtonAppearance,
  type ButtonElementProps,
  type ButtonLinkProps,
  type ButtonProps,
  type ButtonVariant,
  CSS_MEDIUM,
  CTASection,
  type CTASectionAccent,
  type CTASectionProps,
  Card,
  type CardProps,
  type CardVariant,
  type CardWeight,
  ChangeBar,
  type ChangeBarProps,
  ChangeCount,
  type ChangeCountProps,
  ChangeIndex,
  type ChangeIndexFile,
  type ChangeIndexGroup,
  type ChangeIndexProps,
  ChangeSummary,
  type ChangeSummaryProps,
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
  ColophonCard,
  type ColophonCardProps,
  type ColophonLink,
  type Column,
  type ContrastCheck,
  type ContrastFloor,
  type Crumb,
  DEFAULT_DEPLOY_LOG,
  DEFAULT_EXPERIMENTS,
  DEFAULT_LEVEL,
  DEFAULT_PRICING_TIERS,
  DEFAULT_PULL_REQUEST,
  DEFAULT_REVIEW_REPORT,
  DISTRIBUTION_COMPARE_VARIANTS,
  DIVIDER_MARKS,
  DIVIDER_PATTERNS,
  DataTable,
  type DataTableProps,
  type DataTableVirtualization,
  Decision,
  type DecisionOption,
  type DecisionProps,
  type Delta,
  type DeltaGround,
  type DeltaStatus,
  DeltaValue,
  type DeltaValueProps,
  DesignSandbox,
  type DiffFlameOptions,
  type DiffHunk,
  type DiffLine,
  type DiffLineComment,
  type DiffLineKind,
  type DiffLineProps,
  type DiffRow,
  type DiffSign,
  DiffView,
  type DiffViewProps,
  DistributionCompare,
  type DistributionCompareProps,
  type DistributionCompareVariant,
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
  DrawingSheet,
  type DrawingSheetProps,
  type Emphasis,
  EmptyState,
  type EmptyStateProps,
  ErrorSummary,
  type ErrorSummaryError,
  type ErrorSummaryProps,
  Event,
  type EvidenceStatus,
  type ExperimentItem,
  ExperimentsView,
  type ExperimentsViewProps,
  FILTER_OPERATORS,
  FILTER_OPERATOR_LABELS,
  FIXED_COLOURS,
  FLAME_FULL_WINDOW,
  FLAME_MIN_WINDOW,
  FREE_TEXT_KEY,
  Feature,
  FeatureGrid,
  type FeatureGridProps,
  type FeatureProps,
  Fieldset,
  type FieldsetProps,
  FigureFrame,
  type FigureFrameProps,
  type FigureSurface,
  type FileChange,
  type FileChangeNode,
  FileChangeTree,
  type FileChangeTreeProps,
  type FileChangeView,
  type Filter,
  FilterBar,
  type FilterBarField,
  type FilterBarProps,
  type FilterOperator,
  type FilterParseResult,
  type Finding,
  type FixedColour,
  type FlameDelta,
  type FlameDeltaTone,
  type FlameDeltaToneOptions,
  type FlameDepthSpec,
  type FlameDepthWindow,
  type FlameDiff,
  type FlameDiffIncompatible,
  type FlameDiffStatus,
  type FlameFrame,
  type FlameFrameDelta,
  type FlameFromTraceOptions,
  type FlameOrder,
  type FlamePackage,
  type FlamePalette,
  type FlameRankedFrame,
  type FlameRole,
  type FlameSearchResult,
  type FlameStack,
  type FlameSwatch,
  type FlameTree,
  type FlameUnit,
  type FlameViewFrame,
  type FlameWindow,
  type FlameWindowFrame,
  type FlameWindowSpec,
  Flamegraph,
  type FlamegraphProps,
  FlowDiagram,
  type FlowDiagramProps,
  type FlowNode,
  type FlowPathProps,
  type FlowRow,
  type FlowTone,
  type FoldedStacks,
  FreshnessIndicator,
  type FreshnessIndicatorProps,
  type FreshnessState,
  GanttChart,
  type GanttChartProps,
  type GanttItem,
  type GitHubActionsJob,
  type GitHubActionsRun,
  type GitHubActionsStep,
  GitHubIcon,
  type GitHubRunTraceOptions,
  Glyph,
  type GlyphProps,
  HEADING_EMPHASIS,
  type HeadingLevel,
  Hero,
  type HeroProps,
  type Hue,
  type HueAgreementCheck,
  type HueRef,
  INCONCLUSIVE_REASON_TEXT,
  INK_WEIGHT,
  IdChip,
  type IdChipProps,
  type IncidentEvent,
  type IncidentEventKind,
  type IncidentSummary,
  IncidentTimeline,
  type IncidentTimelineProps,
  IndexedSection,
  type IndexedSectionProps,
  Input,
  type InputProps,
  type IntensityScale,
  type Intent,
  type KeyedChange,
  KeyedDiff,
  type KeyedDiffProps,
  type KeyedDiffRow,
  LATENCY_HEATMAP_VARIANTS,
  LATENCY_HISTOGRAM_VARIANTS,
  LEVELS,
  LOG_SEVERITIES,
  type LatencyBucket,
  type LatencyCell,
  type LatencyGrid,
  LatencyHeatmap,
  type LatencyHeatmapProps,
  LatencyHistogram,
  type LatencyHistogramProps,
  type LatencyPoint,
  type LatencySlo,
  Legend,
  type LegendProps,
  type LevelDefinition,
  Line,
  type LinkComponentProps,
  LinkProvider,
  type LinkProviderProps,
  LinkedInIcon,
  type LogEntry,
  type LogFieldValue,
  type LogFilter,
  type LogHighlightPart,
  type LogSeverity,
  LogViewer,
  type LogViewerProps,
  LoremIpsumPost,
  MAXIMUM_NEUTRAL_CHROMA,
  MEDIA,
  MEDIA_DEFINITIONS,
  MINIMUM_RATIO,
  MailIcon,
  type MdxComponents,
  type Medium,
  type MediumDefinition,
  Menu,
  MenuItem,
  type MenuItemProps,
  type MenuProps,
  MenuRadioGroup,
  type MenuRadioGroupProps,
  MenuRadioItem,
  type MenuRadioItemProps,
  MenuSeparator,
  type MenuSeparatorProps,
  MetadataGrid,
  type MetadataGridCustomItem,
  type MetadataGridProps,
  type MetadataGridSeries,
  type Metric,
  type MetricDirection,
  MetricStrip,
  type MetricStripProps,
  type MetricTone,
  Minimap,
  type MinimapMark,
  type MinimapProps,
  type MinimapTone,
  MobileNav,
  type MobileNavProps,
  Modal,
  type ModalProps,
  type Motion,
  NERD_GLYPHS,
  NerdIcon,
  type NerdIconAccent,
  type NerdIconName,
  type NerdIconProps,
  Node,
  type NodeProps,
  NotFoundPage,
  type NotFoundPageProps,
  NoteBlock,
  type NoteBlockProps,
  OBSERVABILITY_INCIDENT_WINDOW,
  ObservabilityConsole,
  type ObservabilityConsoleProps,
  Option,
  type OverlayAlign,
  type OverlaySide,
  PACKAGE_SWATCHES,
  PALETTE_HUES,
  PageHeader,
  type PageHeaderProps,
  PageTitle,
  type PageTitleProps,
  Pagination,
  type PaginationProps,
  Path,
  type Polarity,
  Popover,
  type PopoverProps,
  PricingGrid,
  type PricingGridProps,
  PricingTier,
  type PricingTierAccent,
  type PricingTierProps,
  Progress,
  type ProgressProps,
  Prose,
  type ProseProps,
  type ProvenanceItem,
  ProvenanceStrip,
  type ProvenanceStripProps,
  type PullRequestCheck,
  type PullRequestData,
  PullRequestPage,
  type PullRequestPageProps,
  type PullRequestState,
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
  type RatioInterval,
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
  type ReviewColumn,
  type ReviewFileGroup,
  type ReviewMeasurementTable,
  type ReviewRecordTable,
  type ReviewReportData,
  ReviewReportPage,
  type ReviewReportPageProps,
  type ReviewValue,
  type ReviewerState,
  type Rgb,
  SAME_SWATCHES,
  SAMPLE_BASELINE_COMMIT,
  SAMPLE_CALLGRAPH_HUNKS,
  SAMPLE_DUPLICATION_HUNKS,
  SAMPLE_METRICS_HUNKS,
  SEVERITY_ACCENTS,
  SLIDE_DECK_HOTKEYS,
  SLOTS,
  STATUS_APPEARANCE,
  STATUS_TONE_TEXT,
  SYSTEM_LEVEL,
  SaasLandingPage,
  type SaasLandingPageProps,
  type SampleSummary,
  type SectionAlign,
  type SectionColumns,
  SectionContainer,
  type SectionContainerProps,
  Select,
  type SelectOption,
  type SelectProps,
  type SelectionDevice,
  type SelectionDeviceCheck,
  ServerErrorPage,
  type ServerErrorPageProps,
  type ServiceEdge,
  type ServiceGraph,
  type ServiceGraphLayout,
  type ServiceGraphLayoutEdge,
  type ServiceGraphLayoutNode,
  type ServiceGraphLayoutOptions,
  type ServiceGraphPoint,
  ServiceMap,
  type ServiceMapProps,
  type ServiceNode,
  type ServiceNodeKind,
  type Severity,
  SeverityBadge,
  type SeverityBadgeProps,
  SiteFooter,
  type SiteFooterProps,
  SiteHeader,
  type SiteHeaderCollapse,
  type SiteHeaderProps,
  SiteLink,
  type SiteLinkProps,
  SiteNav,
  type SiteNavGroupItemProps,
  SiteNavItem,
  type SiteNavItemProps,
  type SiteNavLinkItemProps,
  type SiteNavOrientation,
  type SiteNavProps,
  Skeleton,
  type SkeletonProps,
  Slide,
  SlideDeck,
  type SlideDeckHotkey,
  type SlideDeckProps,
  type SlideProps,
  Slope,
  type SlopeItem,
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
  type StatCardAppearance,
  type StatCardProps,
  type StatusAppearance,
  StatusMark,
  type StatusMarkProps,
  StatusPage,
  type StatusPageProps,
  type StatusTone,
  type StatusVocabularies,
  type StatusVocabulary,
  Step,
  type StepProps,
  type StepState,
  Steps,
  type StepsProps,
  type Surface,
  Swatch,
  type SwatchColumn,
  SwatchCompare,
  type SwatchCompareProps,
  SwatchGroup,
  type SwatchGroupProps,
  type SwatchProps,
  type SwatchRow,
  Switch,
  type SwitchProps,
  THEME_ATTRIBUTE,
  THEME_LEVELS,
  THEME_STORAGE_KEY,
  TIME_RANGE_PRESETS,
  TIME_SERIES_VARIANTS,
  TLDR,
  type TLDRProps,
  TOKEN_RULES,
  Table,
  type TableAppearance,
  TableBody,
  TableCaption,
  TableCell,
  type TableDensity,
  TableFooter,
  TableHead,
  TableHeader,
  TableOfContents,
  type TableOfContentsProps,
  TableRow,
  Tabs,
  type TabsFont,
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
  TelemetryGauge,
  type TelemetryGaugeProps,
  type TelemetryMachineState,
  Term,
  TermGrid,
  type TermGridProps,
  type TermItem,
  Terminal,
  type TerminalProps,
  TextArea,
  type TextAreaProps,
  type TextHierarchyStep,
  type TextTone,
  type ThemeContextValue,
  type ThemeLevel,
  ThemeProvider,
  type ThemeProviderProps,
  TickerTape,
  type TickerTapeProps,
  type TimeCursorState,
  type TimeRange,
  TimeRangePicker,
  type TimeRangePickerProps,
  type TimeRangePreset,
  TimeRangeProvider,
  type TimeRangeProviderProps,
  type TimeRangeState,
  type TimeSeries,
  type TimeSeriesAnnotation,
  TimeSeriesChart,
  type TimeSeriesChartProps,
  type TimeSeriesColorStrategy,
  type TimeSeriesCurve,
  type TimeSeriesDensity,
  type TimeSeriesGrid,
  type TimeSeriesLegend,
  type TimeSeriesPoint,
  type TimeSeriesPointMarkers,
  type TimeSeriesThreshold,
  type TimeSeriesVariant,
  type TimeSeriesYDomain,
  type TimeSeriesYScale,
  Timeline,
  type TimelineEvent,
  type TimelineProps,
  type TimelineState,
  type ToastActionOptions,
  type ToastApi,
  type ToastIntent,
  type ToastOptions,
  ToastProvider,
  type ToastProviderProps,
  type TocEntry,
  type TokenRow,
  type TokenRule,
  TokenTable,
  type TokenTableProps,
  Tooltip,
  type TooltipProps,
  type TraceAttributeValue,
  type TraceModel,
  type TraceReplay,
  type TraceSpan,
  type TraceSpanInput,
  type TraceSpanStatus,
  TraceViewer,
  type TraceViewerProps,
  TraceWaterfall,
  type TraceWaterfallProps,
  type TraceWindow,
  TrackCard,
  type TrackCardProps,
  type TrackItem,
  type TrackItemStatus,
  TreeDiagram,
  type TreeDiagramProps,
  type TreeNode,
  type TrustStatus,
  type TypeStep,
  type TypeStepName,
  type UptimeStatus,
  UptimeStrip,
  type UptimeStripProps,
  type UseActiveHeadingOptions,
  type UseCopyToClipboardResult,
  type UseTraceClockOptions,
  type UseTraceReplayOptions,
  VIEWPORT_FULL_WINDOW,
  VIEWPORT_MIN_WINDOW,
  VerdictBand,
  type VerdictBandProps,
  type VerdictTone,
  type ViewportRows,
  type ViewportWindow,
  WARM_SWATCHES,
  WEB_FLOOR,
  XIcon,
  accentVar,
  ansiScheme,
  apcaContrast,
  assertNever,
  auditContrast,
  auditHueAgreement,
  auditSelectionDevices,
  auditTextHierarchy,
  benchmarkDisplayUnit,
  benchmarkImpact,
  bootstrapRatioInterval,
  borderVar,
  bucketIndex,
  bucketPercentile,
  bucketTimes,
  buildFlame,
  buildTrace,
  centreViewportRows,
  childrenToText,
  ciConclusionStatus,
  clampFlameDepth,
  clampFlameWindow,
  clampToRange,
  clampViewportRows,
  clampViewportWindow,
  classifyInterval,
  cn,
  collectHeadings,
  compareBenchmark,
  compareBenchmarks,
  composite,
  contrastRatio,
  countDiff,
  createAnchorHeading,
  deltaTrend,
  describeFilter,
  describeFlameFrame,
  describeLogEntry,
  describeTraceSpan,
  diffAnchor,
  diffFlame,
  filterLogEntries,
  fitFlameDepth,
  fitFlameLabel,
  fitFlameWindow,
  fitViewportWindow,
  flameDeltaTone,
  flameFromTrace,
  flameNameHash,
  flamePackage,
  flamePath,
  flameSameSwatch,
  flameSubtreeDepth,
  flameSwatch,
  flameWindowFrame,
  fontVar,
  formatAge,
  formatAlertDuration,
  formatBenchmarkValue,
  formatClock,
  formatCount,
  formatDay,
  formatFilter,
  formatFlameDelta,
  formatFlameShare,
  formatFlameValue,
  formatLatencyRange,
  formatPercent,
  formatRange,
  formatRangeDuration,
  formatRatio,
  formatRatioChange,
  formatRequests,
  formatServiceCount,
  formatServiceErrorRate,
  formatShare,
  formatSignificant,
  formatTimeTick,
  formatTimestamp,
  formatTraceDuration,
  fromBenchmarkDotNet,
  getRecommendedColours,
  getThemeInitScript,
  githubRunToSpans,
  heatmapCells,
  highlightLogText,
  histogram,
  hottestFlameFrame,
  inLogRange,
  intensityLevel,
  intensityThresholds,
  isExternalHref,
  isMedium,
  isRecommendedColourClass,
  isThemeLevel,
  kernelDensity,
  latencyBuckets,
  latencyExtent,
  latencyRowPosition,
  layoutServiceGraph,
  linearBuckets,
  logTicks,
  lookupField,
  mannWhitneyRatioInterval,
  matchFilters,
  matchLogEntry,
  matchTraceSpan,
  mdxComponents,
  median,
  medianInterval,
  mulberry32,
  nearestLogIndex,
  nextLevel,
  noiseBand,
  normalQuantile,
  normaliseRange,
  pairBenchmarkRuns,
  panFlameDepth,
  panFlameWindow,
  panViewportRows,
  panViewportWindow,
  parseColor,
  parseFilter,
  parseFoldedStacks,
  parseOtlpTrace,
  parseTraceDocument,
  parseUnifiedDiff,
  percentile,
  percentiles,
  presetRange,
  rankFlameFrames,
  rankFlameFunctions,
  relativeLuminance,
  replayTrace,
  resolveFlameDepth,
  resolveFlameWindow,
  sameFilter,
  sameFlameWindow,
  sameViewportWindow,
  scanRules,
  scanTokenRules,
  searchFlame,
  semanticTokens,
  serviceEdgeMidpoint,
  serviceEdgePath,
  serviceGraph,
  severityAccent,
  shareAbove,
  slugify,
  sortAlerts,
  sortByImpact,
  sortLogEntries,
  statusAppearance,
  summariseIncident,
  summarize,
  surfaceVar,
  textVar,
  timeTicks,
  truncateId,
  tryParseFilter,
  useActiveHeading,
  useCopyToClipboard,
  useDocsLinkComponent,
  useIsCurrentHref,
  useLinkComponent,
  useOptionalTheme,
  useOptionalToast,
  useTheme,
  useTimeCursor,
  useTimeRange,
  useToast,
  useTraceClock,
  useTraceReplay,
  visibleTraceSpans,
  windowFlame,
  zoomFlame,
  zoomFlameDepth,
  zoomFlameWindow,
  zoomViewportRows,
  zoomViewportWindow,
};
