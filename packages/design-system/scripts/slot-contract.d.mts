export type AliasKind = 'shared-frame' | 'delegate' | 'no-dom-root' | 'legacy-name' | 'data-carrier';
export interface Alias {
  kind: AliasKind;
  reason: string;
  slot?: string;
  family?: string;
}
export declare const ALIASES: Record<string, Alias>;
export declare function kebab(name: string): string;
export declare function expectedSlot(name: string): string;
export declare const KEBAB: RegExp;
