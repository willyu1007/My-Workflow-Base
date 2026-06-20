/**
 * AppShell — the locked workbench shell: sidebar + topbar (scenario breadcrumb +
 * actions portal) + content. Driven by one ShellNav; carries no domain vocabulary.
 *
 * The topbar trail is derived here (active workflow/section from the route) and
 * appended with any page-supplied crumbs (SetBreadcrumb). The root is always the
 * scenario switcher; internal classifications are never crumbs.
 *
 * Toast is NOT wrapped here (it is host chrome until the kit owns it) — wrap
 * <AppShell> in your toast provider. Wire its callbacks (onSearch, scenario
 * onSwitch/onRegister, group add onClick, signOutHref) to your router/toast.
 */
"use client";

import { useState, type ReactNode } from "react";
import type { Crumb, ShellNav } from "../contracts/shell-nav";
import { BreadcrumbProvider, TopbarBreadcrumb, useBreadcrumbTrail } from "./breadcrumb";
import { IconMenu } from "./icons";
import { usePathname } from "./nav";
import { Sidebar } from "./sidebar";

function matchPrefix(pathname: string, prefix: string): boolean {
  if (prefix === "/") return pathname === "/";
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Route → the active workflow (groups) or section crumb. */
function activeCrumb(nav: ShellNav, pathname: string): Crumb | null {
  for (const group of nav.groups) {
    for (const item of group.items) {
      if (item.soon) continue;
      const matches = item.match ?? [item.href];
      if (matches.some((p) => matchPrefix(pathname, p))) {
        return { label: item.label, href: item.href };
      }
    }
  }
  const sec = nav.sections.find((s) => matchPrefix(pathname, s.prefix));
  return sec ? { label: sec.label, href: sec.href } : null;
}

function ShellCrumbs({ nav }: { readonly nav: ShellNav }): React.ReactElement {
  const pathname = usePathname();
  const trail = useBreadcrumbTrail();
  const active = activeCrumb(nav, pathname);
  const crumbs: readonly Crumb[] = [...(active ? [active] : []), ...trail];
  return <TopbarBreadcrumb scenario={nav.scenario} trail={crumbs} />;
}

export function AppShell({
  nav,
  accountName,
  badges = {},
  signOutHref,
  onSearch,
  children,
}: {
  readonly nav: ShellNav;
  readonly accountName: string;
  readonly badges?: Readonly<Record<string, number>>;
  readonly signOutHref?: string;
  readonly onSearch?: () => void;
  readonly children: ReactNode;
}): React.ReactElement {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <BreadcrumbProvider>
      <div className={`wb-shell${collapsed ? " wb-shell--collapsed" : ""}`}>
        <Sidebar
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onCollapse={() => setCollapsed(true)}
          nav={nav}
          badges={badges}
          accountName={accountName}
          {...(signOutHref ? { signOutHref } : {})}
          {...(onSearch ? { onSearch } : {})}
        />
        <div className="wb-main">
          <header className="wb-topbar">
            <button
              type="button"
              className="wb-burger"
              aria-label="打开导航"
              onClick={() => setDrawerOpen(true)}
            >
              <IconMenu size={20} />
            </button>
            {collapsed && (
              <button
                type="button"
                className="wb-expand"
                aria-label="展开侧栏"
                title="展开侧栏"
                onClick={() => setCollapsed(false)}
              >
                <IconMenu size={18} />
              </button>
            )}
            <ShellCrumbs nav={nav} />
            <div className="wb-topbar__spacer" />
          </header>
          <main className="wb-content">{children}</main>
        </div>
      </div>
    </BreadcrumbProvider>
  );
}
