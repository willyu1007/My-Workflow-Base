/**
 * <Select> behaviour: the portaled popup and the keyboard listbox.
 *
 * fireEvent.click rather than userEvent.click for opening is deliberate: it
 * dispatches the click without focusing the button first, which is exactly what
 * Safari and Firefox on macOS do — the bug class where arrow keys go to the
 * document and the open listbox never moves. userEvent would focus on pointer
 * down and hide the defect.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Select } from "../src/components/select.js";
import { Drawer } from "../src/components/overlay.js";

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

describe("popup", () => {
  it("portals the listbox to <body> so overflow ancestors cannot clip it", () => {
    render(
      <div style={{ overflow: "auto" }}>
        <Select value="a" options={OPTIONS} onChange={() => {}} ariaLabel="选项" />
      </div>,
    );
    openByClick();

    const list = screen.getByRole("listbox");
    expect(list.parentElement).toBe(document.body);
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("closes on outside mousedown but not on mousedown inside the portaled list", () => {
    renderSelect();
    openByClick();

    fireEvent.mouseDown(screen.getByRole("listbox"));
    expect(screen.queryByRole("listbox")).not.toBeNull();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});

describe("keyboard", () => {
  it("focuses the trigger on open, even when the browser's click did not", () => {
    renderSelect();
    openByClick();

    // Without this, Safari/Firefox leave focus on <body> and every arrow key
    // press below would be lost.
    expect(document.activeElement).toBe(trigger());
  });

  it("moves the active option with the arrows and commits with Enter", () => {
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

  it("opens on ArrowDown with the selected option active", () => {
    render(<Select value="b" options={OPTIONS} onChange={() => {}} ariaLabel="选项" />);
    trigger().focus();
    fireEvent.keyDown(trigger(), { key: "ArrowDown" });

    expect(trigger().getAttribute("aria-activedescendant")).toBe(
      screen.getByRole("option", { name: "第二项" }).id,
    );
  });
});

describe("inside a Drawer", () => {
  it("Escape closes only the popup first, then the drawer", () => {
    const onClose = vi.fn();
    render(
      <Drawer open onClose={onClose} title="操作">
        <Select value="a" options={OPTIONS} onChange={() => {}} ariaLabel="选项" />
      </Drawer>,
    );
    openByClick();

    // The popup is the top transient surface — the drawer must survive.
    fireEvent.keyDown(trigger(), { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(trigger(), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ignores an Escape an inner surface already consumed (defaultPrevented)", () => {
    // Under Next's App Router React delegates from `document` — the same node
    // the drawer listens on — so stopPropagation cannot shield the drawer.
    // The contract is defaultPrevented; this dispatch path never calls
    // stopPropagation, so it fails if the drawer stops honoring it.
    const onClose = vi.fn();
    render(
      <Drawer open onClose={onClose} title="操作">
        <button type="button" onKeyDown={(e) => e.preventDefault()}>
          内层
        </button>
      </Drawer>,
    );

    fireEvent.keyDown(screen.getByRole("button", { name: "内层" }), { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
