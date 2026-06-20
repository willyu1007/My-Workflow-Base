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
import type { DashAttention, WorkflowModule } from "../contracts/dashboard";
import type { RowModel } from "../contracts/row-model";
import { EntityRow } from "./entity-row";
import { IconCheck, IconChevronDown, IconMore } from "./icons";
import { Menu } from "./menu";
import { Link } from "./nav";
import { EmptyState, Section, Stat, StatStrip } from "./primitives";
import { Scene } from "./scene";

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

  const visible = active === "all" ? modules : modules.filter((m) => m.key === active);
  const quickActions = modules.flatMap((m) => m.quickActions);
  const attention = visible.flatMap((m) => m.attention);
  const highlights = visible.flatMap((m) => m.highlights.map((h) => ({ h, accent: m.accent })));
  const showTag = active === "all" && new Set(attention.map((a) => a.workflow)).size > 1;

  const scopes = [{ key: "all", label: "全部" }, ...modules.map((m) => ({ key: m.key, label: m.label }))];
  const activeLabel = scopes.find((s) => s.key === active)?.label ?? "全部";

  // Scope filter (left) + quick-actions (right) live in the scene toolbar, never the topbar.
  const scopeFilter =
    modules.length > 1 ? (
      <Menu
        label="按工作流筛选"
        align="start"
        trigger={
          <>
            {activeLabel}
            <IconChevronDown size={14} style={{ color: "var(--mt-stone)" }} />
          </>
        }
      >
        {scopes.map((s) => (
          <button
            key={s.key}
            type="button"
            className="mt-menu-item"
            role="menuitem"
            aria-current={active === s.key ? "true" : undefined}
            onClick={() => setActive(s.key)}
          >
            <span className="wb-spacer">{s.label}</span>
            {active === s.key && <IconCheck size={14} style={{ color: "var(--mt-orange-700)" }} />}
          </button>
        ))}
      </Menu>
    ) : null;

  const quickMenu =
    quickActions.length > 0 ? (
      <Menu label="快捷入口" align="start" trigger={<IconMore size={18} />}>
        <p className="wb-menu-label">快捷入口</p>
        {quickActions.map((l) => (
          <Link key={l.href} href={l.href} className="mt-menu-item mt-menu-item--indent" role="menuitem">
            {l.label}
          </Link>
        ))}
      </Menu>
    ) : null;

  return (
    <Scene
      filters={scopeFilter}
      actions={quickMenu}
      stats={
        <div className="wb-statrows">
          {visible.map((m) => (
            <div className="wb-statrow" key={m.key}>
              <span className={`wb-statrow__label wb-emph--${m.accent}`}>{m.label}</span>
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
