/**
 * The status words a review reports, as closed vocabularies.
 *
 * Four documents, four sets of words, taken from the Diffra protocol (ADR 0004
 * and its trust reference) rather than invented here: an Assessment has an
 * outcome, a Delta and an Evidence document each have a status, and a Baseline
 * reference has a trust state. Several words share a colour, so each also has a
 * fixed glyph — a report is printed, read in greyscale and read by people who
 * cannot tell two shades apart, so the word and the glyph carry the meaning and
 * the colour only repeats it.
 *
 * Of the comparison words only `invalid` takes an intent colour. A comparison
 * describes change; whether that change is acceptable is a policy's call, so
 * `changed` is never painted as a warning and `unchanged` never as a success.
 */

/** A policy's verdict on a Delta. `none` is the report that carries no Assessment at all. */
export type AssessmentOutcome = 'pass' | 'warn' | 'fail' | 'needs-review' | 'inconclusive' | 'none';

/** What a comparison found. Every word but `changed` and `unchanged` means it could not compare. */
export type DeltaStatus =
  | 'unchanged'
  | 'changed'
  | 'unavailable'
  | 'invalid'
  | 'incompatible'
  | 'inconclusive'
  | 'unsupported';

/** Whether a producer's evidence exists and is usable. */
export type EvidenceStatus = 'produced' | 'unavailable' | 'invalid' | 'inconclusive';

/** Whether a baseline may be compared against. Only `trusted` can satisfy a gate. */
export type TrustStatus = 'trusted' | 'candidate' | 'untrusted' | 'missing' | 'corrupt' | 'incompatible';

/** The four vocabularies, by the document that reports them. */
export interface StatusVocabularies {
  outcome: AssessmentOutcome;
  delta: DeltaStatus;
  evidence: EvidenceStatus;
  trust: TrustStatus;
}

export type StatusVocabulary = keyof StatusVocabularies;

/**
 * How a status is drawn. `hollow` is a dashed, muted mark for "could not tell":
 * not an alarm, and visibly not a result either.
 */
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'hollow';

export interface StatusAppearance {
  glyph: string;
  tone: StatusTone;
  /** The word printed, which is the status itself unless it reads badly in caps. */
  word: string;
}

export const STATUS_APPEARANCE: { readonly [V in StatusVocabulary]: Readonly<Record<StatusVocabularies[V], StatusAppearance>> } = {
  outcome: {
    pass: { glyph: '✓', tone: 'success', word: 'pass' },
    warn: { glyph: '!', tone: 'warning', word: 'warn' },
    fail: { glyph: '✕', tone: 'danger', word: 'fail' },
    'needs-review': { glyph: '?', tone: 'info', word: 'needs review' },
    inconclusive: { glyph: '~', tone: 'hollow', word: 'inconclusive' },
    none: { glyph: '○', tone: 'hollow', word: 'no verdict' },
  },
  delta: {
    unchanged: { glyph: '=', tone: 'neutral', word: 'unchanged' },
    changed: { glyph: 'Δ', tone: 'neutral', word: 'changed' },
    unavailable: { glyph: '○', tone: 'hollow', word: 'unavailable' },
    invalid: { glyph: '✕', tone: 'danger', word: 'invalid' },
    incompatible: { glyph: '!=', tone: 'hollow', word: 'incompatible' },
    inconclusive: { glyph: '~', tone: 'hollow', word: 'inconclusive' },
    unsupported: { glyph: '?', tone: 'hollow', word: 'unsupported' },
  },
  evidence: {
    produced: { glyph: '●', tone: 'neutral', word: 'produced' },
    unavailable: { glyph: '○', tone: 'hollow', word: 'unavailable' },
    invalid: { glyph: '✕', tone: 'danger', word: 'invalid' },
    inconclusive: { glyph: '~', tone: 'hollow', word: 'inconclusive' },
  },
  trust: {
    trusted: { glyph: '◆', tone: 'success', word: 'trusted' },
    candidate: { glyph: '◇', tone: 'info', word: 'candidate' },
    untrusted: { glyph: '!', tone: 'warning', word: 'untrusted' },
    missing: { glyph: '○', tone: 'hollow', word: 'missing' },
    corrupt: { glyph: '✕', tone: 'danger', word: 'corrupt' },
    incompatible: { glyph: '!=', tone: 'hollow', word: 'incompatible' },
  },
};

/** Text colour per tone. A status is meaning, so it uses intent roles and never accents. */
export const STATUS_TONE_TEXT: Readonly<Record<StatusTone, string>> = {
  success: 'text-intent-success',
  warning: 'text-intent-warning',
  danger: 'text-intent-danger',
  info: 'text-intent-info',
  neutral: 'text-content-secondary',
  hollow: 'text-content-muted',
};

/** Looks a status up in its vocabulary. */
export function statusAppearance<V extends StatusVocabulary>(vocabulary: V, status: StatusVocabularies[V]): StatusAppearance {
  return (STATUS_APPEARANCE[vocabulary] as Readonly<Record<string, StatusAppearance>>)[status]!;
}
