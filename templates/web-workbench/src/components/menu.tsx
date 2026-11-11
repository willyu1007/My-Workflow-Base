"use client";

import {useEffect, useLayoutEffect, useRef, useState, type ReactNode} from "react";
import {createPortal} from "react-dom";

type MenuProps = Readonly<{label: string; children: ReactNode}> & (
  Readonly<{mode?: "trigger"; trigger: ReactNode; align?: "start" | "end"; compact?: boolean}>
  | Readonly<{mode: "context"; point: {x: number; y: number}; open: boolean; onOpenChange(open: boolean): void}>
);

/** One dismissal/focus model for trigger menus and pointer/keyboard context menus. */
export function Menu(props: MenuProps): React.ReactElement {
  const [triggerOpen, setTriggerOpen] = useState(false);
  const context = props.mode === "context";
  const open = context ? props.open : triggerOpen;
  const root = useRef<HTMLDivElement>(null), pop = useRef<HTMLDivElement>(null);
  const initiator = useRef<HTMLElement | null>(null);
  const setOpen = context ? props.onOpenChange : setTriggerOpen;

  useLayoutEffect(() => {
    if (!open) return;
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || !pop.current?.contains(active)) initiator.current = active instanceof HTMLElement ? active : null;
    if (context) pop.current?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')?.focus();
  }, [open, context]);

  useLayoutEffect(() => {
    if (!context || !open) return;
    const {x, y} = props.point;
    const position = () => {
      const element = pop.current; if (!element) return;
      const {width, height} = element.getBoundingClientRect();
      element.style.left = `${Math.max(8, Math.min(x + width > window.innerWidth - 8 ? x - width : x, window.innerWidth - width - 8))}px`;
      element.style.top = `${Math.max(8, Math.min(y + height > window.innerHeight - 8 ? y - height : y, window.innerHeight - height - 8))}px`;
    };
    position();
    const observer = new ResizeObserver(position); if (pop.current) observer.observe(pop.current);
    window.addEventListener("resize", position);
    return () => {observer.disconnect(); window.removeEventListener("resize", position);};
  }, [context, open, context ? props.point.x : 0, context ? props.point.y : 0]);

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
          : (index + (event.key === "ArrowUp" ? -1 : 1) + items.length) % items.length;
        items[next]?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey, true);};
  }, [open, context, setOpen]);

  const popup = open ? <div ref={pop} className={`mt-menu wb-menu2__pop${context ? " wb-menu2__pop--context" : ` wb-menu2__pop--${props.align ?? "end"}`}`}
    role="menu" aria-label={props.label} onClick={() => setOpen(false)}>{props.children}</div> : null;
  return <div className="wb-menu2" ref={root}>
    {!context && <button type="button" className={`wb-menu2__btn${props.compact ? " wb-menu2__btn--compact" : ""}${open ? " wb-menu2__btn--on" : ""}`}
      aria-haspopup="menu" aria-expanded={open} aria-label={props.label} onClick={() => setOpen(!open)}>{props.trigger}</button>}
    {context && popup ? createPortal(popup, document.body) : popup}
  </div>;
}
