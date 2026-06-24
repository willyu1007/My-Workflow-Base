/**
 * ShellNav — the one config a scenario supplies to drive the app shell
 * (Sidebar + topbar Breadcrumb). The shell carries no domain vocabulary; it
 * renders this data. Canonical model carried over from the host template,
 * extended with the scenario switcher identity.
 *
 * Breadcrumb model is fixed: `[scenario ⌄] › <active workflow/section> [› …detail]`.
 * The root is ALWAYS the scenario switcher; internal classifications (e.g. an
 * ERP "财务" module grouping) are NOT breadcrumb levels and have no field here.
 */
import type { ReactNode } from "react";
import type { CardTone } from "./card-model";

/** One registered My-Chat scenario for the topbar switcher. `mark` is the
    1-glyph square badge (e.g. "教"). */
export interface ScenarioRef {
  readonly key: string;
  readonly name: string;
  readonly mark: string;
}

/**
 * The account's registered scenarios + switch/register behavior. Host-injected:
 * the kit renders the switcher; routing + toast stay host-side via the callbacks.
 */
export interface ScenarioConfig {
  readonly current: string;
  readonly registered: readonly ScenarioRef[];
  readonly onSwitch: (key: string) => void;
  readonly onRegister?: () => void;
}

/** A breadcrumb segment. */
export interface Crumb {
  readonly label: string;
  readonly href?: string;
}

/** A primary sidebar navigation link. */
export interface NavItemDef {
  readonly href: string;
  readonly label: string;
  readonly icon?: ReactNode;
  /** Render as visible but unavailable, for planned workflow entries. */
  readonly soon?: boolean;
  /** Extra path prefixes that also mark this item active. */
  readonly match?: readonly string[];
  /** Key into the badges map for a count pill. */
  readonly badgeKey?: string;
  /** Optional workflow status — a small locked-size dot in the lead slot (hover
      shows `label`). `busy` renders the "agent 处理中" animated ellipsis. Omit for none. */
  readonly status?: { readonly tone: CardTone; readonly label: string; readonly busy?: boolean };
}

/**
 * A group-level affordance — by convention the workflow group carries the
 * 「添加工作流」action (register a new workflow + its initialization step).
 * `href` navigates; omit it and supply `onClick` to gate (e.g. a host toast).
 */
export interface NavGroupAddDef {
  readonly label: string;
  readonly href?: string;
  readonly onClick?: () => void;
}

export interface NavGroupDef {
  readonly label?: string;
  readonly showIcons?: boolean;
  readonly items: readonly NavItemDef[];
  readonly add?: NavGroupAddDef;
}

/** An entry in the sidebar 「新增」 create menu. */
export interface CreateItemDef {
  readonly href: string;
  readonly label: string;
  readonly soon?: boolean;
}

/** Route prefix → topbar breadcrumb section (for non-workflow routes). */
export interface SectionDef {
  readonly prefix: string;
  readonly label: string;
  readonly href: string;
}

export interface ShellNav {
  /** Topbar root — the always-present scenario switcher. */
  readonly scenario: ScenarioConfig;
  readonly groups: readonly NavGroupDef[];
  readonly create?: readonly CreateItemDef[];
  readonly sections: readonly SectionDef[];
  readonly home?: { readonly label: string; readonly href: string };
}

/**
 * Fixed default workflow-status set. Colors are locked to the tone palette;
 * labels are free — a scenario uses these or adds its own `{ tone, label }`.
 * `busy: true` renders the "agent 处理中" animated ellipsis instead of a solid dot.
 */
export const STATUS_PRESETS = {
  running: { tone: "success", label: "运行中" },
  processing: { tone: "info", label: "处理中", busy: true },
  paused: { tone: "warning", label: "暂停" },
  error: { tone: "danger", label: "异常" },
  idle: { tone: "muted", label: "未开始" },
} satisfies Record<string, { tone: CardTone; label: string; busy?: boolean }>;
