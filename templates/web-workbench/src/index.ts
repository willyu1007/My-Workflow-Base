/**
 * @willyu1007/web-workbench — scenario-agnostic web workbench UI kit.
 *
 * Contracts (types) + presentational components for the Scene paradigms
 * (Hub / List / Queue / Record / Insight / Form). A host scenario writes
 * adapters that map its own view-models → these contracts; the components
 * render them and carry no domain vocabulary.
 *
 * Import styles once at the app root:  import "@willyu1007/web-workbench/styles";
 */

// ---- Contracts ----
export * from "./contracts/card-model.js";
export * from "./contracts/row-model.js";
export * from "./contracts/table-model.js";
export * from "./contracts/insight-model.js";
export * from "./contracts/dashboard.js";
export * from "./contracts/shell-nav.js";

// ---- Framework adapter (the one Next.js touchpoint) ----
export * from "./components/nav.js";

// ---- Primitives & chrome ----
export * from "./components/icons.js";
export * from "./components/primitives.js";
export * from "./components/scene.js";
export * from "./components/scene-skeleton.js";
export * from "./components/action-button.js";
export * from "./components/menu.js";
export * from "./components/select.js";
export * from "./components/date-button.js";
export * from "./components/expandable-text-field.js";
export * from "./components/tabs.js";
export * from "./components/badge.js";

// ---- App shell (Batch 2) — one ShellNav drives sidebar + topbar breadcrumb ----
export * from "./components/scenario-switcher.js";
export * from "./components/breadcrumb.js";
export * from "./components/account-menu.js";
export * from "./components/sidebar-create.js";
export * from "./components/sidebar.js";
export * from "./components/app-shell.js";

// ---- Toast (Batch 3) — host notification chrome (ToastProvider + useToast) ----
export * from "./components/toast.js";

// ---- Field schema shared by Settings and Form ----
export * from "./contracts/field.js";

// ---- Settings paradigm — locked SettingsFrame + section nav + save bar ----
export * from "./contracts/settings.js";
export * from "./components/settings.js";

// ---- Form paradigm — create/edit one object; validate → submit → toast ----
export * from "./contracts/form.js";
export * from "./components/form.js";

// ---- List paradigm presentations ----
export * from "./components/entity-card.js";
export * from "./components/entity-row.js";
export * from "./components/entity-table.js";
export * from "./components/table-cells.js";
export * from "./components/list-view.js";

// ---- Insight paradigm ----
export * from "./components/insight-card.js";

// ---- Queue paradigm (rows + action button + Drawer; structure component-locked) ----
export * from "./components/overlay.js";
export * from "./components/queue.js";

// ---- Record paradigm (intro + tabs + top-right action + drawer; locked) ----
export * from "./components/record.js";

// ---- Hub paradigm (aggregation台 renderer; structure is component-locked) ----
export * from "./components/hub.js";
