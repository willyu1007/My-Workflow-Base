/**
 * Insight paradigm · card presentation (domain-agnostic).
 *
 * Renders an `InsightModel` (a scenario maps its own object → the model via an
 * adapter). Three bands separated by one hairline + whitespace: narrative
 * (eyebrow + headline + summary) → breakdown (Meters) → overview figures
 * (StatStrip). Tone is a signal, not decoration: figures default to ink, only
 * flagged metrics color (via the shared `wb-emph--*` token).
 */
import type { InsightModel } from "../contracts/insight-model";
import { Link } from "./nav";
import { Meter, Stat, StatStrip } from "./primitives";

export function InsightCard({ model }: { readonly model: InsightModel }): React.ReactElement {
  const hasEvidence = model.metrics.length > 0 || (model.bars != null && model.bars.length > 0);

  return (
    <article className="wb-quiet wb-insight">
      <div className="wb-insight__lede">
        {(model.link || model.timestamp) && (
          <div className="wb-insight__eyebrow">
            {model.link ? (
              <Link href={model.link.href} className="wb-insight__src">
                {model.link.label}
              </Link>
            ) : (
              <span />
            )}
            {model.timestamp && <span className="wb-insight__time">{model.timestamp}</span>}
          </div>
        )}
        <h3 className="wb-insight__headline">{model.headline}</h3>
        {model.summary && <p className="wb-insight__summary">{model.summary}</p>}
      </div>

      {hasEvidence && (
        <div className="wb-insight__evidence">
          {model.bars && model.bars.length > 0 && (
            <div className="wb-insight__bars">
              {model.barsLabel && (
                <p className="wb-nav__group-label" style={{ padding: 0, margin: 0 }}>
                  {model.barsLabel}
                </p>
              )}
              {model.bars.map((b) => (
                <Meter
                  key={b.label}
                  label={b.label}
                  value={b.value}
                  {...(b.display !== undefined ? { display: b.display } : {})}
                  {...(b.tone ? { tone: b.tone } : {})}
                  {...(b.max !== undefined ? { max: b.max } : {})}
                />
              ))}
            </div>
          )}

          {model.metrics.length > 0 && (
            <StatStrip compact>
              {model.metrics.map((m) => (
                <Stat
                  key={m.label}
                  label={m.label}
                  value={
                    m.tone ? (
                      <span className={`wb-emph--${m.tone}`} style={{ color: "var(--emph)" }}>
                        {m.value}
                      </span>
                    ) : (
                      m.value
                    )
                  }
                  {...(m.unit !== undefined ? { unit: m.unit } : {})}
                />
              ))}
            </StatStrip>
          )}
        </div>
      )}
    </article>
  );
}
