/**
 * Queue paradigm — "work a pile down, one by one". Structure is component-locked:
 *   - items render as `EntityRow` rows (never cards),
 *   - each row gets a trailing **action button** (去做),
 *   - the action opens a right-side `Drawer` (never a page jump).
 *
 * A host supplies the row data, the action label, and the drawer content; it
 * cannot deviate from the rows-with-action-in-a-drawer shape.
 */
"use client";

import { useState, type ReactNode } from "react";
import type { RowModel } from "../contracts/row-model";
import { EntityRow } from "./entity-row";
import { Drawer } from "./overlay";
import { EmptyState } from "./primitives";

export interface QueueDrawer {
  readonly title: string;
  readonly desc?: string;
  readonly body: ReactNode;
  readonly footer?: ReactNode;
}

export function Queue<T>({
  items,
  rowKey,
  toRow,
  actionLabel,
  drawer,
  empty,
}: {
  readonly items: readonly T[];
  readonly rowKey: (item: T) => string;
  /** Row data only — the Queue supplies the trailing action button itself. */
  readonly toRow: (item: T) => RowModel;
  /** Action button label, e.g. 批改 / 复核 / 审核. */
  readonly actionLabel: (item: T) => string;
  /** Drawer content for the acted-on item; `close` dismisses it. */
  readonly drawer: (item: T, close: () => void) => QueueDrawer;
  readonly empty: { readonly icon?: ReactNode; readonly title: string; readonly desc?: string };
}): React.ReactElement {
  const [selected, setSelected] = useState<T | null>(null);
  const close = (): void => setSelected(null);

  if (items.length === 0) {
    return (
      <EmptyState
        {...(empty.icon ? { icon: empty.icon } : {})}
        title={empty.title}
        {...(empty.desc ? { desc: empty.desc } : {})}
      />
    );
  }

  const d = selected ? drawer(selected, close) : null;

  return (
    <>
      <div className="wb-list wb-list--framed">
        {items.map((item) => (
          <EntityRow
            key={rowKey(item)}
            model={{
              ...toRow(item),
              trailing: (
                <button
                  type="button"
                  className="mt-btn mt-btn--secondary mt-btn--sm"
                  onClick={() => setSelected(item)}
                >
                  {actionLabel(item)}
                </button>
              ),
            }}
          />
        ))}
      </div>

      <Drawer
        open={selected !== null}
        onClose={close}
        title={d?.title ?? ""}
        {...(d?.desc ? { desc: d.desc } : {})}
        {...(d?.footer ? { footer: d.footer } : {})}
      >
        {d?.body}
      </Drawer>
    </>
  );
}
