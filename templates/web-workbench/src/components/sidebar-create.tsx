/**
 * SidebarCreate — the quick-entry item that opens its menu. Items are supplied
 * by the scenario via ShellNav.create.
 *
 * The label defaults to 「新增」 for callers that only create; a scenario whose
 * menu also navigates passes its own, and each row carries a trailing mark
 * saying which it is.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import type { CreateItemDef } from "../contracts/shell-nav.js";
import { IconArrowRight, IconList, IconPlus } from "./icons.js";
import { Link } from "./nav.js";

/**
 * The trailing affordance. The menu mixes making something with going
 * somewhere, and the two read identically without it.
 */
function KindMark({
  kind = "create",
}: {
  readonly kind?: "create" | "navigate" | undefined;
}): React.ReactElement {
  return (
    <span className="wb-create__kind" aria-hidden="true">
      {kind === "create" ? <IconPlus size={13} /> : <IconArrowRight size={13} />}
    </span>
  );
}

export function SidebarCreate({
  items,
  label = "新增",
  onNavigate,
}: {
  readonly items: readonly CreateItemDef[];
  readonly label?: string;
  readonly onNavigate?: () => void;
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
    <div className="wb-create" ref={ref}>
      <button
        type="button"
        className="wb-nav__item"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="wb-nav__icon">
          <IconList />
        </span>
        <span className="wb-nav__label">{label}</span>
      </button>
      {open && (
        <div className="mt-menu wb-create__pop" role="menu">
          {items.map((c) =>
            c.soon ? (
              <span
                key={c.href}
                className="mt-menu-item"
                role="menuitem"
                aria-disabled="true"
                style={{ opacity: 0.5, cursor: "not-allowed" }}
              >
                {c.icon && <span className="wb-create__lead">{c.icon}</span>}
                <span className="wb-spacer">{c.label}</span>
                <span className="wb-nav__soon">建设中</span>
                <KindMark kind={c.kind} />
              </span>
            ) : (
              <Link
                key={c.href}
                href={c.href}
                role="menuitem"
                className="mt-menu-item"
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
              >
                {c.icon && <span className="wb-create__lead">{c.icon}</span>}
                <span className="wb-spacer">{c.label}</span>
                <KindMark kind={c.kind} />
              </Link>
            ),
          )}
        </div>
      )}
    </div>
  );
}
