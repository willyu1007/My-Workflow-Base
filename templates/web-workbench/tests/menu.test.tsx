import {StrictMode} from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {afterEach, beforeEach, expect, it, vi} from "vitest";
import {Menu} from "../src/components/menu.js";
beforeEach(() => vi.stubGlobal("ResizeObserver", class {observe() {} disconnect() {}}));
afterEach(() => {vi.restoreAllMocks(); vi.unstubAllGlobals();});
it("anchors a controlled context menu at the pointer and flips before overflowing the viewport", () => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({width: 240, height: 180} as DOMRect);
  const close = vi.fn();
  render(<Menu mode="context" label="单元格操作" point={{x: window.innerWidth - 10, y: window.innerHeight - 10}} open onOpenChange={close}>
    <button role="menuitem">合并</button></Menu>);
  const menu = screen.getByRole("menu");
  expect(menu.style.left).toBe(`${window.innerWidth - 250}px`);
  expect(menu.style.top).toBe(`${window.innerHeight - 190}px`);
  fireEvent.mouseDown(document.body);
  expect(close).toHaveBeenCalledWith(false);
});
it("moves keyboard focus among enabled items and restores the initiator on Escape", async () => {
  const initiator = document.createElement("button"); document.body.append(initiator); initiator.focus();
  const close = vi.fn(), user = userEvent.setup();
  render(<StrictMode><Menu mode="context" label="单元格操作" point={{x: 12, y: 12}} open onOpenChange={close}>
    <button role="menuitem">合并</button><button role="menuitem" disabled>拆分</button><button role="menuitem">清除</button></Menu></StrictMode>);
  expect(document.activeElement).toBe(screen.getByRole("menuitem", {name: "合并"}));
  await user.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(screen.getByRole("menuitem", {name: "清除"}));
  await user.keyboard("{Escape}"); expect(close).toHaveBeenCalledWith(false);
  expect(document.activeElement).toBe(initiator); initiator.remove();
});
it("preserves the ordinary trigger menu and closes on an item click", async () => {
  const user = userEvent.setup();
  render(<Menu label="更多" trigger="…"><button role="menuitem">编辑</button></Menu>);
  await user.click(screen.getByRole("button", {name: "更多"})); expect(screen.getByRole("menu")).toBeTruthy();
  await user.click(screen.getByRole("menuitem", {name: "编辑"})); expect(screen.queryByRole("menu")).toBeNull();
});
