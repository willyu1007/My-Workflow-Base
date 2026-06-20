/**
 * Sidebar — the locked workbench navigation. Driven entirely by ShellNav; every
 * auxiliary element (count / 待上线 / status badge · group label / 添加工作流 add /
 * 更多 overflow) is enumerated with fixed visuals + spacing. Projects toggle via
 * data — never restyle. Search is host-injected (`onSearch`) since toast/routing
 * stay host-side.
 */
"use client";

import { useState } from "react";
import type { NavItemDef, ShellNav } from "../contracts/shell-nav";
import { AccountMenu } from "./account-menu";
import { IconChevronDown, IconHome, IconPlus, IconSearch, IconSidebar } from "./icons";
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
  signOutHref,
  onSearch,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onCollapse: () => void;
  readonly nav: ShellNav;
  readonly badges?: Readonly<Record<string, number>>;
  readonly accountName: string;
  readonly signOutHref?: string;
  readonly onSearch?: () => void;
}): React.ReactElement {
  const pathname = usePathname();
  const [openOverflow, setOpenOverflow] = useState<string | null>(null);

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
            const mainItems = group.items.filter((it) => !it.overflow);
            const overflowItems = group.items.filter((it) => it.overflow);
            const overflowActive = overflowItems.some(
              (it) => !it.soon && (it.match ?? [it.href]).some((p) => matchPrefix(pathname, p)),
            );
            const expanded = openOverflow === groupKey;
            return (
              <div key={groupKey} className="wb-nav__group">
                {(group.label || add) && (
                  <div className="wb-nav__grouphead">
                    {group.label && <p className="wb-nav__group-label">{group.label}</p>}
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
                {mainItems.map((item) => renderItem(item, showIcons))}
                {overflowItems.length > 0 && (
                  <>
                    <button
                      type="button"
                      className={`wb-nav__item wb-nav__item--more${expanded ? " wb-nav__item--more-open" : ""}${overflowActive ? " wb-nav__item--more-active" : ""}`}
                      aria-expanded={expanded}
                      onClick={() => setOpenOverflow(expanded ? null : groupKey)}
                    >
                      <span className="wb-nav__icon" />
                      <span className="wb-nav__label">更多</span>
                      <span className="wb-nav__more-caret">
                        <IconChevronDown size={15} />
                      </span>
                    </button>
                    {expanded && overflowItems.map((item) => renderItem(item, false))}
                  </>
                )}
              </div>
            );
          })}
        </nav>

        <div className="wb-sidebar__foot">
          <AccountMenu accountName={accountName} {...(signOutHref ? { signOutHref } : {})} />
        </div>
      </aside>
    </>
  );
}
