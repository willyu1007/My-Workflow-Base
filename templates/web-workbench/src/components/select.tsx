/**
 * Select — a custom listbox dropdown that opens *below* the trigger (unlike a
 * native <select>, whose OS popup centres over the control). Reuses the
 * `.mt-select` field look for the trigger. Accessible: the trigger is a listbox
 * button driving an aria-activedescendant option; arrow/Enter/Escape/Home/End
 * navigate, click-outside and Escape close.
 *
 * The popup renders through a portal to <body>, fixed-positioned from the
 * trigger's rect: an in-flow popup is clipped by any `overflow` ancestor (the
 * kit's own Drawer body is one), and near the viewport edge it flips above the
 * trigger instead of running off-screen.
 */
"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconChevronDown } from "./icons.js";

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

export type SelectVariant = "field" | "action";

/** Viewport-fixed placement for the portaled popup; `top` XOR `bottom` is set. */
interface PopPlacement {
  readonly left: number;
  readonly minWidth: number;
  readonly maxHeight: number;
  readonly top?: number;
  readonly bottom?: number;
}

const POP_GAP = 4;
const POP_MAX_HEIGHT = 248;
/** Below this, the popup shows too few options to be worth opening downward. */
const POP_MIN_SPACE = 160;

export function Select({
  value,
  options,
  onChange,
  disabled = false,
  ariaLabel,
  placeholder = "",
  variant = "field",
}: {
  readonly value: string;
  readonly options: readonly SelectOption[];
  readonly onChange: (value: string) => void;
  readonly disabled?: boolean;
  readonly ariaLabel?: string;
  readonly placeholder?: string;
  readonly variant?: SelectVariant;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [placement, setPlacement] = useState<PopPlacement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selectedLabel = selectedIndex >= 0 ? options[selectedIndex]!.label : placeholder;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent): void => {
      const target = e.target as Node;
      // The list lives in a portal, so it is outside rootRef — check both.
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Place the popup from the trigger's viewport rect, and follow it while any
  // ancestor scrolls or the window resizes (capture catches inner scrollers).
  useLayoutEffect(() => {
    if (!open) {
      setPlacement(null);
      return;
    }
    const place = (): void => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const below = window.innerHeight - rect.bottom - POP_GAP;
      const above = rect.top - POP_GAP;
      const openUp = below < POP_MIN_SPACE && above > below;
      setPlacement({
        left: rect.left,
        minWidth: rect.width,
        maxHeight: Math.min(POP_MAX_HEIGHT, Math.max(96, openUp ? above : below)),
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + POP_GAP }
          : { top: rect.bottom + POP_GAP }),
      });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function openMenu(): void {
    if (disabled) return;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
    // Safari and Firefox on macOS do not focus a <button> on click; without
    // this the arrow keys go to the document and the listbox never moves.
    triggerRef.current?.focus();
  }

  function commit(index: number): void {
    const opt = options[index];
    if (opt) onChange(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent): void {
    if (disabled) return;
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        commit(activeIndex);
        break;
      case "Escape":
        e.preventDefault();
        // Escape closes the top transient surface only — a host Drawer listens
        // on document and must not close together with the popup.
        e.stopPropagation();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        break;
    }
  }

  return (
    <div className="mt-selectbox" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`mt-select mt-select--trigger mt-select--${variant}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        {...(ariaLabel ? { "aria-label": ariaLabel } : {})}
        {...(open ? { "aria-activedescendant": `${baseId}-opt-${activeIndex}` } : {})}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
      >
        <span className="mt-select__value">{selectedLabel}</span>
        <IconChevronDown size={14} className="mt-select__caret" />
      </button>
      {open &&
        placement !== null &&
        createPortal(
          <ul
            className="mt-select__pop"
            role="listbox"
            ref={listRef}
            style={{
              left: placement.left,
              minWidth: placement.minWidth,
              maxHeight: placement.maxHeight,
              ...(placement.top !== undefined
                ? { top: placement.top }
                : { bottom: placement.bottom }),
            }}
            {...(ariaLabel ? { "aria-label": ariaLabel } : {})}
          >
            {options.map((o, i) => (
              <li
                key={o.value}
                id={`${baseId}-opt-${i}`}
                role="option"
                aria-selected={o.value === value}
                className={`mt-select__option${i === activeIndex ? " is-active" : ""}${o.value === value ? " is-selected" : ""}`}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => commit(i)}
              >
                {o.label}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}
