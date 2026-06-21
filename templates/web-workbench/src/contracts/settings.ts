/**
 * Settings / Form paradigm contract — a scenario DECLARES its settings as data;
 * the kit's <SettingsFrame> renders the locked chrome (section nav + field rows
 * + sticky save bar). Declared field values are kit-managed (draft → dirty →
 * save). Bespoke panels plug in as render-slots resolved by `key`; they
 * self-manage their own persistence and are NOT part of the unified save bar.
 *
 * This file is pure data (no React) so a schema can be a constant or come from
 * a server; the host supplies slot JSX separately via <SettingsFrame slots>.
 */

export type SettingsFieldValue = string | number | boolean;

/** A boolean switch. */
export interface SettingsToggleField {
  readonly kind: "toggle";
  readonly key: string;
  readonly label: string;
  readonly desc?: string;
}

/** A single-choice dropdown over a fixed option set. */
export interface SettingsSelectField {
  readonly kind: "select";
  readonly key: string;
  readonly label: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly desc?: string;
}

/** A single-line text input. */
export interface SettingsTextField {
  readonly kind: "text";
  readonly key: string;
  readonly label: string;
  readonly placeholder?: string;
  readonly desc?: string;
}

/** A numeric input. Yields a `number`, or `""` when the field is cleared. */
export interface SettingsNumberField {
  readonly kind: "number";
  readonly key: string;
  readonly label: string;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly placeholder?: string;
  readonly desc?: string;
}

/** A multi-line text input — renders stacked (label above, full-width control). */
export interface SettingsTextareaField {
  readonly kind: "textarea";
  readonly key: string;
  readonly label: string;
  readonly placeholder?: string;
  readonly rows?: number;
  readonly desc?: string;
}

export type SettingsField =
  | SettingsToggleField
  | SettingsSelectField
  | SettingsTextField
  | SettingsNumberField
  | SettingsTextareaField;

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
export type SettingsValues = Record<string, SettingsFieldValue>;
