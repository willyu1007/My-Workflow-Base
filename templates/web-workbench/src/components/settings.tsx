/**
 * SettingsFrame — the locked settings chrome: left section nav + right field
 * content + sticky save bar. Driven by a data SettingsSchema; the kit owns the
 * draft / dirty / save lifecycle for declared fields. Bespoke panels plug in via
 * the `slots` prop (key → ReactNode) and self-manage their own saving, so they
 * are framed but NOT counted by the unified save bar.
 *
 * Field controls reuse the kit's `mt-input` / `mt-select` / `mt-textarea` atoms;
 * the save bar reuses <ActionButton>. The breadcrumb is the page identity — the
 * frame deliberately carries no big title; the active nav entry names the section.
 *
 * State: `values` seeds the draft on mount. `onSave` should REJECT on failure so
 * the form stays dirty (do NOT swallow the error inside onSave); wire `onError`
 * to surface it. To reset the form to new external values, remount with a `key`.
 */
"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import type {
  SettingsField,
  SettingsFieldValue,
  SettingsSchema,
  SettingsSection,
  SettingsValues,
} from "../contracts/settings";
import { ActionButton } from "./action-button";

export function SettingsFrame({
  schema,
  values,
  onSave,
  slots,
  onDiscard,
  onError,
  navHeading = "设置分区",
  dirtyLabel = "有未保存更改",
  saveLabel = "保存",
  discardLabel = "放弃",
}: {
  readonly schema: SettingsSchema;
  readonly values: SettingsValues;
  readonly onSave: (values: SettingsValues) => void | Promise<void>;
  readonly slots?: Readonly<Record<string, ReactNode>>;
  readonly onDiscard?: () => void;
  readonly onError?: (error: unknown) => void;
  readonly navHeading?: string;
  readonly dirtyLabel?: string;
  readonly saveLabel?: string;
  readonly discardLabel?: string;
}): React.ReactElement {
  const [activeKey, setActiveKey] = useState<string>(schema.sections[0]?.key ?? "");
  const [baseline, setBaseline] = useState<SettingsValues>(values);
  const [draft, setDraft] = useState<SettingsValues>(values);
  const [saving, setSaving] = useState(false);

  const dirty = useMemo(() => !valuesEqual(draft, baseline), [draft, baseline]);
  const active = useMemo(
    () => schema.sections.find((s) => s.key === activeKey) ?? schema.sections[0],
    [schema.sections, activeKey],
  );

  const setField = useCallback((key: string, value: SettingsFieldValue) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const discard = useCallback(() => {
    setDraft(baseline);
    onDiscard?.();
  }, [baseline, onDiscard]);

  const save = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(draft);
      setBaseline(draft);
    } catch (error) {
      onError?.(error);
    } finally {
      setSaving(false);
    }
  }, [draft, onSave, saving, onError]);

  return (
    <div className="wb-settings">
      <div className="wb-settings__body">
        <nav className="wb-settings__nav" aria-label={navHeading}>
          <div className="wb-settings__navhead">{navHeading}</div>
          {schema.sections.map((s) => {
            const on = s.key === active?.key;
            return (
              <button
                key={s.key}
                type="button"
                className={`wb-settings__navitem${on ? " wb-settings__navitem--active" : ""}`}
                onClick={() => setActiveKey(s.key)}
                {...(on ? { "aria-current": "true" as const } : {})}
              >
                {s.label}
              </button>
            );
          })}
        </nav>
        <div className="wb-settings__content">
          {active && (
            <SectionBody section={active} draft={draft} setField={setField} slots={slots} />
          )}
        </div>
      </div>
      {dirty && (
        <div className="wb-settings__savebar" role="status" aria-live="polite">
          <span className="wb-settings__dirty">
            <span className="wb-settings__dot" aria-hidden="true" />
            {dirtyLabel}
          </span>
          <span className="wb-settings__saveactions">
            <ActionButton onClick={discard} disabled={saving}>
              {discardLabel}
            </ActionButton>
            <ActionButton kind="primary" onClick={save} disabled={saving}>
              {saving ? "保存中…" : saveLabel}
            </ActionButton>
          </span>
        </div>
      )}
    </div>
  );
}

function SectionBody({
  section,
  draft,
  setField,
  slots,
}: {
  readonly section: SettingsSection;
  readonly draft: SettingsValues;
  readonly setField: (key: string, value: SettingsFieldValue) => void;
  readonly slots?: Readonly<Record<string, ReactNode>> | undefined;
}): React.ReactElement {
  return (
    <>
      {section.blocks.map((block, i) => {
        if (block.kind === "slot") {
          return (
            <section className="wb-settings__slotgroup" key={`slot-${block.key}`}>
              <div className="wb-settings__grouplabel">
                {block.label}
                {block.hint && <span className="wb-settings__grouphint"> · {block.hint}</span>}
              </div>
              <div className="wb-settings__slot">
                {slots?.[block.key] ?? (
                  <div className="wb-settings__slotmissing">缺少渲染槽:{block.key}</div>
                )}
              </div>
            </section>
          );
        }
        return (
          <section className="wb-settings__group" key={`group-${i}`}>
            {block.label && <div className="wb-settings__grouplabel">{block.label}</div>}
            {block.fields.map((f) => (
              <FieldRow key={f.key} field={f} value={draft[f.key]} setField={setField} />
            ))}
          </section>
        );
      })}
    </>
  );
}

function FieldRow({
  field,
  value,
  setField,
}: {
  readonly field: SettingsField;
  readonly value: SettingsFieldValue | undefined;
  readonly setField: (key: string, value: SettingsFieldValue) => void;
}): React.ReactElement {
  const stack = field.kind === "textarea";
  const labelId = `setlbl-${field.key}`;
  return (
    <div className={`wb-settings__row${stack ? " wb-settings__row--stack" : ""}`}>
      <div className="wb-settings__rowhead">
        <label className="wb-settings__label" id={labelId} htmlFor={`set-${field.key}`}>
          {field.label}
        </label>
        {field.desc && <div className="wb-settings__desc">{field.desc}</div>}
      </div>
      <div className="wb-settings__control">
        <FieldControl field={field} value={value} setField={setField} labelId={labelId} />
      </div>
    </div>
  );
}

function FieldControl({
  field,
  value,
  setField,
  labelId,
}: {
  readonly field: SettingsField;
  readonly value: SettingsFieldValue | undefined;
  readonly setField: (key: string, value: SettingsFieldValue) => void;
  readonly labelId: string;
}): React.ReactElement {
  const id = `set-${field.key}`;
  switch (field.kind) {
    case "toggle": {
      const on = value === true;
      return (
        <button
          type="button"
          id={id}
          role="switch"
          aria-checked={on}
          aria-labelledby={labelId}
          className={`wb-toggle${on ? " wb-toggle--on" : ""}`}
          onClick={() => setField(field.key, !on)}
        >
          <span className="wb-toggle__knob" aria-hidden="true" />
        </button>
      );
    }
    case "select":
      return (
        <select
          id={id}
          className="mt-select wb-settings__select"
          value={String(value ?? "")}
          onChange={(e) => setField(field.key, e.target.value)}
        >
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
          type="number"
          className="mt-input wb-settings__input"
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
        />
      );
    case "textarea":
      return (
        <textarea
          id={id}
          className="mt-textarea"
          value={String(value ?? "")}
          onChange={(e) => setField(field.key, e.target.value)}
          rows={field.rows ?? 3}
          {...(field.placeholder !== undefined ? { placeholder: field.placeholder } : {})}
        />
      );
    case "text":
    default:
      return (
        <input
          id={id}
          type="text"
          className="mt-input wb-settings__input"
          value={String(value ?? "")}
          onChange={(e) => setField(field.key, e.target.value)}
          {...(field.placeholder !== undefined ? { placeholder: field.placeholder } : {})}
        />
      );
  }
}

function valuesEqual(a: SettingsValues, b: SettingsValues): boolean {
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  return ak.every((k) => Object.is(a[k], b[k]));
}
