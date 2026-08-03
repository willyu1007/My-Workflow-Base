/**
 * Form paradigm contract — "create / edit ONE object". A scenario declares its
 * fields as data and <FormFrame> renders the locked chrome: a single guided
 * column, then one primary submit.
 *
 * Why this is not SettingsFrame, which it superficially resembles:
 *
 * | | Settings | Form |
 * |---|---|---|
 * | Shape | left section nav + right pane | one column, top to bottom |
 * | Commit | sticky save bar, draft/dirty | one submit action |
 * | Validation | none — settings save what they hold | required + constraints, before submit |
 * | Lives in | a settings page | a page **or a Drawer** |
 *
 * The distinction is not cosmetic. A create flow built on SettingsFrame gets a
 * "有未保存更改" bar for an object that does not exist yet, and no way to say a
 * field is required — which is exactly what a live consumer ended up shipping
 * before this existed.
 *
 * Pure data, like the settings schema: no React, no functions, so a schema can
 * be a constant or arrive from a server. Cross-field rules go on the component
 * (`<FormFrame validate>`), not in here.
 */

import type { Field } from "./field.js";

/** A run of fields under an optional label. Groups are the only structure — a
 *  guided form reads top to bottom, so there is no nav and no nesting. */
export interface FormGroup {
  readonly key: string;
  readonly label?: string;
  /** One quiet line under the group label. Explain the group, not each field. */
  readonly hint?: string;
  /**
   * Lay this group's fields side by side. Defaults to 1 — a guided form reads
   * top to bottom, and columns are for genuinely paired values (province /
   * city / district), not for shortening the page.
   *
   * The kit's grid collapses to one column under 560px on its own, so a
   * `columns` group stays usable on a phone without the host doing anything.
   *
   * This exists because the underlying CSS is a base class plus a modifier
   * (`.wb-form__row` + `.wb-form__row--3`) and the modifier alone sets no
   * `display`, so using it by itself silently stacks. A live consumer had
   * exactly that bug. Pairing them is the component's job, not the caller's.
   */
  readonly columns?: 1 | 2 | 3;
  readonly fields: readonly Field[];
}

export interface FormSchema {
  readonly groups: readonly FormGroup[];
}

/**
 * Validation result: field key → message. An empty object means valid.
 * Returned by the kit's built-in constraint pass and by `<FormFrame validate>`;
 * the two are merged, with the host's message winning on a shared key.
 */
export type FormErrors = Readonly<Record<string, string>>;
