/**
 * Select — a custom listbox dropdown that opens *below* the trigger (unlike a
 * native <select>, whose OS popup centres over the control). Reuses the
 * `.mt-select` field look for the trigger. Accessible: the trigger is a listbox
 * button driving an aria-activedescendant option; arrow/Enter/Escape/Home/End
 * navigate, click-outside and Escape close.
 */
"use client";

import { useEffect, useId, useRef, useState } from "react";
import { IconChevronDown } from "./icons";

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

export function Select({
  value,
  options,
  onChange,
  disabled = false,
  ariaLabel,
}: {
  readonly value: string;
  readonly options: readonly SelectOption[];
  readonly onChange: (value: string) => void;
  readonly disabled?: boolean;
  readonly ariaLabel?: string;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selectedLabel = selectedIndex >= 0 ? options[selectedIndex]!.label : "";

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent): void => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
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
        className="mt-select mt-select--trigger"
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
      {open && (
        <ul
          className="mt-select__pop"
          role="listbox"
          ref={listRef}
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
        </ul>
      )}
    </div>
  );
}
