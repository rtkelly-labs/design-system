import type { Meta, StoryObj } from '@storybook/react-vite';
import { ColophonCard } from '../components/ColophonCard';

const meta: Meta<typeof ColophonCard> = {
  title: 'Blog/ColophonCard',
  component: ColophonCard,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof ColophonCard>;

export const Default: Story = {
  args: {
    authorName: 'RYAN KELLY',
    authorRole: 'STAFF ENGINEER // DISTRIBUTED SYSTEMS & TOOLING',
    bio: 'I build high-throughput data engines, compiler extensions, and retro-brutalist developer tooling. Author of Parquet.SourceGenerator, Parquet.TypeProvider, and Resultful.',
    sectionMarker: '§',
    links: [
      { label: 'GITHUB', href: 'https://github.com/rtkelly13', icon: 'code' },
      { label: 'BLOG', href: 'https://ryankelly.dev', icon: 'globe' },
      { label: 'SHARE', href: 'https://twitter.com', icon: 'share' },
      { label: 'RSS FEED', href: '/feed.xml', icon: 'rss' },
    ],
  },
};
