/**
 * Worked example: a host scenario's adapter from its own view-model → the kit's
 * `InsightModel`. This is the ONLY code a scenario writes to reuse `InsightCard`.
 *
 * The VM shape below is illustrative (education's "学情 report"); swap it for your
 * own. Note the governance in action: the adapter applies the scenario's tone
 * policy (color only "needs attention") so the component stays domain-free.
 */
import type { InsightModel } from "@workflow/web-workbench";

/** A host view-model (example). */
interface ReportVM {
  readonly id: string;
  readonly sourceId: string;
  readonly sourceTitle: string;
  readonly headline: string;
  readonly summary: string;
  readonly generatedAt: string; // already formatted by the host
  readonly metrics: readonly { label: string; value: number | string; unit?: string; flagged?: boolean }[];
  readonly breakdown: readonly { label: string; rate: number }[];
}

export function reportToInsight(r: ReportVM): InsightModel {
  return {
    link: { href: `/sources/${r.sourceId}`, label: r.sourceTitle },
    timestamp: r.generatedAt,
    headline: r.headline,
    summary: r.summary,
    metrics: r.metrics.map((m) => ({
      label: m.label,
      value: m.value,
      ...(m.unit !== undefined ? { unit: m.unit } : {}),
      // Tone policy lives in the adapter: color only flags attention.
      ...(m.flagged ? { tone: "warning" as const } : {}),
    })),
    ...(r.breakdown.length > 0
      ? {
          barsLabel: "主要失分点",
          // One category → one quiet tone; magnitude reads from bar length.
          bars: r.breakdown.map((b) => ({
            label: b.label,
            value: b.rate,
            display: `${b.rate}%`,
            tone: "warning" as const,
          })),
        }
      : {}),
  };
}
