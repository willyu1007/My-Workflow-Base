/**
 * InsightModel — the scenario-agnostic data contract for the Insight paradigm's
 * card presentation (an analytical readout: conclusion + evidence + breakdown).
 * Sibling to CardModel/RowModel/TableModel: a scenario maps its own object to
 * this shape via an adapter (e.g. `insightToCard`); the presentational
 * `InsightCard` renders the shape and carries no domain vocabulary. Types-only.
 */
import type { CardTone, MeterTone } from "./card-model";

/** A single headline figure in the metric grid. */
export interface InsightMetricCell {
  readonly label: string;
  readonly value: string | number;
  readonly unit?: string;
  /** Toned via the shared CardTone palette; omit for the default (navy) figure. */
  readonly tone?: CardTone;
}

/** A labelled distribution bar (e.g. a mistake/coverage rate). */
export interface InsightBar {
  readonly label: string;
  readonly value: number;
  readonly display?: string;
  readonly tone?: MeterTone;
  readonly max?: number;
}

export interface InsightModel {
  /** Source as an eyebrow above the headline (e.g. the assignment). Clickable. */
  readonly link?: { readonly href: string; readonly label: string };
  /** Timestamp value only (no prefix); right-aligned, demoted, in the eyebrow row. */
  readonly timestamp?: string;
  readonly headline: string;
  readonly summary?: string;
  readonly metrics: readonly InsightMetricCell[];
  /** Optional breakdown section rendered as Meters. */
  readonly bars?: readonly InsightBar[];
  readonly barsLabel?: string;
}
