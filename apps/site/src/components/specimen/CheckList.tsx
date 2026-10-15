import type { Check } from './look';
import { Label } from './parts';

/** Pass or fail, one line of reason each. The raw numbers belong in a `NumbersDisclosure`. */
export function CheckList({ checks, title = 'Checks' }: { checks: Check[]; title?: string }) {
  const fails = checks.filter((c) => !c.ok).length;
  return (
    <div className="flex flex-col gap-2">
      <Label>{`[ ${title} · ${checks.length - fails} pass, ${fails} fail ]`}</Label>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {checks.map((c) => (
          <li key={c.title} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-2 text-sm">
            <span aria-hidden="true" className={`font-mono text-base font-bold leading-5 ${c.ok ? 'text-intent-success' : 'text-intent-danger'}`}>
              {c.ok ? '✓' : '✕'}
            </span>
            <span className="min-w-0">
              <span className="sr-only">{c.ok ? 'Pass: ' : 'Fail: '}</span>
              <span className="font-bold text-content-primary">{c.title}</span>
              <span className="block text-xs text-content-secondary">{c.reason}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
