import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/Button';
import { StatusPage } from '../components/StatusPage';
import { SitePage, portfolio } from './siteChrome/fixtures';

const meta: Meta<typeof StatusPage> = {
  title: 'Components/Feedback/StatusPage',
  component: StatusPage,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'The frame every page-level system state shares: `EmptyState` with its title promoted to the',
          "page's single `<h1>`, an optional status `code` above it, and `standalone` for a page served",
          'without the site chrome.',
          '',
          '**Which states are components and which are recipes.** `NotFoundPage` and `ServerErrorPage`',
          'are exported, because every site writes the same code, title, sentence and link home, and',
          'would otherwise retype them. Maintenance, offline and unauthorized are the recipes below —',
          'each is `StatusPage` with a few props, and the words (when it is back, what works offline,',
          'who to ask for access) are different on every product, so a preset would be one product\'s',
          'copy hoisted into defaults.',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    code: { control: 'text' },
    description: { control: false },
    action: { control: false },
    children: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof StatusPage>;

/**
 * **Maintenance** (recipe). Standalone, because maintenance is usually served
 * from the edge while the application is down, and `503` because that is the
 * status the response should carry. The description says when it will be
 * back; the action goes to a status page on other infrastructure rather than
 * home, which is the thing that is down.
 */
export const Maintenance: Story = {
  args: {
    standalone: true,
    id: 'main-content',
    code: '503',
    title: 'Down for maintenance',
    description: 'We are moving the database to new hardware. Everything is expected back by 09:00 UTC, and nothing you saved will be lost.',
    action: (
      <Button href="https://status.example.com" variant="primary" bracketed>
        STATUS PAGE
      </Button>
    ),
  },
  parameters: { docs: { story: { inline: false, height: '560px' } } },
};

/**
 * **Offline** (recipe). The page a service worker serves when the network is
 * gone, so it assumes no JavaScript and reads no connection state: a static
 * page that is true whenever it is shown. The glyph stands in for a code there
 * is not one of, and is `aria-hidden` so it is not read as a word. `TRY AGAIN`
 * is a link to the current address (`href=""`), which retries the original
 * request with no script at all.
 */
export const Offline: Story = {
  args: {
    standalone: true,
    id: 'main-content',
    code: <span aria-hidden="true">[ ~ ]</span>,
    title: 'You are offline',
    description: 'This page needs a connection and there is none. Pages you have already opened are still available.',
    action: (
      <Button href="" variant="primary" bracketed>
        TRY AGAIN
      </Button>
    ),
  },
  parameters: { docs: { story: { inline: false, height: '560px' } } },
};

/**
 * **Unauthorized** (recipe), inside the site chrome, because the rest of the
 * site is still the reader's to use. `401` for a reader who is not signed in;
 * the first action signs in and returns here, the second is for the reader who
 * is signed in and still lacks access. The copy names who grants access —
 * which is the part no default could know.
 */
export const Unauthorized: Story = {
  args: {
    code: '401',
    title: 'Sign in to continue',
    description: 'This page is for members of the team workspace. Sign in with your work account, or ask a workspace admin to invite you.',
    action: (
      <>
        <Button href="/login?next=/workspace" variant="primary" bracketed>
          SIGN IN
        </Button>
        <Button href="/request-access" variant="inverse">
          REQUEST ACCESS
        </Button>
      </>
    ),
  },
  render: (args) => (
    <SitePage site={portfolio}>
      <StatusPage {...args} />
    </SitePage>
  ),
};
