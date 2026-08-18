/**
 * Hub paradigm — the aggregation台 renderer. Domain-agnostic: it takes the
 * enabled `WorkflowModule[]` and renders the canonical Hub structure, so the
 * shape is enforced by the component (not re-assembled per project):
 *   - per-workflow stat rows (line-free StatStrip)
 *   - a workflow-scope filter + quick-actions menu in the scene toolbar
 *   - a UNIFIED to-do list rendered as `EntityRow` (never cards — Hub 铁律:
 *     to-dos are rows with a `cta`, card = 去看 / row = 去做)
 *   - named highlight blocks (each a Section with the module-supplied body)
 *
 * A host writes `() => WorkflowModule` contributors and passes the resolved
 * modules; it cannot deviate from the Hub layout.
 */
"use client";

import { useState } from "react";
import type { DashAttention, WorkflowModule } from "../contracts/dashboard.js";
import type { RowModel } from "../contracts/row-model.js";
import { EntityRow } from "./entity-row.js";
import { EmptyState, Section, Stat, StatStrip } from "./primitives.js";
import { Scene } from "./scene.js";

function attentionToRow(item: DashAttention, showWorkflow: boolean): RowModel {
  return {
    href: item.href,
    cta: item.cta,
    leading: (
      <span className={`wb-dot wb-emph--${item.tone}`} style={{ width: 9, height: 9, background: "var(--emph)" }} />
    ),
    title: showWorkflow ? (
      <>
        {item.title} <span className="wb-tag">{item.workflow}</span>
      </>
    ) : (
      item.title
    ),
    note: item.detail,
  };
}

export function Hub({
  modules,
}: {
  readonly modules: readonly WorkflowModule[];
}): React.ReactElement {
  const [active, setActive] = useState<string>("all");

  // The stat strip always shows every workflow: it is the overview, and losing
  // half of it while filtering is what the filter is meant to avoid. Only the
  // content below narrows.
  const visible = active === "all" ? modules : modules.filter((m) => m.key === active);
  const attention = visible.flatMap((m) => m.attention);
  const highlights = visible.flatMap((m) => m.highlights.map((h) => ({ h, accent: m.accent })));
  const showTag = active === "all" && new Set(attention.map((a) => a.workflow)).size > 1;

  return (
    <Scene
      stats={
        <div className="wb-statrows">
          {modules.map((m) => (
            <div className="wb-statrow" key={m.key}>
              <button
                type="button"
                // Neutral, not the workflow's own colour: `--emph` is a fill
                // palette and fails text contrast at this size for four of its
                // six tones. The colour identity moves to the dot beside it,
                // which is what a fill colour is for, and the selected state is
                // a pill rather than a lightness step.
                className={`wb-statrow__label${
                  active === m.key ? " wb-statrow__label--on" : ""
                }`}
                aria-pressed={active === m.key}
                // Selecting the active one again clears the filter, so the
                // control that narrows is also the one that restores.
                onClick={() => setActive((a) => (a === m.key ? "all" : m.key))}
              >
                <span className={`wb-statrow__dot wb-emph--${m.accent}`} aria-hidden="true" />
                {m.label}
              </button>
              <StatStrip>
                {m.stats.map((s) => (
                  <Stat
                    key={s.label}
                    label={s.label}
                    value={s.value}
                    {...(s.unit !== undefined ? { unit: s.unit } : {})}
                    {...(s.foot !== undefined ? { foot: s.foot } : {})}
                  />
                ))}
              </StatStrip>
            </div>
          ))}
        </div>
      }
    >
      <div className="wb-stack wb-stack--lg">
        <Section title="待办事项">
          {attention.length === 0 ? (
            <EmptyState title="暂无待办" />
          ) : (
            <div className="wb-list wb-list--framed">
              {attention.map((item) => (
                <EntityRow key={item.id} model={attentionToRow(item, showTag)} />
              ))}
            </div>
          )}
        </Section>

        {highlights.map(({ h, accent }) => (
          <Section key={h.title} title={h.title} {...(h.link ? { link: h.link } : {})}>
            <div className={`wb-hl wb-emph--${accent}`}>{h.body}</div>
          </Section>
        ))}
      </div>
    </Scene>
  );
}
