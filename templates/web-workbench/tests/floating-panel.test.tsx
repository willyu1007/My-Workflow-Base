import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { FloatingPanel } from "../src/components/floating-panel.js";
import { Drawer } from "../src/components/overlay.js";

beforeEach(() => {
  // jsdom has neither; the panel only needs to know it is not on a narrow screen.
  window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  HTMLElement.prototype.setPointerCapture = vi.fn();
});

function Example({ drawer = false, notice }: { readonly drawer?: boolean; readonly notice?: string }) {
  const [open, setOpen] = useState(false);
  const [task, setTask] = useState(drawer);
  return <>
    <Drawer open={task} title="邀请新老师" onClose={() => setTask(false)}><input aria-label="称呼" /></Drawer>
    <FloatingPanel open={open} onOpenChange={setOpen} title="工作台助手" icon={<svg />} notice={notice}
      headerActions={<button>新问题</button>} footer={<><input aria-label="提问" autoFocus /><button>问助手</button></>}>
      <a href="#entry">打开</a>
    </FloatingPanel>
  </>;
}

it("opens from the button, collapses on Escape and returns focus to the button", async () => {
  const user = userEvent.setup(); render(<Example notice="有新回答" />);
  await user.click(screen.getByRole("button", { name: "工作台助手，有新回答" }));
  const panel = screen.getByRole("dialog", { name: "工作台助手" });
  expect(panel.getAttribute("aria-modal")).toBe("false");
  expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "提问" }));
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog", { name: "工作台助手" })).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "工作台助手，有新回答" }));
});

it("collapses on Escape without closing the Drawer underneath", async () => {
  const user = userEvent.setup(); render(<Example drawer />);
  await user.click(screen.getByRole("button", { name: "工作台助手" }));
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog", { name: "工作台助手" })).toBeNull();
  expect(screen.getByRole("dialog", { name: "邀请新老师" })).toBeTruthy();
});

it("keeps Tab inside the panel while a Drawer is open", async () => {
  const user = userEvent.setup(); render(<Example drawer />);
  await user.click(screen.getByRole("button", { name: "工作台助手" }));
  expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "提问" }));
  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "问助手" }));
});

it("moves with a header drag but not from a header control", async () => {
  const user = userEvent.setup(); render(<Example />);
  await user.click(screen.getByRole("button", { name: "工作台助手" }));
  const panel = screen.getByRole("dialog", { name: "工作台助手" });
  const title = screen.getByRole("heading", { name: "工作台助手" });
  fireEvent.pointerDown(screen.getByRole("button", { name: "新问题" }), { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
  fireEvent.pointerMove(title, { pointerId: 1, clientX: 210, clientY: 110 });
  expect(panel.style.left).toBe("");
  fireEvent.pointerDown(title, { button: 0, pointerId: 2, clientX: 10, clientY: 10 });
  fireEvent.pointerMove(title, { pointerId: 2, clientX: 210, clientY: 110 });
  fireEvent.pointerUp(title, { pointerId: 2 });
  expect([panel.style.left, panel.style.top]).toEqual(["200px", "100px"]);
});
