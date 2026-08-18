/**
 * <Hub>'s two scene-toolbar menus, and specifically which edge each opens from.
 *
 * The scope filter sits in `Scene`'s left `filters` slot and the quick-actions
 * menu in its right `actions` slot, whose contract says "right-aligned in the
 * scene bar". A right-anchored popover that opens rightward runs off the
 * viewport — which is exactly what shipped, because the quick menu was written
 * by copying the scope filter and its `align` came along.
 *
 * Nothing caught it, so this holds the pairing rather than the fix.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Hub } from "../src/components/hub.js";
import type { WorkflowModule } from "../src/contracts/dashboard.js";

const modules: WorkflowModule[] = [
  {
    key: "work",
    label: "作业",
    accent: "accent",
    stats: [],
    attention: [],
    highlights: [],
    quickActions: [{ href: "/new", label: "新建作业", icon: null }],
  },
  {
    key: "insight",
    label: "学情",
    accent: "accent",
    stats: [],
    attention: [],
    highlights: [],
    quickActions: [{ href: "/insights", label: "学情观察", icon: null }],
  },
];

const popover = (): HTMLElement => {
  const el = document.querySelector(".wb-menu2__pop");
  if (!(el instanceof HTMLElement)) throw new Error("no menu popover is open");
  return el;
};

describe("Hub scene-toolbar menus", () => {
  it("opens the quick-actions menu from the right edge", async () => {
    render(<Hub modules={modules} />);
    await userEvent.click(screen.getByRole("button", { name: "快捷入口" }));

    // `--end` is `right: 0`; `--start` is `left: 0` and would push a
    // right-anchored popover off-screen.
    expect(popover().className).toContain("wb-menu2__pop--end");
    expect(popover().className).not.toContain("wb-menu2__pop--start");
    expect(screen.getByRole("menuitem", { name: "新建作业" })).toBeTruthy();
  });

  it("keeps the left-slot scope filter opening from the left edge", async () => {
    render(<Hub modules={modules} />);
    await userEvent.click(screen.getByRole("button", { name: "按工作流筛选" }));

    expect(popover().className).toContain("wb-menu2__pop--start");
  });
});
