import { forwardRef } from 'react';
import type { ForwardedRef, HTMLAttributes, ReactElement, ReactNode, RefAttributes } from 'react';
import { recipe } from '../lib/recipe';
import { NoteBlock } from './NoteBlock';
import { Skeleton } from './Skeleton';

/** Which of the four states a `ResourceState` is showing. */
export type ResourceStatus = 'loading' | 'failed' | 'stale' | 'ready';

/**
 * What `ResourceState` reads. `usePolledResource`'s result fits as it is; so
 * does any `{ data, error }` from another loader.
 */
export interface ResourceStateValue<T> {
  /** The last good answer, or `undefined` before there is one. */
  data: T | undefined;
  /** Why the latest load failed, or `undefined` when it did not. */
  error: string | undefined;
  /** A load is in flight. Sets `aria-busy` on the region; absent reads as loading while there is no data. */
  loading?: boolean;
}

export interface ResourceStateProps<T> extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The resource to render — `usePolledResource`'s result, or any structurally compatible `{ data, error }`. */
  state: ResourceStateValue<T>;
  /** Renders the data once there is some. Called with the data, never with `undefined`. */
  children: (data: T) => ReactNode;
  /** Shown while there is no data and no error. Default one block `Skeleton`; pass the shape of the real content to keep the page still when it lands. */
  loading?: ReactNode;
  /** The warning title when the load failed and there is nothing to show. Default `Could not load`. */
  errorTitle?: string;
  /** The warning title above data kept from an earlier load after a later one failed. Default `Showing the last good data`. */
  staleTitle?: string;
}

/** Which state the region is in, from data first: data on screen is never hidden by a failure. */
function resourceStatus({ data, error }: Pick<ResourceStateValue<unknown>, 'data' | 'error'>): ResourceStatus {
  if (data === undefined) return error !== undefined ? 'failed' : 'loading';
  return error !== undefined ? 'stale' : 'ready';
}

const resourceState = recipe({
  slots: {
    root: 'block',
  },
});

function ResourceStateInner<T>(
  {
    state,
    children,
    loading,
    errorTitle = 'Could not load',
    staleTitle = 'Showing the last good data',
    className,
    ...props
  }: ResourceStateProps<T>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const status = resourceStatus(state);
  const busy = state.loading ?? status === 'loading';
  const styles = resourceState();
  let body: ReactNode;
  if (state.data === undefined) {
    body = state.error !== undefined ? (
      <NoteBlock type="warning" title={errorTitle}>
        {state.error}
      </NoteBlock>
    ) : (
      (loading ?? <Skeleton shape="block" />)
    );
  } else {
    body = (
      <>
        {state.error !== undefined ? (
          <NoteBlock type="important" title={staleTitle}>
            {state.error}
          </NoteBlock>
        ) : null}
        {children(state.data)}
      </>
    );
  }
  return (
    <div
      ref={ref}
      data-slot="resource-state"
      data-state={status}
      aria-busy={busy}
      {...props}
      className={styles.root({ class: className })}
    >
      {body}
    </div>
  );
}

/** `forwardRef` erases a generic; this restores it, so `children` is typed by `state`. */
type ResourceStateComponent = (<T>(props: ResourceStateProps<T> & RefAttributes<HTMLDivElement>) => ReactElement | null) & {
  displayName?: string;
};

/**
 * The loading, failed and stale states around a view of loaded data, so every
 * panel says them the same way.
 *
 * - **Loading** — no data yet and no error: the `loading` slot, a `Skeleton`
 *   unless overridden.
 * - **Failed** — no data and an error: a `NoteBlock` warning, in the danger
 *   role, carrying the error message under `errorTitle`.
 * - **Stale** — data from an earlier load, and a later load failed: a
 *   `NoteBlock` in the warning role, under `staleTitle`, then the data. The data
 *   stays because an older answer is more use than none, and the note stays
 *   because an older answer shown as current is a lie.
 * - **Ready** — data and no error: `children(data)`.
 *
 * The region carries `aria-busy` while a load is in flight and `data-state`
 * naming the state. Pair it with `usePolledResource`, and put a
 * `FreshnessIndicator` fed its `updatedAt` near the view, to say how old the
 * data on screen is as well as whether it is.
 */
export const ResourceState = forwardRef(ResourceStateInner) as ResourceStateComponent;

ResourceState.displayName = 'ResourceState';
