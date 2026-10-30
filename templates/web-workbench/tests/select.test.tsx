/**
 * <Select> behaviour: the portaled popup and the keyboard listbox.
 *
 * fireEvent.click rather than userEvent.click for opening is deliberate: it
 * dispatches the click without focusing the button first, which is exactly what
 * Safari and Firefox on macOS do — the bug class where arrow keys go to the
 * document and the open listbox never moves. userEvent would focus on pointer
 * down and hide the defect.
 */
import { fireEvent,render,screen } from "@testing-library/react";
import { beforeAll,describe,expect,it,vi } from "vitest";
import { Select } from "../src/components/select.js";

beforeAll(() => {
  // jsdom has no layout; the component's scroll-follow only needs it to exist.
  Element.prototype.scrollIntoView = () => {};
});

const OPTIONS = [
  { value: "a", label: "第一项" },
  { value: "b", label: "第二项" },
  { value: "c", label: "第三项" },
];

const renderSelect = (onChange: (v: string) => void = () => {}) =>
  render(<Select value="a" options={OPTIONS} onChange={onChange} ariaLabel="选项" />);

const trigger = () => screen.getByRole("button", { name: "选项" });
const openByClick = () => fireEvent.click(trigger());

describe("keyboard", () => {

  it("BA-36 Select 可以使用方向键和 Enter 选择值", () => {
    const onChange = vi.fn();
    renderSelect(onChange);
    openByClick();

    fireEvent.keyDown(trigger(), { key: "ArrowDown" });
    fireEvent.keyDown(trigger(), { key: "ArrowDown" });
    const active = screen.getByRole("option", { name: "第三项" });
    expect(trigger().getAttribute("aria-activedescendant")).toBe(active.id);

    fireEvent.keyDown(trigger(), { key: "ArrowUp" });
    expect(trigger().getAttribute("aria-activedescendant")).toBe(
      screen.getByRole("option", { name: "第二项" }).id,
    );

    fireEvent.keyDown(trigger(), { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("b");
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
