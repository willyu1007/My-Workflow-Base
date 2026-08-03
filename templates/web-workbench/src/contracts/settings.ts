/**
 * Settings paradigm contract — a scenario DECLARES its settings as data; the
 * kit's <SettingsFrame> renders the locked chrome (section nav + field rows +
 * sticky save bar). Declared field values are kit-managed (draft → dirty →
 * save). Bespoke panels plug in as render-slots resolved by `key`; they
 * self-manage their own persistence and are NOT part of the unified save bar.
 *
 * This file is pure data (no React) so a schema can be a constant or come from
 * a server; the host supplies slot JSX separately via <SettingsFrame slots>.
 *
 * The field kinds moved to `contracts/field.ts` in 0.14.0, because the Form
 * paradigm needs the same shapes and a create form should not have to import
 * `SettingsTextField` to declare a text input. Every `Settings*` name below is
 * preserved as an alias — the definition site moved, the API did not.
 */

import type {
  Field,
  FieldValue,
  FieldValues,
  NumberField,
  SelectField,
  TextField,
  TextareaField,
  ToggleField,
} from "./field.js";

export type SettingsFieldValue = FieldValue;
export type SettingsToggleField = ToggleField;
export type SettingsSelectField = SelectField;
export type SettingsTextField = TextField;
export type SettingsNumberField = NumberField;
export type SettingsTextareaField = TextareaField;
export type SettingsField = Field;

/** A run of declared fields under an optional quiet sub-label (批改 / 提交 …). */
export interface SettingsGroupBlock {
  readonly kind: "group";
  readonly label?: string;
  readonly fields: readonly SettingsField[];
}

/**
 * A bespoke panel the host renders itself (resolved by `key` from the frame's
 * `slots` prop). It self-manages persistence — NOT part of the unified save bar.
 * NB: a slot is UNMOUNTED while its section is inactive, so keep any state that
 * must survive section switches ABOVE <SettingsFrame> (in the host or a store),
 * not in local component state inside the panel.
 */
export interface SettingsSlotBlock {
  readonly kind: "slot";
  readonly key: string;
  readonly label: string;
  readonly hint?: string;
}

export type SettingsBlock = SettingsGroupBlock | SettingsSlotBlock;

/** One settings category — a left-nav entry + its ordered content blocks. */
export interface SettingsSection {
  readonly key: string;
  readonly label: string;
  readonly blocks: readonly SettingsBlock[];
}

export interface SettingsSchema {
  readonly sections: readonly SettingsSection[];
}

/**
 * Flat draft / saved values, keyed by field `key`. A `number` field yields a
 * `number`, or `""` when cleared — the host coerces on save. Keys absent from
 * the schema are ignored; the schema is the single source of truth for what
 * renders. (A schema-typed values map is intentionally not enforced in v1 to
 * keep the host API ergonomic — declare a typed constant host-side if needed.)
 */
export type SettingsValues = FieldValues;
