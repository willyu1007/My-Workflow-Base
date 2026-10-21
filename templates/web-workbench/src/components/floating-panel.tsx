/**
 * FloatingPanel — a non-modal companion that stays beside the work instead of
 * replacing it. Collapsed it is a round button pinned bottom-right; open it is a
 * panel the user can drag by its header. It sits above the Drawer scrim (layer
 * 85) so it stays usable while a Drawer task is open, and the Drawer's focus
 * loop leaves it alone. A native Dialog still covers it.
 *
 * The host owns `open` and the content; the kit owns placement, dragging,
 * Escape/collapse and focus return. Position lives in component memory only.
 * At ≤920px the panel becomes a bottom sheet and does not drag; collapsing is
 * the non-gesture way to move it out of the way.
 */
"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { IconChevronDown } from "./icons.js";

export interface FloatingPanelProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** Header title, the collapsed button's name and its tooltip. */
  readonly title: string;
  /** Decorative mark shown in the button and the header. */
  readonly icon: ReactNode;
  /** Collapsed only: shows the attention dot and joins the button's name, e.g. "有新回答". */
  readonly notice?: string | undefined;
  /** Collapsed only: work in progress. */
  readonly busy?: boolean | undefined;
  /** Controls placed before the collapse button. */
  readonly headerActions?: ReactNode;
  readonly footer?: ReactNode;
  readonly children: ReactNode;
}

type Point = { readonly x: number; readonly y: number };
const EDGE = 8;
const SHEET = "(max-width: 920px)";

function clamp(point: Point, panel: HTMLElement): Point {
  const maxX = Math.max(EDGE, window.innerWidth - panel.offsetWidth - EDGE);
  const maxY = Math.max(EDGE, window.innerHeight - panel.offsetHeight - EDGE);
  return { x: Math.min(Math.max(point.x, EDGE), maxX), y: Math.min(Math.max(point.y, EDGE), maxY) };
}

export function FloatingPanel({ open, onOpenChange, title, icon, notice, busy, headerActions, footer, children }: FloatingPanelProps): React.ReactElement {
  const panel = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ readonly id: number; readonly from: Point; readonly start: Point } | null>(null);
  const [position, setPosition] = useState<Point | null>(null);
  const [dragging, setDragging] = useState(false);
  const wasOpen = useRef(open);

  useEffect(() => {
    const opened = open && !wasOpen.current, collapsed = !open && wasOpen.current;
    wasOpen.current = open;
    // A host control marked autoFocus wins; otherwise the panel itself takes focus.
    if (opened && !panel.current?.contains(document.activeElement)) panel.current?.focus();
    // Collapsing removed the focused control: give focus back to the button.
    if (collapsed && (!document.activeElement || document.activeElement === document.body)) bubble.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open || !position) return;
    // Keep a dragged panel on screen; the narrow sheet has no position at all.
    const onResize = () => {
      const element = panel.current;
      if (window.matchMedia(SHEET).matches) setPosition(null);
      else if (element) setPosition(current => current && clamp(current, element));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open, position]);

  if (!open) {
    return (
      <button ref={bubble} type="button" data-wb-float=""
        className={`wb-float-bubble${busy ? " wb-float-bubble--busy" : ""}`}
        aria-label={notice ? `${title}，${notice}` : title} aria-busy={busy || undefined}
        onClick={() => onOpenChange(true)}>
        <span className="wb-float-bubble__icon" aria-hidden="true">{icon}</span>
        {notice && <span className="wb-float-bubble__dot" aria-hidden="true" />}
        <span className="wb-float-bubble__tip" aria-hidden="true">{title}</span>
      </button>
    );
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // An inner popup that consumed Escape keeps the panel; otherwise collapse,
    // and claim the key so an open Drawer underneath stays open.
    if (event.key !== "Escape" || event.defaultPrevented) return;
    event.preventDefault();
    onOpenChange(false);
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target as Element;
    if (event.button !== 0 || target.closest("button, a, input, select, textarea") || window.matchMedia(SHEET).matches || !panel.current) return;
    const rect = panel.current.getBoundingClientRect();
    drag.current = { id: event.pointerId, from: { x: event.clientX, y: event.clientY }, start: { x: rect.left, y: rect.top } };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const active = drag.current;
    if (!active || active.id !== event.pointerId || !panel.current) return;
    setPosition(clamp({ x: active.start.x + event.clientX - active.from.x, y: active.start.y + event.clientY - active.from.y }, panel.current));
  };
  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
  };

  return (
    <div ref={panel} data-wb-float="" role="dialog" aria-modal="false" aria-label={title} tabIndex={-1} onKeyDown={onKeyDown}
      className={`wb-float${position ? " wb-float--placed" : ""}${dragging ? " wb-float--dragging" : ""}`}
      style={position ? { left: position.x, top: position.y } : undefined}>
      <div className="wb-float__head" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <span className="wb-float__grip" aria-hidden="true" />
        <span className="wb-float__icon" aria-hidden="true">{icon}</span>
        <h2 className="wb-float__title">{title}</h2>
        {headerActions}
        <button type="button" className="wb-iconbtn" aria-label="收起" title="收起" onClick={() => onOpenChange(false)}>
          <IconChevronDown size={18} />
        </button>
      </div>
      <div className="wb-float__body">{children}</div>
      {footer && <div className="wb-float__foot">{footer}</div>}
    </div>
  );
}
