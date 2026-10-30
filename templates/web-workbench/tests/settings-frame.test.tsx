/**
 * <SettingsFrame> behaviour. The draft → dirty → save lifecycle is the part with
 * real logic and the part a consumer notices when it breaks: a save bar that
 * appears when nothing changed, or stays gone after a failed save, is worse than
 * no save bar.
 *
 * The documented contract is that `onSave` must REJECT on failure so the form
 * stays dirty. The core case preserves the failed-save path.
 */
import { render,screen,waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe,expect,it,vi } from "vitest";
import { SettingsFrame } from "../src/components/settings.js";
import type { SettingsSchema,SettingsValues } from "../src/contracts/settings.js";

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

describe("saving", () => {

  it("BA-32 Settings 保存失败保留 dirty draft", async () => {
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
    expect((screen.getByLabelText("名称") as HTMLInputElement).value).toBe("原名改");
  });
});
