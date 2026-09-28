import type { Meta, StoryObj } from '@storybook/react-vite';
import { SocialIcon, type SocialIconName } from '../components/SocialIcon';
import { ThemeProvider } from '../components/ThemeProvider';

const meta: Meta<typeof SocialIcon> = {
  title: 'Components/Icons/SocialIcon',
  component: SocialIcon,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof SocialIcon>;

const names: SocialIconName[] = ['github', 'linkedin', 'bluesky', 'x', 'mail'];

export const BrandMarks: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-5 border-2 border-edge-strong bg-surface-raised p-8">
      {names.map((name) => (
        <SocialIcon key={name} name={name} label={name === 'mail' ? 'Email' : name} accent="primary" />
      ))}
    </div>
  ),
};

export const ExternalLinks: Story = {
  render: () => (
    <nav aria-label="Social links" className="flex flex-wrap items-center gap-4 border-2 border-edge-strong bg-surface-raised p-8">
      <SocialIcon name="github" href="https://github.com/rtkelly13" target="_blank" label="GitHub" />
      <SocialIcon name="linkedin" href="https://www.linkedin.com/in/ryankelly13" target="_blank" label="LinkedIn" accent="secondary" />
      <SocialIcon name="bluesky" href="https://bsky.app" target="_blank" label="Bluesky" accent="tertiary" />
      <SocialIcon name="x" href="https://x.com" target="_blank" label="X" accent="quiet" />
      <SocialIcon name="mail" href="mailto:hello@ryankelly.dev" label="Email" accent="info" />
    </nav>
  ),
};

export const SketchTheme: Story = {
  render: () => (
    <ThemeProvider defaultLevel="sketch" scoped persist={false} followSystem={false}>
      <div className="flex flex-wrap items-center gap-5 border-2 border-edge-strong bg-surface-raised p-8">
        {names.map((name) => (
          <SocialIcon key={name} name={name} label={name === 'mail' ? 'Email' : name} accent="primary" />
        ))}
      </div>
    </ThemeProvider>
  ),
};
