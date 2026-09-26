import { Button, EmptyState } from '@/ds';
import { SiteChrome } from '@/components/chrome/SiteChrome';

export default function NotFound() {
  return (
    <SiteChrome>
      <div className="mx-auto max-w-3xl px-4 py-24">
        <EmptyState
          title="404: NO SUCH PAGE"
          description="The path does not match any page. Every page on this site is built ahead of time, so it has never existed."
          action={
            <Button href="/docs" variant="primary" bracketed>
              GO TO THE DOCS
            </Button>
          }
        />
      </div>
    </SiteChrome>
  );
}
