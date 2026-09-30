import type { Meta, StoryObj } from '@storybook/react-vite';
import { MetadataGrid } from '../components/MetadataGrid';

const meta: Meta<typeof MetadataGrid> = {
  title: 'Blog/MetadataGrid',
  component: MetadataGrid,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof MetadataGrid>;

export const Default: Story = {
  args: {
    published: 'SEPTEMBER 16, 2026',
    readTime: '14 MIN READ',
    series: {
      name: 'DISTRIBUTED SYSTEMS // MINI-KAFKA',
      part: 2,
      totalParts: 4,
      href: '#',
    },
    tags: ['storage-engine', 'raft', 'rust', 'concurrency'],
  },
};

export const Standalone: Story = {
  args: {
    published: 'AUGUST 11, 2026',
    readTime: '6 MIN READ',
    tags: ['css', 'design-systems'],
  },
};

export const CustomColumns: Story = {
  args: {
    items: [
      { label: 'CLASSIFICATION', value: 'INTERNAL // SPEC' },
      { label: 'TARGET', value: 'PRODUCTION CLUSTER' },
      { label: 'OPERATOR', value: 'SYSTEMS ARCHITECTURE' },
      { label: 'STATUS', value: 'ACTIVE RUNTIME', href: '#' },
    ],
  },
};
