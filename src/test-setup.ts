import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

/**
 * Testing Library registers its own `afterEach(cleanup)` only when Vitest runs
 * with `globals: true`. This project keeps globals off — tests import
 * `describe`/`it`/`expect` explicitly — so the unmount has to be wired up here.
 *
 * Without it, every `render()` leaves its tree in `document.body` and queries
 * start matching elements from earlier tests: `getByLabelText` throws "found
 * multiple elements", and a `queryBy*` asserting something is absent finds the
 * previous test's copy of it.
 */
afterEach(cleanup);
