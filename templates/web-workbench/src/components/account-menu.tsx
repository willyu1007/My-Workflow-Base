/**
 * AccountMenu — bottom-of-sidebar account control. Sign-out is host-injected
 * (`signOutHref`); the kit owns the look, the host owns auth/routing.
 */
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconChevronDown, IconLogout } from "./icons";
import { Link } from "./nav";

/** A utility link in the account menu (e.g. 设置). Host-supplied. */
export interface AccountMenuItem {
  readonly href: string;
  readonly label: string;
  readonly icon?: ReactNode;
}

export function AccountMenu({
  accountName,
  items,
  signOutHref,
  signOutLabel = "退出登录",
}: {
  readonly accountName: string;
  readonly items?: readonly AccountMenuItem[];
  readonly signOutHref?: string;
  readonly signOutLabel?: string;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="wb-account" ref={ref}>
      <button
        type="button"
        className="wb-account__btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="wb-account__name">{accountName}</span>
        <IconChevronDown size={13} style={{ color: "var(--mt-stone)", flexShrink: 0 }} />
      </button>
      {open && (items?.length || signOutHref) && (
        <div className="mt-menu wb-account__pop" role="menu">
          {items?.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="mt-menu-item"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              {item.icon}
              <span className="wb-spacer">{item.label}</span>
            </Link>
          ))}
          {items?.length && signOutHref ? (
            <div className="mt-menu-sep" role="separator" />
          ) : null}
          {signOutHref && (
            <Link
              href={signOutHref}
              className="mt-menu-item"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <IconLogout size={16} />
              <span className="wb-spacer">{signOutLabel}</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
