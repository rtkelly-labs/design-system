import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/Button';
import { NotFoundPage } from '../components/StatusPage';
import { SitePage, blog, projectSite } from './siteChrome/fixtures';

const meta: Meta<typeof NotFoundPage> = {
  title: 'Components/Feedback/NotFoundPage',
  component: NotFoundPage,
  tags: ['autodocs', 'preview'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    action: { control: false },
    children: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof NotFoundPage>;

/**
 * **Inside the site chrome** — where a 404 is almost always served, because
 * the application is healthy and only the route is wrong. The page sits in the
 * consumer's own `<main>`, so the skip link still lands on it, the header and
 * footer still offer every other way on, and the page adds no landmark of its
 * own. Zero props: code, title, sentence and the link home are the defaults.
 */
export const InSiteChrome: Story = {
  render: (args) => (
    <SitePage site={blog}>
      <NotFoundPage {...args} />
    </SitePage>
  ),
};

/**
 * **Standalone** — the same page as the whole document, for a static
 * `404.html` a host serves before any application code runs. `standalone`
 * makes the page the `<main>` and paints the ground itself.
 */
export const Standalone: Story = {
  args: { standalone: true, id: 'main-content' },
  parameters: { docs: { story: { inline: false, height: '560px' } } },
};

/**
 * **A better way out than home.** A documentation site knows where a lost
 * reader was probably going, so the action is search and the docs index
 * rather than the root; the copy says what moved. The defaults are replaced
 * by the same props, not by a second component.
 */
export const WithSearch: Story = {
  render: (args) => (
    <SitePage site={projectSite}>
      <NotFoundPage
        {...args}
        description="This page is not in the current docs. Pages from before 0.9 moved when the components were filed into categories."
        action={
          <>
            <Button href="/search" variant="primary" bracketed>
              SEARCH THE DOCS
            </Button>
            <Button href="/docs" variant="inverse">
              DOCS INDEX
            </Button>
          </>
        }
      />
    </SitePage>
  ),
};
