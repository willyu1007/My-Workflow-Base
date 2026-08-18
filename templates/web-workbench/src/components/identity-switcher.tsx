/**
 * IdentitySwitcher — the topbar-right chip naming the role this session is bound
 * to. Presentational: the host injects the roles and `onSwitch`; binding and
 * routing stay host-side.
 *
 * Sits opposite the scenario switcher so the topbar reads as one identity line
 * (场景 › 页面 … 角色). A role is not a permission — the chip states which
 * viewpoint the page is rendered from, nothing more.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import type { IdentityConfig, IdentityRef } from "../contracts/shell-nav.js";
import { IconCheck, IconChevronDown } from "./icons.js";

/** Label over its surface note — the shape both menu tiers use. */
function Entry({ role }: { readonly role: IdentityRef }): React.ReactElement {
  return (
    <span className="wb-spacer wb-identity__entry">
      <span>{role.label}</span>
      {role.surface && <span className="wb-identity__surface">{role.surface}</span>}
    </span>
  );
}

export function IdentitySwitcher({
  identity,
}: {
  readonly identity: IdentityConfig;
}): React.ReactElement {
  const { current, others, onSwitch } = identity;
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

  function switchTo(key: string): void {
    setOpen(false);
    if (key === current.key) return;
    onSwitch?.(key);
  }

  return (
    <div className="wb-identity" ref={ref}>
      <button
        type="button"
        className="wb-identity__btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="wb-identity__name">{current.label}</span>
        <IconChevronDown size={13} style={{ color: "var(--mt-stone)", flexShrink: 0 }} />
      </button>
      {open && (
        <div className="mt-menu wb-identity__pop" role="menu">
          <p className="wb-menu-label">当前角色</p>
          <div className="mt-menu-item wb-identity__static">
            <Entry role={current} />
            <IconCheck size={14} style={{ color: "var(--mt-orange-700)", flexShrink: 0 }} />
          </div>
          {others && others.length > 0 && (
            <>
              <div className="mt-menu-sep" />
              <p className="wb-menu-label">该账号的其他角色</p>
              {others.map((role) =>
                onSwitch ? (
                  <button
                    key={role.key}
                    type="button"
                    className="mt-menu-item"
                    role="menuitem"
                    onClick={() => switchTo(role.key)}
                  >
                    <Entry role={role} />
                  </button>
                ) : (
                  <div key={role.key} className="mt-menu-item wb-identity__static">
                    <Entry role={role} />
                  </div>
                ),
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
