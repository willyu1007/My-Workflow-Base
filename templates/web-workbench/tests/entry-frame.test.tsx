/**
 * <EntryFrame> structure. The kit locks chrome and slots; it does not own
 * auth states or scenario copy. Assert what a consumer can observe.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  EntryAccessory,
  EntryActions,
  EntryAlert,
  EntryChoice,
  EntryChoices,
  EntryFrame,
  EntryHeading,
  EntryNotice,
  EntryQuiet,
  EntrySubmit,
} from "../src/components/entry.js";

describe("EntryFrame chrome", () => {
  it("names the brand and the supplied scene", () => {
    render(
      <EntryFrame scene="场景">
        <EntryHeading>登录工作台</EntryHeading>
      </EntryFrame>,
    );

    expect(screen.getByText("MORETHAN")).toBeTruthy();
    expect(screen.getByText("场景")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "登录工作台" })).toBeTruthy();
  });

  it("keeps the accessory corner empty until the scenario fills it", () => {
    const { rerender } = render(
      <EntryFrame scene="场景">
        <EntryHeading>登录工作台</EntryHeading>
      </EntryFrame>,
    );

    expect(screen.queryByText("选项")).toBeNull();

    rerender(
      <EntryFrame
        scene="场景"
        accessory={<EntryAccessory label="选项">一项</EntryAccessory>}
      >
        <EntryHeading>登录工作台</EntryHeading>
      </EntryFrame>,
    );

    expect(screen.getByText("选项")).toBeTruthy();
    expect(screen.getByText("一项")).toBeTruthy();
  });

  it("puts the aside on the same heading row", () => {
    render(
      <EntryFrame scene="场景">
        <EntryHeading aside="陈敏">选择职务</EntryHeading>
      </EntryFrame>,
    );

    expect(screen.getByRole("heading", { name: "选择职务" })).toBeTruthy();
    expect(screen.getByText("陈敏")).toBeTruthy();
  });
});

describe("Entry recipes", () => {
  it("renders a blocked title with retry and a second action", () => {
    render(
      <EntryFrame scene="场景">
        <EntryAlert>暂时无法进入</EntryAlert>
        <EntryActions>
          <EntrySubmit href="/entry">重试</EntrySubmit>
          <EntrySubmit kind="ghost">登录</EntrySubmit>
        </EntryActions>
      </EntryFrame>,
    );

    expect(screen.getByRole("heading", { name: "暂时无法进入" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "重试" }).getAttribute("href")).toBe("/entry");
    expect(screen.getByRole("button", { name: "登录" }).getAttribute("type")).toBe("submit");
  });

  it("renders choice rows the scenario can submit", () => {
    render(
      <EntryFrame scene="场景">
        <EntryHeading>选择职务</EntryHeading>
        <EntryChoices>
          <EntryChoice title="晨光园" caption="机构管理员" actionLabel="进入" />
        </EntryChoices>
        <EntryQuiet>
          <EntrySubmit kind="quiet">退出登录</EntrySubmit>
        </EntryQuiet>
      </EntryFrame>,
    );

    const choice = screen.getByRole("button", { name: /晨光园/ });
    expect(choice.getAttribute("type")).toBe("submit");
    expect(choice.textContent).toContain("机构管理员");
    expect(choice.textContent).toContain("进入");
    expect(screen.getByRole("button", { name: "退出登录" })).toBeTruthy();
  });

  it("surfaces a notice without turning it into a heading", () => {
    render(
      <EntryFrame scene="场景">
        <EntryNotice>已退出此工作台。</EntryNotice>
        <EntryHeading>登录工作台</EntryHeading>
      </EntryFrame>,
    );

    expect(screen.getByRole("status").textContent).toBe("已退出此工作台。");
  });
});
