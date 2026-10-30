import { fireEvent,render,screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { expect,it,vi } from "vitest";
import { Dialog,Drawer } from "../src/components/overlay.js";

function Example() {
  const [open, setOpen] = useState(false);
  return <><button onClick={() => setOpen(true)}>打开资料</button>
    <Drawer open={open} title="资料" onClose={() => setOpen(false)}>
      <input aria-label="称呼" />
    </Drawer></>;
}

it("BA-33 Drawer 正确接收焦点，并在关闭后恢复焦点", async () => {
  const user = userEvent.setup(); render(<Example />);
  const opener = screen.getByRole("button", { name: "打开资料" });
  await user.click(opener);
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "关闭" }));
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(opener);
});

it("BA-34 子 Dialog 的 Escape 不关闭父 Drawer", async () => {
  // jsdom does not implement the browser's native dialog focus lifecycle.
  const show = vi.fn(function (this: HTMLDialogElement) { this.open = true; this.querySelector('input')?.focus(); });
  const close = vi.fn(function (this: HTMLDialogElement) { this.open = false; });
  const originalShow = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "showModal");
  const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "close");
  Object.defineProperties(HTMLDialogElement.prototype, { showModal: { configurable: true, value: show }, close: { configurable: true, value: close } });
  const parentClose = vi.fn();
  function Nested() {
    const [open, setOpen] = useState(false);
    return <Drawer open title="资料" onClose={parentClose}>
      <button onClick={() => setOpen(true)}>修改资料</button>
      <Dialog open={open} title="修改" onClose={() => setOpen(false)}><input aria-label="称呼" /><button>编辑保存</button></Dialog>
    </Drawer>;
  }
  try {
    render(<Nested />);
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: '修改资料' });
    await user.click(trigger);
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "修改" })).toBeNull();
    expect(screen.getByRole("dialog", { name: "资料" })).toBeTruthy();
    expect(parentClose).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(trigger);
  } finally {
    if (originalShow) Object.defineProperty(HTMLDialogElement.prototype, "showModal", originalShow);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
    if (originalClose) Object.defineProperty(HTMLDialogElement.prototype, "close", originalClose);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
  }
});
