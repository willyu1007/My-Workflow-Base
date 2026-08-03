/**
 * The declarative constraint pass — pure, so it is tested directly rather than
 * through the DOM. These cases were written before the harness existed and ran
 * as a standalone script; they are the reason the function is exported.
 */
import { describe, expect, it } from "vitest";
import type { Field } from "../src/contracts/field.js";
import { checkConstraints } from "../src/components/form.js";

const text: Field = { kind: "text", key: "name", label: "n", required: true, maxLength: 3 };
const code: Field = {
  kind: "text",
  key: "code",
  label: "c",
  pattern: "^[a-z]+$",
  patternMessage: "lower only",
};
const num: Field = { kind: "number", key: "n", label: "N", min: 1, max: 10 };
const pick: Field = {
  kind: "select",
  key: "pick",
  label: "P",
  required: true,
  options: [{ value: "a", label: "A" }],
};
const toggle: Field = { kind: "toggle", key: "on", label: "O", required: true };

describe("required", () => {
  it("blocks an empty text field", () => {
    expect(checkConstraints([text], { name: "" })).toEqual({ name: "此项必填" });
  });

  it("passes once filled", () => {
    expect(checkConstraints([text], { name: "ab" })).toEqual({});
  });

  it("blocks an unanswered select", () => {
    expect(checkConstraints([pick], { pick: "" })).toEqual({ pick: "此项必填" });
  });

  it("accepts false on a toggle", () => {
    // False is an answer. Treating it as blank would make a required toggle
    // impossible to submit — the failure mode this case exists to prevent.
    expect(checkConstraints([toggle], { on: false })).toEqual({});
  });
});

describe("constraints", () => {
  it("rejects text over maxLength", () => {
    expect(checkConstraints([text], { name: "abcd" })).toEqual({ name: "最多 3 个字符" });
  });

  it("uses patternMessage rather than showing the regex", () => {
    expect(checkConstraints([code], { code: "AB" })).toEqual({ code: "lower only" });
  });

  it("accepts a matching pattern", () => {
    expect(checkConstraints([code], { code: "ab" })).toEqual({});
  });

  it("rejects a number below min and above max", () => {
    expect(checkConstraints([num], { n: 0 })).toEqual({ n: "不能小于 1" });
    expect(checkConstraints([num], { n: 99 })).toEqual({ n: "不能大于 10" });
  });

  it("accepts a number in range", () => {
    expect(checkConstraints([num], { n: 5 })).toEqual({});
  });

  it("skips constraints on an optional blank field", () => {
    // A blank optional number must not trip "请输入数字" — otherwise every
    // untouched optional field blocks submit.
    expect(checkConstraints([num], { n: "" })).toEqual({});
  });
});
