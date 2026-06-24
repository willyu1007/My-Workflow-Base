/**
 * Sidebar — the locked workbench navigation. Driven entirely by ShellNav; every
 * auxiliary element (count / 待上线 / status badge · group label / 添加工作流 add /
 * 更多 overflow) is enumerated with fixed visuals + spacing. Projects toggle via
 * data — never restyle. Search is host-injected (`onSearch`) since toast/routing
 * stay host-side.
 */
"use client";

import { useEffect, useState } from "react";
import type { NavItemDef, ShellNav } from "../contracts/shell-nav";
import { AccountMenu, type AccountMenuItem } from "./account-menu";
import { IconChevronDown, IconHome, IconPlus, IconSearch, IconSidebar } from "./icons";

const COLLAPSE_KEY = "wb-nav-collapsed";

function loadCollapsedGroups(): ReadonlySet<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(COLLAPSE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveCollapsedGroups(keys: ReadonlySet<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...keys]));
  } catch {
    /* storage unavailable — collapse state is best-effort */
  }
}
import { Link, usePathname } from "./nav";
import { SidebarCreate } from "./sidebar-create";

function matchPrefix(pathname: string, prefix: string): boolean {
  if (prefix === "/") return pathname === "/";
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function Sidebar({
  open,
  onClose,
  onCollapse,
  nav,
  badges = {},
  accountName,
  accountMenuItems,
  signOutHref,
  onSearch,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onCollapse: () => void;
  readonly nav: ShellNav;
  readonly badges?: Readonly<Record<string, number>>;
  readonly accountName: string;
  readonly accountMenuItems?: readonly AccountMenuItem[];
  readonly signOutHref?: string;
  readonly onSearch?: () => void;
}): React.ReactElement {
  const pathname = usePathname();
  // Collapse state is loaded post-mount (SSR renders all expanded) to avoid a
  // hydration mismatch; persisted per user in localStorage.
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  useEffect(() => {
    const stored = loadCollapsedGroups();
    if (stored.size > 0) setCollapsed(stored);
  }, []);

  function toggleGroup(key: string): void {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      saveCollapsedGroups(next);
      return next;
    });
  }

  /** The fixed 18px lead slot: workflow status (dot / 处理中 ellipsis) takes
      precedence; else an icon only for icon groups; else an empty (aligned) slot. */
  function lead(item: NavItemDef, showIcons: boolean): React.ReactElement {
    if (item.status) {
      const { tone, label, busy } = item.status;
      return (
        <span className="wb-nav__icon">
          {busy ? (
            <span
              className={`wb-nav__statusproc wb-nav__statusproc--${tone}`}
              title={label}
              aria-label={label}
            >
              <i />
              <i />
              <i />
            </span>
          ) : (
            <span
              className={`wb-nav__statusdot wb-nav__statusdot--${tone}`}
              title={label}
              aria-label={label}
            />
          )}
        </span>
      );
    }
    return <span className="wb-nav__icon">{showIcons && item.icon ? item.icon : null}</span>;
  }

  function renderItem(item: NavItemDef, showIcons: boolean): React.ReactElement {
    const active = !item.soon && (item.match ?? [item.href]).some((p) => matchPrefix(pathname, p));
    const count = item.badgeKey ? (badges[item.badgeKey] ?? 0) : 0;

    if (item.soon) {
      return (
        <button key={item.href} type="button" className="wb-nav__item" aria-disabled="true" disabled>
          {lead(item, showIcons)}
          <span className="wb-nav__label">{item.label}</span>
          <span className="wb-nav__soon">待上线</span>
        </button>
      );
    }
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        className={`wb-nav__item${active ? " wb-nav__item--active" : ""}`}
        aria-current={active ? "page" : undefined}
      >
        {lead(item, showIcons)}
        <span className="wb-nav__label">{item.label}</span>
        {count > 0 && <span className="wb-nav__count">{count}</span>}
      </Link>
    );
  }

  return (
    <>
      {open && <div className="wb-sidebar__backdrop" onClick={onClose} aria-hidden="true" />}
      <aside className={`wb-sidebar${open ? " wb-sidebar--open" : ""}`}>
        <div className="wb-sidebar__top">
          <button
            type="button"
            className="wb-iconbtn"
            aria-label="搜索"
            title="搜索"
            onClick={() => onSearch?.()}
          >
            <IconSearch size={18} />
          </button>
          <button
            type="button"
            className="wb-iconbtn"
            aria-label="折叠侧栏"
            title="折叠侧栏"
            onClick={onCollapse}
          >
            <IconSidebar size={18} />
          </button>
        </div>

        <nav className="wb-nav">
          {(nav.home || (nav.create && nav.create.length > 0)) && (
            <div className="wb-nav__group">
              {nav.home && (
                <Link
                  href={nav.home.href}
                  onClick={onClose}
                  className={`wb-nav__item${matchPrefix(pathname, nav.home.href) ? " wb-nav__item--active" : ""}`}
                  aria-current={matchPrefix(pathname, nav.home.href) ? "page" : undefined}
                >
                  <span className="wb-nav__icon">
                    <IconHome />
                  </span>
                  <span className="wb-nav__label">{nav.home.label}</span>
                </Link>
              )}
              {nav.create && nav.create.length > 0 && (
                <SidebarCreate items={nav.create} onNavigate={onClose} />
              )}
            </div>
          )}

          {nav.groups.map((group, gi) => {
            const groupKey = group.label ?? `group-${gi}`;
            const add = group.add;
            const showIcons = group.showIcons ?? false;
            // Labeled groups collapse/expand from their header; the persisted
            // set tracks which are collapsed.
            const collapsible = Boolean(group.label);
            const isCollapsed = collapsible && collapsed.has(groupKey);
            return (
              <div
                key={groupKey}
                className={`wb-nav__group${isCollapsed ? " wb-nav__group--collapsed" : ""}`}
              >
                {(group.label || add) && (
                  <div className="wb-nav__grouphead">
                    {group.label &&
                      (collapsible ? (
                        <button
                          type="button"
                          className="wb-nav__group-label wb-nav__group-toggle"
                          aria-expanded={!isCollapsed}
                          onClick={() => toggleGroup(groupKey)}
                        >
                          <IconChevronDown size={12} className="wb-nav__group-caret" />
                          {group.label}
                        </button>
                      ) : (
                        <p className="wb-nav__group-label">{group.label}</p>
                      ))}
                    {add &&
                      (add.href ? (
                        <Link
                          href={add.href}
                          onClick={onClose}
                          className="wb-nav__add"
                          aria-label={add.label}
                          title={add.label}
                        >
                          <IconPlus size={15} />
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className="wb-nav__add"
                          aria-label={add.label}
                          title={add.label}
                          onClick={() => add.onClick?.()}
                        >
                          <IconPlus size={15} />
                        </button>
                      ))}
                  </div>
                )}
                {!isCollapsed && group.items.map((item) => renderItem(item, showIcons))}
              </div>
            );
          })}
        </nav>

        <div className="wb-sidebar__foot">
          <AccountMenu
            accountName={accountName}
            {...(accountMenuItems ? { items: accountMenuItems } : {})}
            {...(signOutHref ? { signOutHref } : {})}
          />
        </div>
      </aside>
    </>
  );
}
