"use client";

import { useRef, type ReactElement } from "react";

export type DateButtonDensity = "default" | "compact";

export function formatDateButtonValue(value: string, placeholder = "选择日期"): string {
  return value ? value.replaceAll("-", " - ") : placeholder;
}

export function DateButton({
  value,
  onChange,
  ariaLabel,
  placeholder = "选择日期",
  density = "default",
  invalid = false,
  disabled = false,
  className,
  inputName,
  min,
  max,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly ariaLabel: string;
  readonly placeholder?: string;
  readonly density?: DateButtonDensity;
  readonly invalid?: boolean;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly inputName?: string;
  readonly min?: string;
  readonly max?: string;
}): ReactElement {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const displayValue = formatDateButtonValue(value, placeholder);
  const densityClass = density === "compact" ? " mt-date-button--compact" : "";
  const invalidClass = invalid ? " mt-date-button--invalid" : "";
  const disabledClass = disabled ? " mt-date-button--disabled" : "";

  function openDatePicker(): void {
    if (disabled) return;
    const input = inputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") input.showPicker();
    else input.click();
  }

  return (
    <span className="mt-date-button-control">
      <button
        type="button"
        className={`mt-date-button${densityClass}${invalidClass}${disabledClass}${className ? ` ${className}` : ""}`}
        aria-label={`${ariaLabel} ${displayValue}`}
        aria-invalid={invalid}
        disabled={disabled}
        onClick={openDatePicker}
      >
        {displayValue}
      </button>
      <input
        ref={inputRef}
        className="mt-date-button-native"
        aria-hidden="true"
        tabIndex={-1}
        name={inputName}
        type="date"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </span>
  );
}
