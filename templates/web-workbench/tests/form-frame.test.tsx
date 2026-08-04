/**
 * <FormFrame> behaviour. These are the checks that were impossible before the
 * harness: everything here needs a real DOM — focus, disabled state, aria
 * wiring, and the submit lifecycle.
 *
 * Written against behaviour a consumer can observe, not internals: no assertions
 * on state shape or class names beyond the ones the kit documents.
 */
import { readFileSync } from "node:fs";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { FormSchema } from "../src/contracts/form.js";
import { FormFrame } from "../src/components/form.js";

const schema: FormSchema = {
  groups: [
    {
      key: "basics",
      label: "基本",
      fields: [
        { kind: "text", key: "name", label: "名称", required: true },
        { kind: "text", key: "note", label: "备注" },
        {
          kind: "select",
          key: "kind",
          label: "类型",
          required: true,
          options: [{ value: "a", label: "A" }],
        },
      ],
    },
  ],
};

const submitBtn = () => screen.getByRole("button", { name: "提交" });

describe("validation gates submit", () => {
  it("does not submit while a required field is empty, and says why", async () => {
    const onSubmit = vi.fn();
    render(<FormFrame schema={schema} onSubmit={onSubmit} />);

    await userEvent.click(submitBtn());

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getAllByText("此项必填")).toHaveLength(2); // name + kind
  });

  it("focuses the first offending field, not the last", async () => {
    render(<FormFrame schema={schema} onSubmit={vi.fn()} />);

    await userEvent.click(submitBtn());

    expect(document.activeElement).toBe(screen.getByLabelText(/名称/));
  });

  it("submits the values once the form is valid", async () => {
    const onSubmit = vi.fn();
    render(<FormFrame schema={schema} onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/名称/), "项目一");
    await userEvent.selectOptions(screen.getByLabelText(/类型/), "a");
    await userEvent.click(submitBtn());

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ name: "项目一", note: "", kind: "a" });
  });

  it("merges the host's validate over the declarative pass", async () => {
    const onSubmit = vi.fn();
    render(
      <FormFrame
        schema={schema}
        values={{ name: "x", kind: "a" }}
        validate={() => ({ name: "这个名称已被占用" })}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.click(submitBtn());

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("这个名称已被占用")).toBeDefined();
  });
});

describe("error lifecycle", () => {
  it("clears a field's error as soon as it is edited", async () => {
    render(<FormFrame schema={schema} onSubmit={vi.fn()} />);
    await userEvent.click(submitBtn());
    expect(screen.getAllByText("此项必填")).toHaveLength(2);

    await userEvent.type(screen.getByLabelText(/名称/), "a");

    // Only the untouched select should still complain. Leaving the fixed field
    // marked until the next submit tells the user they are still wrong.
    expect(screen.getAllByText("此项必填")).toHaveLength(1);
  });

  it("wires the error to the control for assistive tech", async () => {
    render(<FormFrame schema={schema} onSubmit={vi.fn()} />);
    await userEvent.click(submitBtn());

    const name = screen.getByLabelText(/名称/);
    expect(name.getAttribute("aria-invalid")).toBe("true");
    const describedBy = name.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
  });
});

describe("submit lifecycle", () => {
  it("disables the button while in flight and restores it after", async () => {
    let release: () => void = () => {};
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    render(<FormFrame schema={schema} values={{ name: "x", kind: "a" }} onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole("button", { name: "提交" }));

    const inFlight = screen.getByRole("button", { name: "提交中…" });
    expect(inFlight.hasAttribute("disabled") || inFlight.getAttribute("aria-disabled") === "true").toBe(true);

    release();
    await waitFor(() => expect(screen.getByRole("button", { name: "提交" })).toBeDefined());
  });

  it("reports a rejected submit and leaves the form usable", async () => {
    const onError = vi.fn();
    const onSubmit = vi.fn(() => Promise.reject(new Error("409")));
    render(
      <FormFrame
        schema={schema}
        values={{ name: "x", kind: "a" }}
        onSubmit={onSubmit}
        onError={onError}
      />,
    );

    await userEvent.click(submitBtn());

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    // The whole point of requiring onSubmit to reject: the user can retry.
    await waitFor(() => expect(screen.getByRole("button", { name: "提交" })).toBeDefined());
    await userEvent.click(submitBtn());
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
  });
});

describe("required select", () => {
  it("starts unanswered so that required can mean something", () => {
    render(<FormFrame schema={schema} onSubmit={vi.fn()} />);
    const select = screen.getByLabelText(/类型/) as HTMLSelectElement;

    // Without a blank first option the first real option is already selected,
    // and a required select is satisfied before the user has chosen anything.
    expect(select.value).toBe("");
  });
});

describe("column layout", () => {
  const grouped = (columns?: 1 | 2 | 3): FormSchema => ({
    groups: [
      {
        key: "region",
        label: "地区",
        ...(columns ? { columns } : {}),
        fields: [
          { kind: "text", key: "a", label: "省份" },
          { kind: "text", key: "b", label: "城市" },
          { kind: "text", key: "c", label: "区县" },
        ],
      },
    ],
  });

  const fieldsBox = (): HTMLElement =>
    document.querySelector(".wb-form__fields") as HTMLElement;

  /**
   * classList, never className.toContain — "wb-form__row--3" CONTAINS the
   * substring "wb-form__row", so a substring assertion passes even when the base
   * class is missing, which is precisely the defect these tests exist to catch.
   * A mutation run found that: dropping the base class left the suite green.
   */
  const hasClass = (name: string): boolean => fieldsBox().classList.contains(name);

  it("stacks by default", () => {
    render(<FormFrame schema={grouped()} onSubmit={vi.fn()} />);
    expect(hasClass("wb-form__row")).toBe(false);
  });

  it("pairs the modifier with its base class at 3 columns", () => {
    // `--3` alone sets no display, so a host writing it by hand gets a silent
    // stack. A live consumer shipped exactly that.
    render(<FormFrame schema={grouped(3)} onSubmit={vi.fn()} />);
    expect(hasClass("wb-form__row")).toBe(true);
    expect(hasClass("wb-form__row--3")).toBe(true);
  });

  it("uses the base class alone at 2 columns", () => {
    render(<FormFrame schema={grouped(2)} onSubmit={vi.fn()} />);
    expect(hasClass("wb-form__row")).toBe(true);
    expect(hasClass("wb-form__row--3")).toBe(false);
  });

  it("keeps the group label out of the grid", () => {
    // The label must sit above the columns, not become a cell in them.
    render(<FormFrame schema={grouped(3)} onSubmit={vi.fn()} />);
    expect(fieldsBox().textContent).not.toContain("地区");
  });

  it("still validates and submits when laid out in columns", async () => {
    const onSubmit = vi.fn();
    render(
      <FormFrame
        schema={{
          groups: [
            {
              key: "r",
              columns: 2,
              fields: [
                { kind: "text", key: "a", label: "甲", required: true },
                { kind: "text", key: "b", label: "乙" },
              ],
            },
          ],
        }}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "提交" }));
    expect(onSubmit).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText(/甲/), "x");
    await userEvent.click(screen.getByRole("button", { name: "提交" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });
});

describe("field label class", () => {
  it("uses the unambiguous name", () => {
    render(<FormFrame schema={schema} onSubmit={vi.fn()} />);
    const label = screen.getByText("备注");
    expect(label.classList.contains("mt-field-label")).toBe(true);
  });

  it("keeps .mt-label styled during the deprecation window", () => {
    // A consumer has 8 files writing className="mt-label". Dropping the
    // selector before removing the class is a silent restyle, not a rename.
    // Plain path, not import.meta.url: under jsdom that is not a file: URL.
    // Comments are stripped FIRST — the doc comment above this rule names both
    // classes, so an assertion over the raw text passes no matter what the
    // selector says. A mutation run caught exactly that.
    const css = readFileSync("src/styles/components.css", "utf8").replace(
      /\/\*[\s\S]*?\*\//g,
      "",
    );
    const selector = css.slice(0, css.indexOf("{", css.indexOf(".mt-field-label")));
    const selectorList = selector.slice(selector.lastIndexOf(";") + 1);
    expect(selectorList).toContain(".mt-label");
  });
});
