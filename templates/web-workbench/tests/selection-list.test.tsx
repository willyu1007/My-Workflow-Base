import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { SelectionList } from "../src/components/selection-list.js";

it("BA-41 selection-list focus skips disabled options and only activation selects", async () => {
  const user = userEvent.setup();
  const select = vi.fn();
  render(<SelectionList label="安排" selectedId="a" onSelect={select} empty="暂无安排" items={[
    { id: "a", title: "第一项", summary: "范围一" },
    { id: "b", title: "暂停项", disabled: true },
    { id: "c", title: "最后一项", summary: "范围三" },
  ]} />);

  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole("option", { name: "第一项 范围一" }));
  await user.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(screen.getByRole("option", { name: "最后一项 范围三" }));
  expect(select).not.toHaveBeenCalled();
  await user.keyboard("{Enter}");
  expect(select).toHaveBeenCalledExactlyOnceWith("c");
  // Selection is controlled by the consumer, not by keyboard focus.
  expect(screen.getByRole("option", { name: "第一项 范围一", selected: true })).toBeTruthy();
  await user.keyboard("{Home} ");
  expect(select).toHaveBeenLastCalledWith("a");
});

it("BA-43 disabling the focused option recovers focus without selecting a value", async () => {
  const user = userEvent.setup();
  const select = vi.fn();
  const props = { label: "安排", selectedId: "a", onSelect: select, empty: "暂无安排" };
  const view = render(<SelectionList {...props} items={[{ id: "a", title: "第一项" }, { id: "b", title: "第二项" }]} />);
  await user.tab();
  view.rerender(<SelectionList {...props} items={[{ id: "a", title: "第一项", disabled: true }, { id: "b", title: "第二项" }]} />);
  expect(document.activeElement).toBe(screen.getByRole("option", { name: "第二项" }));
  expect(select).not.toHaveBeenCalled();
  view.rerender(<SelectionList {...props} items={[]} />);
  expect(document.activeElement).toBe(screen.getByRole("listbox", { name: "安排" }));
  view.rerender(<SelectionList {...props} items={[{ id: "a", title: "第一项" }]} />);
  expect(document.activeElement).toBe(screen.getByRole("option", { name: "第一项" }));
  expect(select).not.toHaveBeenCalled();
});
