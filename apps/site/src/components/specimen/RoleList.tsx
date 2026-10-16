import { Label } from './parts';
import { BracketText } from '@rtkelly13/design-system';

/** "How it's structured": one bullet per role, naming the job it does. */
export function RoleList({ roles, title = "How it's structured" }: { roles: readonly (readonly [role: string, job: string])[]; title?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label><BracketText>{title}</BracketText></Label>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {roles.map(([role, job]) => (
          <li key={role} className="text-sm text-content-secondary">
            <span className="font-bold text-content-primary">{role}.</span> {job}
          </li>
        ))}
      </ul>
    </div>
  );
}
