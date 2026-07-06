"use client";

import { useEffect, useRef, useState, type InputHTMLAttributes, type ReactElement } from "react";

export type ExpandableTextFieldDensity = "default" | "compact";

export function ExpandableTextField({
  value,
  onChange,
  ariaLabel,
  placeholder,
  density = "default",
  invalid = false,
  disabled = false,
  inputMode,
  className,
  panelClassName,
  rows = 4,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly ariaLabel: string;
  readonly placeholder?: string;
  readonly density?: ExpandableTextFieldDensity;
  readonly invalid?: boolean;
  readonly disabled?: boolean;
  readonly inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  readonly className?: string;
  readonly panelClassName?: string;
  readonly rows?: number;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const densityClass = density === "compact" ? " mt-expandable-text-field--compact" : "";
  const invalidClass = invalid ? " mt-expandable-text-field--invalid" : "";
  const disabledClass = disabled ? " mt-expandable-text-field--disabled" : "";

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent): void => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function closeIfFocusLeaves(nextTarget: EventTarget | null): void {
    if (nextTarget instanceof Node && rootRef.current?.contains(nextTarget)) return;
    setOpen(false);
  }

  function closeOnEscape(event: React.KeyboardEvent): void {
    if (event.key !== "Escape") return;
    event.preventDefault();
    setOpen(false);
  }

  return (
    <span
      ref={rootRef}
      className={`mt-expandable-text-field${densityClass}${invalidClass}${disabledClass}`}
      onBlurCapture={(event) => closeIfFocusLeaves(event.relatedTarget)}
    >
      <input
        className={`mt-expandable-text-field__input${className ? ` ${className}` : ""}`}
        value={value}
        inputMode={inputMode}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-invalid={invalid}
        disabled={disabled}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onKeyDown={closeOnEscape}
      />
      {open && !disabled ? (
        <textarea
          className={`mt-expandable-text-field__panel${panelClassName ? ` ${panelClassName}` : ""}`}
          tabIndex={-1}
          value={value}
          rows={rows}
          aria-label={`${ariaLabel}详情`}
          placeholder={placeholder}
          aria-invalid={invalid}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={closeOnEscape}
        />
      ) : null}
    </span>
  );
}
