import type { Meta, StoryObj } from '@storybook/react-vite';
import { TrackCard } from '../components/TrackCard';

const meta: Meta<typeof TrackCard> = {
  title: 'Blog/TrackCard',
  component: TrackCard,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof TrackCard>;

/**
 * Default multi-part learning curriculum card displaying mixed progress states and upcoming milestones.
 */
export const Default: Story = {
  args: {
    trackNumber: '01',
    title: 'DISTRIBUTED LOG ARCHITECTURES',
    description:
      'Learn how high-throughput storage engines commit write-ahead entries to raw disk pages with zero copy overhead and sub-millisecond tail latency.',
    items: [
      {
        id: '1',
        number: '01',
        title: 'Segment Allocation & Binary Header Layout',
        duration: '12 min',
        status: 'completed',
        href: '#',
        summary: 'Fixed-width header structures, 64-bit offsets, and CRC32 verification.',
      },
      {
        id: '2',
        number: '02',
        title: 'Memory Mapped Sparse Indices',
        duration: '18 min',
        status: 'current',
        href: '#',
        summary: 'Direct page table mapping and binary searching 8-byte entry indices.',
      },
      {
        id: '3',
        number: '03',
        title: 'Zero-Copy OS Transfers & Socket Splice',
        duration: '15 min',
        status: 'upcoming',
        summary: 'Bypassing user space buffers with sendfile and vmsplice.',
      },
      {
        id: '4',
        number: '04',
        title: 'Segment Roll-over & Active Compaction',
        duration: '22 min',
        status: 'upcoming',
        summary: 'Tombstone retention policies and safe atomic swapping.',
      },
    ],
  },
};

/**
 * Completed curriculum track showing full progress bar fill and verified completion indicators.
 */
export const AllCompleted: Story = {
  args: {
    trackNumber: '02',
    title: 'RAFT REPLICATION PROTOCOL',
    description:
      'Master leader election, log replication, and cluster membership reconfiguration.',
    items: [
      {
        id: '1',
        number: '01',
        title: 'Leader Election & Heartbeat Timers',
        duration: '10 min',
        status: 'completed',
        href: '#',
      },
      {
        id: '2',
        number: '02',
        title: 'Log Replication & Safety Invariants',
        duration: '14 min',
        status: 'completed',
        href: '#',
      },
    ],
  },
};

/**
 * Series track at inception with no started milestones.
 */
export const NotStarted: Story = {
  args: {
    trackNumber: '03',
    title: 'LSM STORAGE ENGINES',
    description:
      'Building disk-backed SSTables, memtables, and Bloom filter lookups.',
    items: [
      {
        id: '1',
        number: '01',
        title: 'Memtable SkipList Architecture',
        duration: '20 min',
        status: 'upcoming',
      },
      {
        id: '2',
        number: '02',
        title: 'SSTable Block Builders & Compression',
        duration: '25 min',
        status: 'upcoming',
      },
    ],
  },
};
