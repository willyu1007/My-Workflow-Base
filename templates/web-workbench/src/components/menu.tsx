"use client";

import {useEffect, useLayoutEffect, useRef, useState, type ReactNode} from "react";
import {createPortal} from "react-dom";

type MenuProps = Readonly<{label: string; children: ReactNode}> & (
  Readonly<{mode?: "trigger"; trigger: ReactNode; align?: "start" | "end"; compact?: boolean; portal?: boolean}>
  | Readonly<{mode: "context"; point: {x: number; y: number}; open: boolean; onOpenChange(open: boolean): void}>
);

/** One dismissal/focus model for trigger menus and pointer/keyboard context menus. */
export function Menu(props: MenuProps): React.ReactElement {
  const [triggerOpen, setTriggerOpen] = useState(false);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const context = props.mode === "context";
  const portalled = context || props.portal === true;
  const open = context ? props.open : triggerOpen;
  const root = useRef<HTMLDivElement>(null), pop = useRef<HTMLDivElement>(null);
  const initiator = useRef<HTMLElement | null>(null);
  const setOpen = context ? props.onOpenChange : setTriggerOpen;

  useLayoutEffect(() => {
    // A body portal is inert outside a native modal; use this menu's own dialog.
    setHost(portalled && open ? root.current?.closest("dialog") ?? document.body : null);
  }, [portalled, open]);

  useLayoutEffect(() => {
    if (!open) return;
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || !pop.current?.contains(active)) initiator.current = active instanceof HTMLElement ? active : null;
    if (context) pop.current?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')?.focus();
  }, [open, context, host]);

  useLayoutEffect(() => {
    if (!portalled || !open || !host) return;
    const position = () => {
      const element = pop.current; if (!element) return;
      const {width, height} = element.getBoundingClientRect();
      let x: number, y: number, above: number;
      if (props.mode === "context") {
        ({x, y} = props.point); above = y - height;
      } else {
        const anchor = root.current?.querySelector("button")?.getBoundingClientRect(); if (!anchor) return;
        x = props.align === "start" ? anchor.left : anchor.right - width;
        y = anchor.bottom + 6; above = anchor.top - height - 6;
      }
      const left = context && x + width > window.innerWidth - 8 ? x - width : x;
      element.style.left = `${Math.max(8, Math.min(left, window.innerWidth - width - 8))}px`;
      element.style.top = `${Math.max(8, Math.min(y + height > window.innerHeight - 8 ? above : y, window.innerHeight - height - 8))}px`;
    };
    position();
    const observer = new ResizeObserver(position); if (pop.current) observer.observe(pop.current);
    if (!context && root.current) observer.observe(root.current);
    window.addEventListener("resize", position);
    if (!context) window.addEventListener("scroll", position, true);
    return () => {observer.disconnect(); window.removeEventListener("resize", position); window.removeEventListener("scroll", position, true);};
  }, [portalled, context, open, host, context ? props.point.x : 0, context ? props.point.y : 0, context ? null : props.align]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target) && !pop.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault(); setOpen(false);
        (context ? initiator.current : root.current?.querySelector("button"))?.focus();
      } else if (event.key === "Tab") setOpen(false);
      else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        const items = [...pop.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? []];
        if (!items.length) return;
        event.preventDefault();
        const index = items.findIndex(item => item === document.activeElement);
        const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
          : index < 0 ? (event.key === "ArrowUp" ? items.length - 1 : 0)
          : (index + (event.key === "ArrowUp" ? -1 : 1) + items.length) % items.length;
        items[next]?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey, true);};
  }, [open, context, setOpen]);

  const popup = open ? <div ref={pop} className={`mt-menu wb-menu2__pop${portalled ? " wb-menu2__pop--floating" : ""}${context ? " wb-menu2__pop--context" : ` wb-menu2__pop--${props.align ?? "end"}`}`}
    role="menu" aria-label={props.label} onClick={() => {
      setOpen(false);
      // A selected item unmounts before a consumer dialog captures its return focus.
      if (portalled && !context && pop.current?.contains(document.activeElement)) root.current?.querySelector("button")?.focus();
    }}>{props.children}</div> : null;
  return <div className="wb-menu2" ref={root}>
    {!context && <button type="button" className={`wb-menu2__btn${props.compact ? " wb-menu2__btn--compact" : ""}${open ? " wb-menu2__btn--on" : ""}`}
      aria-haspopup="menu" aria-expanded={open} aria-label={props.label} onClick={() => setOpen(!open)}>{props.trigger}</button>}
    {portalled && popup ? host && createPortal(popup, host) : popup}
  </div>;
}
