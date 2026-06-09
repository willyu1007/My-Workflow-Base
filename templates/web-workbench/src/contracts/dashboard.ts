/**
 * Dashboard (Hub) contribution contract. The Hub is an aggregation engine: each
 * workflow contributes stats / attention / a highlight section / quick actions,
 * and the dashboard composes them. Adding a workflow = adding a module; swapping
 * the scenario = swapping the module set — the Hub engine is unchanged.
 */
import type { ReactNode } from "react";
import type { CardTone } from "./card-model";

/** A to-do surfaced on the Hub; `tone` drives its dot color. */
export interface AttentionItem {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly tone: "accent" | "warning" | "info";
  readonly href: string;
  readonly cta: string;
}

export interface DashStat {
  readonly label: string;
  readonly value: ReactNode;
  readonly unit?: string;
  readonly foot?: ReactNode;
}

/** A to-do contributed by a workflow; `workflow` tags it in the unified list. */
export type DashAttention = AttentionItem & { readonly workflow: string };

export interface DashQuickAction {
  readonly href: string;
  readonly label: string;
  readonly icon: ReactNode;
}

export interface DashHighlight {
  readonly title: string;
  readonly link?: { readonly href: string; readonly label: string };
  readonly body: ReactNode;
}

export interface WorkflowModule {
  readonly key: string;
  readonly label: string;
  /** Workflow's main color (palette tone) — used on its stat-row label + highlight arc. */
  readonly accent: CardTone;
  readonly stats: readonly DashStat[];
  readonly attention: readonly DashAttention[];
  /** Named "ongoing / follow-up" blocks this workflow drops into the Hub region (0..N). */
  readonly highlights: readonly DashHighlight[];
  readonly quickActions: readonly DashQuickAction[];
}
