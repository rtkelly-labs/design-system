import type { ComponentPageDef } from '../types';

export const input: ComponentPageDef = {
  slug: 'input',
  name: 'Input',
  lede:
    'Text fields and the form parts around them. `Input`, `TextArea` and `Select` share one contract (`label`, `error`, `helperText`, `accent`) and one field frame. The frame wires the label, the message and the ARIA for you.',
  props: ['Input', 'TextArea', 'Select'],
  keywords: 'form field text textarea select validation error helper label checkbox switch radio fieldset errorsummary',
  examples: [
    {
      id: 'basic',
      title: 'Basic usage',
      description:
        'Give the field a `label` and it links itself: without an `id` it generates one, so clicking the label focuses the control. Other props, such as `name`, `placeholder` and `autoComplete`, go to the `<input>`.',
      file: 'input/basic.tsx',
    },
    {
      id: 'helper-and-error',
      title: 'Helper text and errors',
      description:
        'One `error` prop does three things: it shows the message, sets `aria-invalid`, and draws the danger border. So an invalid field cannot look wrong while announcing nothing. `helperText` is linked through `aria-describedby`.',
      file: 'input/helper-and-error.tsx',
    },
    {
      id: 'textarea',
      title: 'Multi-line text',
      description:
        '`TextArea` is the same field for a longer answer. Here a live character count sits in `helperText`, and the field turns to an `error` once the text goes over the limit.',
      file: 'input/textarea.tsx',
    },
    {
      id: 'select-and-toggles',
      title: 'Choices and toggles',
      description:
        'Pick a control by the shape of the answer. `Select` is one of a fixed set. `RadioGroup` is one of a few you want visible at once. `Switch` takes effect immediately, and `Checkbox` is a yes or no that waits for submit. All of them use the same field frame as `Input`.',
      file: 'input/select-and-toggles.tsx',
      wide: true,
    },
    {
      id: 'validated-form',
      title: 'A validated form',
      description:
        'Validate on submit and report two ways: on each field, and in an `ErrorSummary` at the top. The summary takes focus and links to each field. The form is `noValidate`, because the browser\'s own required-field bubbles would block the submit before the summary could report. Submit it empty to see the result.',
      file: 'input/validated-form.tsx',
      wide: true,
    },
  ],
  accessibility: {
    notes: [
      'The label is a real `<label>` tied to the control, not a placeholder. A placeholder disappears as soon as someone types, and many screen readers never read it.',
      'Errors are set through `aria-invalid` and `aria-describedby` by the field frame, which is the same Base UI `Field` for every control. Pass `error` and do nothing else.',
      '`ErrorSummary` moves focus to itself when it appears, and each item links to its field with `#id`. Give every validated field an explicit `id` so the link has somewhere to go.',
      'The focus accent is a border change, which disappears under forced colours. So the field keeps the global `:focus-visible` outline instead of removing it.',
    ],
    keyboard: [
      ['Tab', 'Moves between fields, in DOM order.'],
      ['Space', 'Toggles a Checkbox or Switch.'],
      ['↑ / ↓', 'Moves the selection within a RadioGroup, or through an open Select list.'],
      ['Enter', 'Submits the form from a text field, or chooses the highlighted Select option.'],
      ['Esc', 'Closes an open Select list without changing the value.'],
    ],
  },
};
