/**
 * Types for the derived-whitelist helper, so `src/lint.test.ts` can import it
 * under `strict` without the module widening to `any` — which would have made
 * the whitelist assertions typecheck while proving nothing.
 */
export declare function authoredClasses(): string[];
