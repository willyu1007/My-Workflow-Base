import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { Drawer } from "../src/components/overlay.js";

function Example() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  return <><button onClick={() => setOpen(true)}>打开资料</button>
    <button>背景动作</button>
    <Drawer open={open} title="资料" onClose={() => setOpen(false)}>
      <input aria-label="称呼" />
      <button disabled>检测中</button>
      <div hidden><button>隐藏操作</button></div>
      <button onClick={() => setCount(count + 1)}>刷新 {count}</button>
      <details><summary>说明</summary><button>折叠内容</button></details>
      <fieldset disabled><input aria-label="锁定称呼" /></fieldset>
      <button disabled tabIndex={0}>锁定保存</button>
    </Drawer></>;
}

it("moves focus into the drawer and restores its opening control on close", async () => {
  const user = userEvent.setup(); render(<Example />);
  const opener = screen.getByRole("button", { name: "打开资料" });
  await user.click(opener);
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "关闭" }));
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(opener);
});

it("cycles Tab inside the drawer and skips disabled, hidden and folded controls", async () => {
  const user = userEvent.setup(); render(<Example />);
  await user.click(screen.getByRole("button", { name: "打开资料" }));
  await user.tab({ shift: true });
  expect(document.activeElement).toBe(screen.getByText("说明"));
  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "关闭" }));
  await user.tab(); expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "称呼" }));
  await user.tab(); expect(document.activeElement).toBe(screen.getByRole("button", { name: "刷新 0" }));
  await user.tab(); expect(document.activeElement).toBe(screen.getByText("说明"));
  await user.tab(); expect(document.activeElement).toBe(screen.getByRole("button", { name: "关闭" }));
});

it("keeps the current control focused when the drawer callback rerenders", async () => {
  const user = userEvent.setup(); render(<Example />);
  await user.click(screen.getByRole("button", { name: "打开资料" }));
  await user.click(screen.getByRole("button", { name: "刷新 0" }));
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "刷新 1" }));
});
