/**
 * Field contract — shared by the Settings and Form paradigms.
 *
 * Both declare their fields as DATA (no React), so a schema can be a constant or
 * come from a server. The kinds live here rather than in either paradigm because
 * a text field is a text field: duplicating them would have created a second
 * source for one shape, and naming them after whichever paradigm happened to
 * need them first would have left the other importing `SettingsTextField` to
 * build a create form. `contracts/settings.ts` re-exports these under their
 * original `Settings*` names, so existing consumers are unaffected.
 *
 * Constraints are declarative on purpose. Putting a `validate` function in the
 * schema would make it un-serialisable and break the data property above;
 * cross-field rules belong on the component, where <FormFrame validate> takes
 * them.
 */

export type FieldValue = string | number | boolean;

/** Constraints every field kind can carry. Enforced by <FormFrame> on submit. */
interface FieldBase {
  readonly key: string;
  readonly label: string;
  readonly desc?: string;
  /**
   * Blocks submit when empty. Ignored by <SettingsFrame>, which has no submit
   * step — settings save whatever they hold.
   */
  readonly required?: boolean;
}

/** A boolean switch. */
export interface ToggleField extends FieldBase {
  readonly kind: "toggle";
}

/** A single-choice dropdown over a fixed option set. */
export interface SelectField extends FieldBase {
  readonly kind: "select";
  readonly options: readonly { readonly value: string; readonly label: string }[];
}

/** A single-line text input. */
export interface TextField extends FieldBase {
  readonly kind: "text";
  readonly placeholder?: string;
  readonly maxLength?: number;
  /** Serialised RegExp source, kept a string so the schema stays data. */
  readonly pattern?: string;
  /** Shown when `pattern` fails — a raw regex is not a user-facing message. */
  readonly patternMessage?: string;
}

/** A numeric input. Yields a `number`, or `""` when the field is cleared. */
export interface NumberField extends FieldBase {
  readonly kind: "number";
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly placeholder?: string;
}

/** A multi-line text input — renders stacked (label above, full-width control). */
export interface TextareaField extends FieldBase {
  readonly kind: "textarea";
  readonly placeholder?: string;
  readonly rows?: number;
  readonly maxLength?: number;
}

export type Field = ToggleField | SelectField | TextField | NumberField | TextareaField;

/** Flat values keyed by field `key`. */
export type FieldValues = Record<string, FieldValue>;
