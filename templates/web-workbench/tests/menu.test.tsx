import {StrictMode,useState} from "react";
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
  expect(menu.parentElement).toBe(document.body);
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
it("starts upward trigger-menu navigation at the last enabled item", async () => {
  const user = userEvent.setup();
  render(<Menu label="更多" trigger="…"><button role="menuitem">第一项</button>
    <button role="menuitem">第二项</button><button role="menuitem">最后一项</button></Menu>);
  await user.click(screen.getByRole("button", {name: "更多"}));
  await user.keyboard("{ArrowUp}");
  expect(document.activeElement).toBe(screen.getByRole("menuitem", {name: "最后一项"}));
});
it("keeps a context menu inside its native dialog without changing focus or dismissal",async()=>{
  const selected=vi.fn(),user=userEvent.setup();
  function InDialog(){const[open,setOpen]=useState(false);return <dialog open aria-label="设置">
    <button onClick={()=>setOpen(true)}>选择日期</button><button>其他设置</button>
    <Menu mode="context" label="选择日期" point={{x:12,y:12}} open={open} onOpenChange={setOpen}>
      <button role="menuitem" onClick={selected}>周一</button><button role="menuitem" disabled>周二</button><button role="menuitem">周三</button>
    </Menu></dialog>;}
  render(<StrictMode><InDialog/></StrictMode>);
  const dialog=screen.getByRole("dialog",{name:"设置"}),trigger=screen.getByRole("button",{name:"选择日期"});
  await user.click(trigger);
  expect(dialog.contains(screen.getByRole("menu"))).toBe(true);
  expect(document.activeElement).toBe(screen.getByRole("menuitem",{name:"周一"}));
  await user.keyboard("{ArrowDown}");expect(document.activeElement).toBe(screen.getByRole("menuitem",{name:"周三"}));
  await user.keyboard("{Escape}");expect(screen.queryByRole("menu")).toBeNull();expect(document.activeElement).toBe(trigger);
  expect(dialog.hasAttribute("open")).toBe(true);
  await user.click(trigger);await user.click(screen.getByRole("button",{name:"其他设置"}));expect(screen.queryByRole("menu")).toBeNull();
  await user.click(trigger);await user.click(screen.getByRole("menuitem",{name:"周一"}));expect(selected).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("menu")).toBeNull();expect(dialog.hasAttribute("open")).toBe(true);
});
