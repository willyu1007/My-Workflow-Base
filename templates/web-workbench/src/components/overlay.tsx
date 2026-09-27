/**
 * Drawer — the right-side panel for the paradigm 铁律 "do one thing → a Drawer,
 * never a page jump". Domain-agnostic: title / desc / body / footer + Escape and
 * backdrop close. Queue and Record use it for their sub-actions.
 */
"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { IconX } from "./icons.js";

function useEscape(open: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      // An inner transient surface (an open Select popup) consumes Escape by
      // preventing default — the drawer must survive that press and close on
      // the next one. stopPropagation alone cannot express this: under Next's
      // App Router React delegates from `document`, the same node this listens
      // on, and sibling listeners on one node still run.
      if (e.key === "Escape" && !e.defaultPrevented && !document.querySelector('.wb-dialog[open]')) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
}

function usePanelFocus(open: boolean, ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const panel = ref.current;
    if (!open || !panel) return;
    const previous = document.activeElement;
    const controls = () => Array.from(panel.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]',
    )).filter(element => {
      if (element.tabIndex < 0 || element.matches(":disabled")) return false;
      for (let parent: HTMLElement | null = element; parent && parent !== panel; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        if (parent.hidden || parent.hasAttribute("inert") || style.display === "none" || style.visibility === "hidden") return false;
        if (parent.tagName === "DETAILS" && !parent.hasAttribute("open")
          && !parent.querySelector(":scope > summary")?.contains(element)) return false;
      }
      return true;
    });
    controls()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || event.defaultPrevented) return;
      const topDialog = Array.from(document.querySelectorAll('.wb-dialog[open]')).at(-1);
      if (topDialog && topDialog !== panel) return;
      const candidates = controls(), first = candidates[0], last = candidates.at(-1);
      if (!first || !last) return;
      const active = document.activeElement;
      if (!panel.contains(active) || (event.shiftKey ? active === first : active === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [open, ref]);
}

interface PanelProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly desc?: string | undefined;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly width?: "default" | "wide";
  readonly headingLayout?: "stacked" | "inline";
  readonly headerActions?: ReactNode;
}

function PanelInner({ title, desc, children, footer, onClose, headingLayout = "stacked", headerActions }: Omit<PanelProps, "open">) {
  return (
    <>
      <div className="wb-panel__head">
        <div className={`wb-panel__identity wb-panel__identity--${headingLayout}`}>
          <h2 className="wb-panel__title">{title}</h2>
          {desc && <p className="wb-panel__desc">{desc}</p>}
        </div>
        {headerActions ?? <button type="button" className="wb-iconbtn" onClick={onClose} aria-label="关闭">
          <IconX size={18} />
        </button>}
      </div>
      <div className="wb-panel__body">{children}</div>
      {footer && <div className="wb-panel__foot">{footer}</div>}
    </>
  );
}

export function Drawer(props: PanelProps): React.ReactElement | null {
  const panel = useRef<HTMLDivElement>(null);
  useEscape(props.open, props.onClose);
  usePanelFocus(props.open, panel);
  if (!props.open) return null;
  return (
    <div
      className="wb-overlay wb-overlay--right"
      onClick={(e) => {
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      <div ref={panel} className={`wb-drawer${props.width === "wide" ? " wb-drawer--wide" : ""}`} role="dialog" aria-modal="true" aria-label={props.title}>
        <PanelInner {...props} />
      </div>
    </div>
  );
}

/** Native modal top layer with the same focus loop and restoration as Drawer. */
export function Dialog({ open, title, onClose, children }: Pick<PanelProps, "open" | "title" | "onClose" | "children">): React.ReactElement | null {
  const dialog = useRef<HTMLDialogElement>(null);
  usePanelFocus(open, dialog);
  useEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    element.showModal();
    return () => element.close();
  }, [open]);
  if (!open) return null;
  return <dialog ref={dialog} className="wb-dialog" aria-label={title}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onKeyDownCapture={event => {
      if (event.key === "Escape" && !event.defaultPrevented) { event.preventDefault(); onClose(); }
    }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }}>
    <h2 className="wb-panel__title">{title}</h2>
    {children}
  </dialog>;
}
