/**
 * <FormFrame> behaviour. These are the checks that were impossible before the
 * harness: everything here needs a real DOM — focus, disabled state, aria
 * wiring, and the submit lifecycle.
 *
 * Written against behaviour a consumer can observe, not internals: no assertions
 * on state shape or class names beyond the ones the kit documents.
 */
import { render,screen,waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe,expect,it,vi } from "vitest";
import { FormFrame } from "../src/components/form.js";
import type { FormSchema } from "../src/contracts/form.js";

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
  it("BA-30 必填字段为空时表单不提交，并展示可行动原因", async () => {
    const onSubmit = vi.fn();
    render(<FormFrame schema={schema} onSubmit={onSubmit} />);

    await userEvent.click(submitBtn());

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getAllByText("此项必填")).toHaveLength(2); // name + kind
  });

  it("BA-31 一份合法 consumer 表单输入可以提交", async () => {
    const onSubmit = vi.fn();
    render(<FormFrame schema={schema} onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/名称/), "项目一");
    await userEvent.selectOptions(screen.getByLabelText(/类型/), "a");
    await userEvent.click(submitBtn());

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ name: "项目一", note: "", kind: "a" });
  });
});
