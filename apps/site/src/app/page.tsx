import { Button, CodeBlock, CTASection, Hero } from '@/ds';
import { SiteChrome } from '@/components/chrome/SiteChrome';
import { ButtonPlayground } from '@/components/home/ButtonPlayground';
import { Dashboard } from '@/components/home/Dashboard';
import { DemoPanel, SectionHead } from '@/components/home/DemoPanel';
import { LevelsDemo } from '@/components/home/LevelsDemo';
import { Principles } from '@/components/home/Principles';
import CreateTokenForm from '@/examples/input/validated-form';

/**
 * The homepage. A Server Component composing client islands: every demo below
 * is a live component from the package, fed seeded fixtures, and each one
 * links into the page that documents it.
 */
export default function Home() {
  return (
    <SiteChrome>
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="pt-16 pb-4 sm:pt-24">
          <Hero
            eyebrow={
              <span className="font-mono text-sm font-bold tracking-[0.2em] text-accent-primary">&gt; RTK_DESIGN_SYSTEM.exe</span>
            }
            title="RTK / DS"
            subtitle="Brutalist components for React and Tailwind v4. Zero radius, hard shadows, colour by role, and contrast checked in CI. Everything on this page is a live component."
            actions={
              <>
                <Button href="/docs/installation" variant="primary" size="lg" bracketed>
                  GET STARTED
                </Button>
                <Button href="/docs/components" variant="inverse" size="lg">
                  BROWSE COMPONENTS
                </Button>
              </>
            }
          >
            <div className="mx-auto max-w-xl text-left">
              <CodeBlock language="bash" title="install">
                <code>pnpm add @rtkelly13/design-system</code>
              </CodeBlock>
            </div>
          </Hero>
        </div>

        <section className="py-16" aria-labelledby="live">
          <SectionHead id="live" eyebrow="LIVE" title="A deploy dashboard, from the box">
            Sort the table, page through it, switch the chart&apos;s window, promote a preview deploy. It is all package
            components and seeded fake data.
          </SectionHead>
          <Dashboard />
        </section>

        <section className="py-16" aria-labelledby="playground">
          <SectionHead id="playground" eyebrow="PLAYGROUND" title="Every prop, and the JSX it writes" />
          <div className="grid gap-6 lg:grid-cols-2">
            <DemoPanel label="Button" docs="/docs/components/button">
              <ButtonPlayground />
            </DemoPanel>
            <DemoPanel label="Input + ErrorSummary" docs="/docs/components/input#validated-form">
              <CreateTokenForm />
            </DemoPanel>
          </div>
        </section>

        <section className="py-16" aria-labelledby="levels">
          <SectionHead id="levels" eyebrow="LEVELS" title="One markup, two drawings">
            Midnight is neon on blue-black. Sketch is warm paper and pen ink. The same classes produce both, and a scoped
            provider can nest one inside the other.
          </SectionHead>
          <LevelsDemo />
        </section>

        <section className="py-16">
          <Principles />
        </section>

        <section className="pb-24">
          <CTASection
            title="Install it and ship something square"
            actions={
              <Button href="/docs/installation" variant="primary" bracketed>
                READ THE INSTALL GUIDE
              </Button>
            }
          >
            One stylesheet, one provider, and a client boundary for Next.js. The install guide covers all three.
          </CTASection>
        </section>
      </div>
    </SiteChrome>
  );
}
