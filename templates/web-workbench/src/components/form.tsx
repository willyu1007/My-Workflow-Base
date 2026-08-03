/**
 * FormFrame — the Form paradigm: create or edit ONE object.
 *
 * A single guided column of grouped fields, then one primary submit. Validates
 * before submitting; on failure it stays put with per-field messages and focuses
 * the first offender. It carries no page chrome of its own, so the same element
 * works inside a <Scene> or inside a <Drawer> — which PARADIGMS.md requires
 * ("whole page or in a Drawer").
 *
 * Not SettingsFrame. That one has a section nav and a sticky save bar and no
 * notion of required, because settings save whatever they hold. Using it to
 * create an object produces a "有未保存更改" bar for a thing that does not exist
 * yet. See contracts/form.ts for the full comparison.
 *
 * Controls reuse the kit's `mt-input` / `mt-select` / `mt-textarea` atoms and the
 * `mt-field` / `mt-label` / `mt-help` row, so a form looks like the rest of the
 * kit without new CSS.
 *
 * The toast in "validate → submit → toast" is the HOST's: firing one from here
 * would assume a <ToastProvider> above every form. Call `useToast` in your
 * `onSubmit` after the write succeeds.
 *
 * `onSubmit` must REJECT on failure — do not swallow the error inside it, or the
 * form will report success it did not have. Wire `onError` to surface it.
 */
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { Field, FieldValue, FieldValues } from "../contracts/field.js";
import type { FormErrors, FormSchema } from "../contracts/form.js";
import { ActionButton } from "./action-button.js";

export function FormFrame({
  schema,
  values,
  onSubmit,
  onCancel,
  validate,
  onError,
  submitLabel = "提交",
  cancelLabel = "取消",
  submittingLabel = "提交中…",
  requiredHint = "必填",
}: {
  readonly schema: FormSchema;
  /** Seeds the form on mount. To reset to new external values, remount with a `key`. */
  readonly values?: FieldValues;
  readonly onSubmit: (values: FieldValues) => void | Promise<void>;
  readonly onCancel?: () => void;
  /** Cross-field rules the declarative constraints cannot express. Merged over them. */
  readonly validate?: (values: FieldValues) => FormErrors;
  readonly onError?: (error: unknown) => void;
  readonly submitLabel?: string;
  readonly cancelLabel?: string;
  readonly submittingLabel?: string;
  readonly requiredHint?: string;
}): React.ReactElement {
  const fields = useMemo(
    () => schema.groups.flatMap((g) => g.fields),
    [schema.groups],
  );
  const [draft, setDraft] = useState<FieldValues>(() => seed(fields, values));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const controls = useRef(new Map<string, HTMLElement | null>());

  const setField = useCallback((key: string, value: FieldValue) => {
    setDraft((d) => ({ ...d, [key]: value }));
    // Clear this field's error as soon as it is touched. Leaving it until the
    // next submit means the user fixes the field and is still told it is wrong.
    setErrors((e) => (key in e ? omit(e, key) : e));
  }, []);

  const submit = useCallback(async () => {
    if (submitting) return;
    const found = { ...checkConstraints(fields, draft), ...(validate?.(draft) ?? {}) };
    if (Object.keys(found).length > 0) {
      setErrors(found);
      const first = fields.find((f) => f.key in found);
      if (first) controls.current.get(first.key)?.focus();
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await onSubmit(draft);
    } catch (error) {
      onError?.(error);
    } finally {
      setSubmitting(false);
    }
  }, [draft, fields, onError, onSubmit, submitting, validate]);

  return (
    <form
      className="wb-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      {schema.groups.map((group) => (
        <section className="wb-form__group" key={group.key}>
          {group.label && <div className="wb-settings__grouplabel">{group.label}</div>}
          {group.hint && <p className="mt-help wb-form__hint">{group.hint}</p>}
          <div className={fieldsClass(group.columns)}>
          {group.fields.map((field) => (
            <FieldRow
              key={field.key}
              field={field}
              value={draft[field.key]}
              error={errors[field.key]}
              requiredHint={requiredHint}
              setField={setField}
              register={(el) => controls.current.set(field.key, el)}
            />
          ))}
          </div>
        </section>
      ))}

      <div className="wb-form__actions">
        {onCancel && (
          <ActionButton onClick={onCancel} disabled={submitting}>
            {cancelLabel}
          </ActionButton>
        )}
        <ActionButton kind="primary" onClick={() => void submit()} disabled={submitting}>
          {submitting ? submittingLabel : submitLabel}
        </ActionButton>
      </div>
    </form>
  );
}

/**
 * The grid class for a group. `--3` is a MODIFIER: it sets only
 * grid-template-columns, so used alone the element keeps `display: block` and
 * the fields stack — silently, and it looks like a layout that simply did not
 * apply. Always paired here; that pairing is why `columns` exists as an API
 * rather than a class the host remembers to write correctly.
 */
function fieldsClass(columns: 1 | 2 | 3 | undefined): string {
  if (columns === 3) return "wb-form__fields wb-form__row wb-form__row--3";
  if (columns === 2) return "wb-form__fields wb-form__row";
  return "wb-form__fields";
}

/** Seed every declared key so a control is never uncontrolled-then-controlled. */
function seed(fields: readonly Field[], values: FieldValues | undefined): FieldValues {
  const out: FieldValues = {};
  for (const f of fields) {
    const given = values?.[f.key];
    out[f.key] = given !== undefined ? given : f.kind === "toggle" ? false : "";
  }
  return out;
}

function omit(source: FormErrors, key: string): FormErrors {
  const { [key]: _removed, ...rest } = source;
  return rest;
}

const isBlank = (v: FieldValue | undefined): boolean => v === undefined || v === "";

/**
 * The declarative pass: required, length, range, pattern. A toggle is never
 * "blank" — false is a real answer — so `required` on a toggle would make it
 * un-submittable, and is ignored.
 *
 * Exported because it is the only part of this component with real logic, and
 * it is pure — testable without a DOM, which the kit has no harness for.
 */
export function checkConstraints(fields: readonly Field[], values: FieldValues): FormErrors {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const value = values[f.key];
    if (f.required && f.kind !== "toggle" && isBlank(value)) {
      errors[f.key] = "此项必填";
      continue;
    }
    if (isBlank(value)) continue;

    if ((f.kind === "text" || f.kind === "textarea") && f.maxLength !== undefined) {
      if (String(value).length > f.maxLength) {
        errors[f.key] = `最多 ${f.maxLength} 个字符`;
        continue;
      }
    }
    if (f.kind === "text" && f.pattern !== undefined) {
      if (!new RegExp(f.pattern).test(String(value))) {
        errors[f.key] = f.patternMessage ?? "格式不正确";
        continue;
      }
    }
    if (f.kind === "number") {
      const n = Number(value);
      if (Number.isNaN(n)) {
        errors[f.key] = "请输入数字";
        continue;
      }
      if (f.min !== undefined && n < f.min) {
        errors[f.key] = `不能小于 ${f.min}`;
        continue;
      }
      if (f.max !== undefined && n > f.max) {
        errors[f.key] = `不能大于 ${f.max}`;
      }
    }
  }
  return errors;
}

function FieldRow({
  field,
  value,
  error,
  requiredHint,
  setField,
  register,
}: {
  readonly field: Field;
  readonly value: FieldValue | undefined;
  readonly error?: string;
  readonly requiredHint: string;
  readonly setField: (key: string, value: FieldValue) => void;
  readonly register: (el: HTMLElement | null) => void;
}): React.ReactElement {
  const id = `fld-${field.key}`;
  const descId = field.desc ? `${id}-desc` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [descId, errId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="mt-field">
      <label className="mt-label" htmlFor={id}>
        {field.label}
        {field.required && field.kind !== "toggle" && (
          <span className="wb-form__req" aria-label={requiredHint}>
            {" *"}
          </span>
        )}
      </label>
      <FieldControl
        field={field}
        value={value}
        error={Boolean(error)}
        id={id}
        describedBy={describedBy}
        setField={setField}
        register={register}
      />
      {field.desc && (
        <span className="mt-help" id={descId}>
          {field.desc}
        </span>
      )}
      {error && (
        <span className="mt-help mt-help--error" id={errId} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

function FieldControl({
  field,
  value,
  error,
  id,
  describedBy,
  setField,
  register,
}: {
  readonly field: Field;
  readonly value: FieldValue | undefined;
  readonly error: boolean;
  readonly id: string;
  /** Explicitly `| undefined` rather than optional: the repo runs
   *  exactOptionalPropertyTypes, which rejects passing undefined to `?:`. */
  readonly describedBy: string | undefined;
  readonly setField: (key: string, value: FieldValue) => void;
  readonly register: (el: HTMLElement | null) => void;
}): React.ReactElement {
  const invalid = error ? { "aria-invalid": true as const } : {};
  const described = describedBy ? { "aria-describedby": describedBy } : {};
  const inputClass = `mt-input${error ? " mt-input--error" : ""}`;

  switch (field.kind) {
    case "toggle": {
      const on = value === true;
      return (
        <button
          type="button"
          id={id}
          ref={register}
          role="switch"
          aria-checked={on}
          className={`wb-toggle${on ? " wb-toggle--on" : ""}`}
          onClick={() => setField(field.key, !on)}
          {...described}
        >
          <span className="wb-toggle__knob" aria-hidden="true" />
        </button>
      );
    }
    case "select":
      return (
        <select
          id={id}
          ref={register}
          className={`mt-select${error ? " mt-input--error" : ""}`}
          value={String(value ?? "")}
          onChange={(e) => setField(field.key, e.target.value)}
          {...invalid}
          {...described}
        >
          {/* A required select must be able to START unanswered, or "required"
              means nothing — the first option would already satisfy it. */}
          {field.required && <option value="">—</option>}
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case "number":
      return (
        <input
          id={id}
          ref={register}
          type="number"
          className={inputClass}
          value={value === undefined || value === "" ? "" : Number(value)}
          onChange={(e) =>
            setField(
              field.key,
              e.target.value === "" || Number.isNaN(e.target.valueAsNumber)
                ? ""
                : e.target.valueAsNumber,
            )
          }
          {...(field.min !== undefined ? { min: field.min } : {})}
          {...(field.max !== undefined ? { max: field.max } : {})}
          {...(field.step !== undefined ? { step: field.step } : {})}
          {...(field.placeholder !== undefined ? { placeholder: field.placeholder } : {})}
          {...invalid}
          {...described}
        />
      );
    case "textarea":
      return (
        <textarea
          id={id}
          ref={register}
          className={`mt-textarea${error ? " mt-input--error" : ""}`}
          value={String(value ?? "")}
          onChange={(e) => setField(field.key, e.target.value)}
          rows={field.rows ?? 3}
          {...(field.placeholder !== undefined ? { placeholder: field.placeholder } : {})}
          {...invalid}
          {...described}
        />
      );
    case "text":
    default:
      return (
        <input
          id={id}
          ref={register}
          type="text"
          className={inputClass}
          value={String(value ?? "")}
          onChange={(e) => setField(field.key, e.target.value)}
          {...(field.placeholder !== undefined ? { placeholder: field.placeholder } : {})}
          {...invalid}
          {...described}
        />
      );
  }
}
