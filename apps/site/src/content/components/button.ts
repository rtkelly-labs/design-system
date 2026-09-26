import type { ComponentPageDef } from '../types';

export const button: ComponentPageDef = {
  slug: 'button',
  name: 'Button',
  lede:
    'A button, or a link that looks like one. Pass `href` and it renders an `<a>`; leave it out and it renders a `<button>`. The choice is about behaviour, not looks.',
  props: ['Button'],
  keywords: 'cta action submit link anchor href variant bracketed press',
  examples: [
    {
      id: 'variants',
      title: 'Variants',
      description:
        'Four filled accents. They are named for roles, not colours, so each one changes with the level: `primary` is cyan on midnight and ink-blue on sketch. `tertiary` is the default.',
      file: 'button/variants.tsx',
    },
    {
      id: 'sizes',
      title: 'Sizes',
      description:
        '`size` sets padding and type scale, not how important the button is. `md` is the default. `sm` still meets the 44px hit area on the web medium, so it is safe in dense table rows.',
      file: 'button/sizes.tsx',
    },
    {
      id: 'bracketed',
      title: 'Bracketed',
      description:
        '`bracketed` wraps the label in `[ ]`, the house cue for "this one does something". Use it on a form\'s submit or a destructive confirm. On a whole toolbar it is just noise. The brackets are `aria-hidden`, so a screen reader hears only the label.',
      file: 'button/bracketed.tsx',
    },
    {
      id: 'as-link',
      title: 'As a link',
      description:
        'Anything that navigates must be an anchor. Otherwise it loses middle-click, open-in-new-tab and its announcement as a link. With `href` set, TypeScript accepts anchor attributes (`target`, `rel`, `download`) and rejects `disabled` and `type`, which do nothing on an `<a>`.',
      file: 'button/as-link.tsx',
    },
    {
      id: 'with-icon',
      title: 'With an icon',
      description:
        'Children sit in a flex row with a gap, so an icon needs no wrapper. Mark the icon `aria-hidden`. An icon-only button has no text, so it needs an `aria-label`.',
      file: 'button/with-icon.tsx',
    },
    {
      id: 'pending',
      title: 'Pending state',
      description:
        'The label says what happens: `PUBLISH`, then `PUBLISHING`, then `PUBLISHED`. While the work runs, `disabled` stops a second press, and a `Spinner` with a `label` gives assistive technology something to read.',
      file: 'button/pending.tsx',
    },
  ],
  accessibility: {
    notes: [
      'Write labels in capitals at the call site, not with `text-transform`. A screen reader then gets the words, not the shouting, and an acronym that is already in capitals does not read as emphasis.',
      'The press effect (the offset shadow folding into the button) is decoration. Focus is shown by the global `:focus-visible` outline, which also shows under forced colours.',
      'Colour carries no meaning here. A destructive button uses `tertiary` for emphasis, and its label still has to say what it destroys.',
      'The ref goes to whichever element is rendered, so `<Tooltip>` and other Base UI compositions can position against it and return focus to it.',
    ],
    keyboard: [
      ['Tab', 'Moves focus to the button or link.'],
      ['Enter', 'Activates a button, or follows a link.'],
      ['Space', 'Activates a button. On a link it scrolls the page, as a link should.'],
    ],
  },
};
