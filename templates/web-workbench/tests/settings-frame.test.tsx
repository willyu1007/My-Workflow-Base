/**
 * <SettingsFrame> behaviour. The draft → dirty → save lifecycle is the part with
 * real logic and the part a consumer notices when it breaks: a save bar that
 * appears when nothing changed, or stays gone after a failed save, is worse than
 * no save bar.
 *
 * The documented contract is that `onSave` must REJECT on failure so the form
 * stays dirty. Two tests below exist purely to hold that.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { SettingsSchema, SettingsValues } from "../src/contracts/settings.js";
import { SettingsFrame } from "../src/components/settings.js";

const schema: SettingsSchema = {
  sections: [
    {
      key: "general",
      label: "通用",
      blocks: [
        {
          kind: "group",
          label: "基本",
          fields: [
            { kind: "text", key: "name", label: "名称" },
            { kind: "toggle", key: "on", label: "启用" },
          ],
        },
      ],
    },
    {
      key: "advanced",
      label: "高级",
      blocks: [
        { kind: "group", fields: [{ kind: "number", key: "limit", label: "上限" }] },
        { kind: "slot", key: "custom", label: "自定义面板" },
      ],
    },
  ],
};

const initial: SettingsValues = { name: "原名", on: false, limit: 5 };

const saveBar = () => screen.queryByRole("status");

describe("dirty tracking", () => {
  it("shows no save bar until something actually changes", () => {
    render(<SettingsFrame schema={schema} values={initial} onSave={vi.fn()} />);
    expect(saveBar()).toBeNull();
  });

  it("raises the save bar once a field is edited", async () => {
    render(<SettingsFrame schema={schema} values={initial} onSave={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("名称"), "改");

    expect(saveBar()).not.toBeNull();
    expect(screen.getByText("有未保存更改")).toBeDefined();
  });

  it("drops the save bar again when the edit is reverted by hand", async () => {
    // Dirty must be a value comparison, not a "was touched" flag — typing and
    // undoing leaves the settings identical, and a save bar there is a lie.
    render(<SettingsFrame schema={schema} values={initial} onSave={vi.fn()} />);
    const input = screen.getByLabelText("名称");

    await userEvent.type(input, "改");
    expect(saveBar()).not.toBeNull();
    await userEvent.type(input, "{Backspace}");

    await waitFor(() => expect(saveBar()).toBeNull());
  });

  it("discards back to the original values", async () => {
    const onDiscard = vi.fn();
    render(
      <SettingsFrame schema={schema} values={initial} onSave={vi.fn()} onDiscard={onDiscard} />,
    );

    await userEvent.type(screen.getByLabelText("名称"), "改");
    await userEvent.click(screen.getByRole("button", { name: "放弃" }));

    expect((screen.getByLabelText("名称") as HTMLInputElement).value).toBe("原名");
    expect(saveBar()).toBeNull();
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });
});

describe("saving", () => {
  it("passes the whole draft, not just the edited key", async () => {
    const onSave = vi.fn();
    render(<SettingsFrame schema={schema} values={initial} onSave={onSave} />);

    await userEvent.type(screen.getByLabelText("名称"), "改");
    await userEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0]?.[0]).toEqual({ name: "原名改", on: false, limit: 5 });
  });

  it("clears dirty after a successful save", async () => {
    render(<SettingsFrame schema={schema} values={initial} onSave={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("名称"), "改");
    await userEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => expect(saveBar()).toBeNull());
  });

  it("stays dirty when the save rejects", async () => {
    // The documented reason onSave must reject rather than swallow: otherwise
    // the bar clears and the user believes work was persisted that was not.
    const onError = vi.fn();
    const onSave = vi.fn(() => Promise.reject(new Error("500")));
    render(
      <SettingsFrame schema={schema} values={initial} onSave={onSave} onError={onError} />,
    );

    await userEvent.type(screen.getByLabelText("名称"), "改");
    await userEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(saveBar()).not.toBeNull();
  });

  it("allows a retry after a failed save", async () => {
    const onSave = vi
      .fn<(v: SettingsValues) => Promise<void>>()
      .mockRejectedValueOnce(new Error("500"))
      .mockResolvedValueOnce(undefined);
    render(<SettingsFrame schema={schema} values={initial} onSave={onSave} onError={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("名称"), "改");
    await userEvent.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));

    await userEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(saveBar()).toBeNull());
  });
});

describe("sections", () => {
  it("shows the first section and marks it current", () => {
    render(<SettingsFrame schema={schema} values={initial} onSave={vi.fn()} />);

    expect(screen.getByLabelText("名称")).toBeDefined();
    expect(screen.queryByLabelText("上限")).toBeNull();
    expect(screen.getByRole("button", { name: "通用" }).getAttribute("aria-current")).toBe("true");
  });

  it("switches content when another section is chosen", async () => {
    render(<SettingsFrame schema={schema} values={initial} onSave={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "高级" }));

    expect(screen.getByLabelText("上限")).toBeDefined();
    expect(screen.queryByLabelText("名称")).toBeNull();
  });

  it("keeps an edit made in a section the user has navigated away from", async () => {
    // Sections unmount, so a draft held per-section would silently lose edits.
    const onSave = vi.fn();
    render(<SettingsFrame schema={schema} values={initial} onSave={onSave} />);

    await userEvent.type(screen.getByLabelText("名称"), "改");
    await userEvent.click(screen.getByRole("button", { name: "高级" }));
    await userEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0]?.[0]).toMatchObject({ name: "原名改" });
  });

  it("renders a host slot, and says so when one is missing", async () => {
    const { unmount } = render(
      <SettingsFrame
        schema={schema}
        values={initial}
        onSave={vi.fn()}
        slots={{ custom: <p>宿主面板</p> }}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "高级" }));
    expect(screen.getByText("宿主面板")).toBeDefined();
    unmount();

    render(<SettingsFrame schema={schema} values={initial} onSave={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "高级" }));
    expect(screen.getByText(/缺少渲染槽/)).toBeDefined();
  });
});
