/*
 * A consumer's page: the twelve names `rtkelly13/blog` imports (the same set
 * `check:import-cost` weighs in bytes), rendered the way a post page renders
 * them. `check:type-cost` counts what compiling this costs `tsc`.
 */
import {
  BracketText,
  Button,
  Card,
  LEVELS,
  NoteBlock,
  PageHeader,
  PageTitle,
  Pagination,
  SectionContainer,
  TLDR,
  Tag,
  isThemeLevel,
} from '@rtkelly-labs/design-system';

export function PostPage({ level, page }: { level: string; page: number }) {
  const polarity = isThemeLevel(level) ? LEVELS[level].polarity : 'dark';
  return (
    <SectionContainer>
      <PageHeader title="Notes" subtitle={polarity} accent="secondary" />
      <PageTitle subtitle="2026-11-10" bracketed>
        A post
      </PageTitle>
      <TLDR>One line.</TLDR>
      <NoteBlock type="tip" title="Tip">
        <BracketText accent="primary">read this</BracketText>
      </NoteBlock>
      <Card title="Related" description="Another post" href="/posts/2" />
      <Tag text="typescript" href="/tags/typescript" />
      <Button href="/posts" variant="secondary" bracketed>
        All posts
      </Button>
      <Pagination totalPages={9} currentPage={page} getPageHref={(n) => `/page/${n}`} />
    </SectionContainer>
  );
}
