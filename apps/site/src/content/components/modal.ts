import type { ComponentPageDef } from '../types';

export const modal: ComponentPageDef = {
  slug: 'modal',
  name: 'Modal',
  lede:
    'A modal dialog built on Base UI\'s `dialog`. While it is open the rest of the page is inert: focus is trapped, the background is hidden from assistive technology, and Escape closes only the top dialog.',
  props: ['Modal', 'AlertDialog'],
  keywords: 'dialog overlay popup confirm alertdialog focus trap escape backdrop scrim',
  examples: [
    {
      id: 'basic',
      title: 'Basic usage',
      description:
        'The modal is controlled: you keep the open state and pass `isOpen` and `onClose`. With no `footer` it renders a single `CLOSE` button. Escape, the × and a backdrop click all call `onClose`.',
      file: 'modal/basic.tsx',
    },
    {
      id: 'confirm',
      title: 'Confirming an action',
      description:
        '`footer` replaces the default close button with your own actions. Put the safe choice first. Here the confirm step shows a toast afterwards, from the same package.',
      file: 'modal/confirm.tsx',
    },
    {
      id: 'unsaved-input',
      title: 'Holding unsaved input',
      description:
        'With `closeOnBackdropClick={false}`, a stray click outside cannot discard what someone typed. Escape and the × still close it: they are deliberate, and taking them away would trap a keyboard user.',
      file: 'modal/unsaved-input.tsx',
    },
    {
      id: 'alert-dialog',
      title: 'Destructive confirmation',
      description:
        'For "are you sure", use `AlertDialog`, not a `Modal` with red buttons. It renders `role="alertdialog"`, never closes on a backdrop click, reads its body as the description, and has no ×, so the only way out is one of the two answers.',
      file: 'modal/alert-dialog.tsx',
    },
  ],
  accessibility: {
    notes: [
      'Focus goes to the dialog itself when it opens, not to its first button. A screen reader therefore announces the title first, rather than "Close dialog, button".',
      'The title is the dialog\'s accessible name through `aria-labelledby`, so give every modal a real `title`, even a short one.',
      'Dialogs stack. A `Menu` or `Select` opened inside a modal closes first on Escape, and a second modal opened from the first closes before it does.',
      'While it is open, every sibling of the portal gets `aria-hidden`. On close, focus returns to the control that opened it.',
      'The popup is portalled but keeps the level of the subtree that opened it, so a modal opened inside a scoped `sketch` panel is drawn in sketch.',
    ],
    keyboard: [
      ['Esc', 'Closes the topmost dialog and returns focus to its trigger.'],
      ['Tab', 'Moves focus forward within the dialog. It never leaves.'],
      ['Shift + Tab', 'Moves focus backward within the dialog.'],
    ],
  },
};
