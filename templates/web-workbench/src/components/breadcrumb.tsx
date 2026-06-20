/**
 * Breadcrumb — the single, locked implementation of the topbar trail.
 *
 * Model: `[scenario ⌄] › <active workflow/section> [› …page detail]`.
 *  - Root is ALWAYS the ScenarioSwitcher (muted "path" tier).
 *  - A separator sits between EVERY adjacent element, including root↔first.
 *  - Ancestors are muted links (`--link`); the last crumb is the bold anchor.
 *
 * `BreadcrumbProvider` + `SetBreadcrumb` let a page append crumbs beyond the
 * route-derived ones (e.g. a record name on a detail page). AppShell composes
 * the route-derived trail and renders <TopbarBreadcrumb>.
 *
 * NB: distinct from the in-page `Breadcrumb` primitive (`wb-breadcrumb`); this is
 * the global topbar trail (`wb-topbar__crumbs`) whose root is the scenario switcher.
 */
"use client";

import {
  createContext,
  Fragment,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Crumb, ScenarioConfig } from "../contracts/shell-nav";
import { IconChevronRight } from "./icons";
import { Link } from "./nav";
import { ScenarioSwitcher } from "./scenario-switcher";

interface BreadcrumbCtx {
  readonly trail: readonly Crumb[];
  readonly setTrail: (t: readonly Crumb[]) => void;
}

const Ctx = createContext<BreadcrumbCtx | null>(null);

export function BreadcrumbProvider({
  children,
}: {
  readonly children: ReactNode;
}): React.ReactElement {
  const [trail, setTrail] = useState<readonly Crumb[]>([]);
  return <Ctx.Provider value={{ trail, setTrail }}>{children}</Ctx.Provider>;
}

/** The page-supplied trail (segments beyond the route-derived ones). */
export function useBreadcrumbTrail(): readonly Crumb[] {
  return useContext(Ctx)?.trail ?? [];
}

/**
 * Pages render this (renders nothing) to append crumbs beyond the route-derived
 * section — e.g. a record name on a detail page. Clears on unmount.
 */
export function SetBreadcrumb({ items }: { readonly items: readonly Crumb[] }): null {
  const ctx = useContext(Ctx);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const key = items.map((i) => `${i.label}|${i.href ?? ""}`).join(">");
  useEffect(() => {
    ctx?.setTrail(itemsRef.current);
    return () => ctx?.setTrail([]);
  }, [ctx, key]);
  return null;
}

/** The rendered topbar breadcrumb: scenario switcher (root) + the trail. */
export function TopbarBreadcrumb({
  scenario,
  trail,
}: {
  readonly scenario: ScenarioConfig;
  readonly trail: readonly Crumb[];
}): React.ReactElement {
  return (
    <div className="wb-topbar__crumbs">
      <ScenarioSwitcher scenario={scenario} />
      {trail.map((item, i) => {
        const isLast = i === trail.length - 1;
        return (
          <Fragment key={`${item.label}-${i}`}>
            <span className="wb-topbar__sep" aria-hidden="true">
              <IconChevronRight size={13} />
            </span>
            {item.href && !isLast ? (
              <Link href={item.href} className="wb-topbar__crumb wb-topbar__crumb--link">
                {item.label}
              </Link>
            ) : (
              <span className="wb-topbar__crumb" aria-current={isLast ? "page" : undefined}>
                {item.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
