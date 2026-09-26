import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/Button';
import { ServerErrorPage } from '../components/StatusPage';
import { SitePage, marketing } from './siteChrome/fixtures';

const meta: Meta<typeof ServerErrorPage> = {
  title: 'Components/Feedback/ServerErrorPage',
  component: ServerErrorPage,
  tags: ['autodocs', 'preview'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    action: { control: false },
    children: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof ServerErrorPage>;

/**
 * **Standalone**, the form a 500 most needs: served because the application
 * failed, possibly while rendering the very header and footer that would have
 * framed it. That is why it is the default: the page is the `<main>` and paints
 * its own ground, so it depends on nothing but the stylesheet.
 */
export const Standalone: Story = {
  args: { id: 'main-content' },
  parameters: { docs: { story: { inline: false, height: '560px' } } },
};

/**
 * **Inside the site chrome**, for an error the shell survived — a data fetch
 * that failed under a route that otherwise rendered. The reader keeps the
 * navigation, so the page itself needs only the one link.
 */
export const InSiteChrome: Story = {
  render: (args) => (
    <SitePage site={marketing}>
      <ServerErrorPage {...args} standalone={false} />
    </SitePage>
  ),
};

/**
 * **With a reference to quote.** A request id in `children`, set in mono so it
 * can be read out over the phone, and a second action to the status page. A
 * `TRY AGAIN` link to the current address (`href=""`) retries without any
 * JavaScript, which is the point on a page served when the app has failed.
 */
export const WithReference: Story = {
  args: {
    id: 'main-content',
    action: (
      <>
        <Button href="" variant="primary" bracketed>
          TRY AGAIN
        </Button>
        <Button href="https://status.example.com" variant="inverse">
          STATUS PAGE
        </Button>
      </>
    ),
    children: (
      <p className="font-mono text-xs uppercase tracking-wider text-content-muted">
        &gt; reference: req_7f3a9c21
      </p>
    ),
  },
  parameters: { docs: { story: { inline: false, height: '600px' } } },
};
