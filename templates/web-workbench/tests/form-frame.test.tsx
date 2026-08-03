/**
 * <FormFrame> behaviour. These are the checks that were impossible before the
 * harness: everything here needs a real DOM — focus, disabled state, aria
 * wiring, and the submit lifecycle.
 *
 * Written against behaviour a consumer can observe, not internals: no assertions
 * on state shape or class names beyond the ones the kit documents.
 */
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
