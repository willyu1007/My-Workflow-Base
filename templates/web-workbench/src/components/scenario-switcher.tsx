/**
 * ScenarioSwitcher — the breadcrumb root. Switches between the account's
 * registered My-Chat scenarios. Presentational: the host injects the scenario
 * list + `onSwitch`/`onRegister`; routing and toasts stay host-side.
 *
 * Renders at the muted "path" tier (`wb-scenario__name`); the current page (last
 * crumb) is the only bold anchor. See <Breadcrumb>.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import type { ScenarioConfig } from "../contracts/shell-nav";
import { IconCheck, IconChevronDown, IconPlus } from "./icons";

export function ScenarioSwitcher({
  scenario,
}: {
  readonly scenario: ScenarioConfig;
}): React.ReactElement {
  const { current: currentKey, registered, onSwitch, onRegister } = scenario;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = registered.find((s) => s.key === currentKey) ?? registered[0];

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

  if (!current) return <span className="wb-scenario" />;

  function switchTo(key: string): void {
    setOpen(false);
    if (key === currentKey) return;
    onSwitch(key);
  }

  function register(): void {
    setOpen(false);
    onRegister?.();
  }

  return (
    <div className="wb-scenario" ref={ref}>
      <button
        type="button"
        className="wb-scenario__btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="wb-scenario__name">{current.name}</span>
        <IconChevronDown size={13} style={{ color: "var(--mt-stone)" }} />
      </button>
      {open && (
        <div className="mt-menu wb-scenario__pop" role="menu">
          <p className="wb-menu-label">切换场景</p>
          {registered.map((s) => (
            <button
              key={s.key}
              type="button"
              className="mt-menu-item"
              role="menuitem"
              onClick={() => switchTo(s.key)}
              aria-current={s.key === currentKey ? "true" : undefined}
            >
              <span className="wb-scenario__mark wb-scenario__mark--sm">{s.mark}</span>
              <span className="wb-spacer">{s.name}</span>
              {s.key === currentKey && (
                <IconCheck size={14} style={{ color: "var(--mt-orange-700)" }} />
              )}
            </button>
          ))}
          {onRegister && (
            <>
              <div className="mt-menu-sep" />
              <button type="button" className="mt-menu-item" role="menuitem" onClick={register}>
                <span
                  className="wb-scenario__mark wb-scenario__mark--sm"
                  style={{ background: "var(--mt-sand-2)", color: "var(--fg-3)" }}
                >
                  <IconPlus size={14} />
                </span>
                <span className="wb-spacer">注册其他场景</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
