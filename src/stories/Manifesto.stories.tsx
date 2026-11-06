import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  SystemFacts,
  LevelDiptych,
  RoleLookup,
  HueLadder,
  ContrastGate,
  SurfaceRamp,
  FormSpecimen,
  TypeSpecimen,
  MediumTable,
  AnsiTarget,
  GraphicTarget,
  MotionSpecimen,
  UsageTabs,
  VoiceSpecimen,
} from './manifesto';

/**
 * The manifesto's specimens, as stories.
 *
 * They are stories rather than plain JSX in the MDX for one reason: Storybook's
 * decorators wrap *stories*, so a docs page carrying none of them is a page the
 * `Level` toolbar cannot reach. `.storybook/preview.ts` sets `data-theme` on the
 * preview iframe's own `<html>`, so one rendered story themes the whole document
 * — the surrounding prose included. That is what makes the toolbar authoritative
 * here instead of a second switch on the page.
 *
 * `!dev` keeps them out of the sidebar. Each one is a fragment of a single page
 * and reads as noise beside the real component entries; the page is the artifact,
 * and `Manifesto` is its one sidebar row. The tag sits on each story rather than
 * on the meta on purpose — meta tags propagate to the attached docs entry, which
 * would hide the page this whole file exists to render.
 *
 * Every specimen reads `src/theme/levels.ts` at render time — see
 * `./manifesto/specimens.tsx`.
 */
const meta = {
  title: 'Manifesto',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/*
 * `tags: ['!dev']` is repeated literally on every story rather than spread from
 * a shared constant. The static indexer reads these tags by parsing the file, so
 * a spread it cannot resolve indexes as no tags at all — which showed up as all
 * eleven fragments appearing in the sidebar.
 */
export const Facts: Story = { tags: ['!dev'], render: () => <SystemFacts /> };
export const Levels: Story = { tags: ['!dev'], render: () => <LevelDiptych /> };
export const Roles: Story = { tags: ['!dev'], render: () => <RoleLookup /> };
export const Hues: Story = { tags: ['!dev'], render: () => <HueLadder /> };
export const Contrast: Story = { tags: ['!dev'], render: () => <ContrastGate /> };
export const Surfaces: Story = { tags: ['!dev'], render: () => <SurfaceRamp /> };
export const Form: Story = { tags: ['!dev'], render: () => <FormSpecimen /> };
export const Type: Story = { tags: ['!dev'], render: () => <TypeSpecimen /> };
export const Media: Story = { tags: ['!dev'], render: () => <MediumTable /> };
export const Ansi: Story = { tags: ['!dev'], render: () => <AnsiTarget /> };
export const Voice: Story = { tags: ['!dev'], render: () => <VoiceSpecimen /> };
export const Graphic: Story = { tags: ['!dev'], render: () => <GraphicTarget /> };
export const Motion: Story = { tags: ['!dev'], render: () => <MotionSpecimen /> };
export const Usage: Story = { tags: ['!dev'], render: () => <UsageTabs /> };
