/**
 * Record paradigm — "see one object whole, act on it". Structure is
 * component-locked: a `Scene` (intro + primary action top-right) hosting
 * required `Tabs` (facets), with sub-actions in a right-side `Drawer` (never a
 * page jump). A host supplies the intro, the action, the tab contents, and the
 * drawer body; it cannot deviate from intro + tabs + top-right action + drawer.
 */
"use client";

import type { ReactNode } from "react";
import { Drawer } from "./overlay";
import { Scene } from "./scene";
import { Tabs, type TabItem } from "./tabs";

export interface RecordDrawer {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly desc?: string;
  readonly footer?: ReactNode;
  readonly children: ReactNode;
}

export function Record({
  intro,
  actions,
  tabs,
  initialTab,
  drawer,
}: {
  readonly intro?: ReactNode;
  /** Primary action — Scene pins it top-right. */
  readonly actions?: ReactNode;
  /** Facets (required — a Record is always tabbed). */
  readonly tabs: readonly TabItem[];
  readonly initialTab?: string;
  /** Sub-action panel; always a Drawer, never a page jump. */
  readonly drawer?: RecordDrawer;
}): React.ReactElement {
  return (
    <Scene {...(intro ? { intro } : {})} {...(actions ? { actions } : {})}>
      <Tabs items={tabs} {...(initialTab ? { initialKey: initialTab } : {})} />
      {drawer && (
        <Drawer
          open={drawer.open}
          onClose={drawer.onClose}
          title={drawer.title}
          {...(drawer.desc ? { desc: drawer.desc } : {})}
          {...(drawer.footer ? { footer: drawer.footer } : {})}
        >
          {drawer.children}
        </Drawer>
      )}
    </Scene>
  );
}
