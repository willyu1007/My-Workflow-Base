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
export * from "./contracts/card-model";
export * from "./contracts/row-model";
export * from "./contracts/table-model";
export * from "./contracts/insight-model";
export * from "./contracts/dashboard";

// ---- Framework adapter (the one Next.js touchpoint) ----
export * from "./components/nav";

// ---- Primitives & chrome ----
export * from "./components/icons";
export * from "./components/primitives";
export * from "./components/scene";
export * from "./components/menu";
export * from "./components/topbar-slot";
export * from "./components/tabs";
export * from "./components/badge";

// ---- List paradigm presentations ----
export * from "./components/entity-card";
export * from "./components/entity-row";
export * from "./components/entity-table";
export * from "./components/table-cells";
export * from "./components/list-view";

// ---- Insight paradigm ----
export * from "./components/insight-card";
