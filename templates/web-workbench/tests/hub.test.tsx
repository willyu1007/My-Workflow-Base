/**
 * <Hub>'s workflow filter, which is the stat-row labels themselves.
 *
 * Two things are held here. The strip always shows every workflow, because it
 * is the overview and filtering is meant to narrow the content below it rather
 * than hide half the numbers. And the control that narrows is the one that
 * restores: selecting the active workflow again clears the filter, since after
 * the scene toolbar was removed there is no other way back.
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Hub } from "../src/components/hub.js";
import type { WorkflowModule } from "../src/contracts/dashboard.js";

const modules: WorkflowModule[] = [
  {
    key: "work",
    label: "作业",
    accent: "accent",
    stats: [{ label: "待批改", value: 2 }],
    attention: [
      {
        id: "a",
        href: "/a",
        cta: "去批改",
        title: "2 份作答待批改",
        detail: "新提交的作答尚未生成批改结果。",
        workflow: "作业",
        tone: "accent",
      },
    ],
    highlights: [],
  },
  {
    key: "insight",
    label: "学情",
    accent: "info",
    stats: [{ label: "学情报告", value: 2 }],
    attention: [
      {
        id: "b",
        href: "/b",
        cta: "去查看",
        title: "2 份学情报告待查看",
        detail: "作业分析已生成。",
        workflow: "学情",
        tone: "info",
      },
    ],
    highlights: [],
  },
];

const labelButton = (name: string): HTMLElement =>
  screen.getByRole("button", { name: new RegExp(name) });

describe("Hub workflow filter", () => {
  it("narrows the content but never the stat strip", async () => {
    render(<Hub modules={modules} />);
    await userEvent.click(labelButton("作业"));

    // Both rows still stand; the numbers are the overview.
    expect(labelButton("作业")).toBeTruthy();
    expect(labelButton("学情")).toBeTruthy();
    expect(screen.getByText("学情报告")).toBeTruthy();

    // The content below is the part that narrowed.
    expect(screen.getByText("2 份作答待批改")).toBeTruthy();
    expect(screen.queryByText("2 份学情报告待查看")).toBeNull();
  });

  it("marks the selected label and only that one", async () => {
    render(<Hub modules={modules} />);
    await userEvent.click(labelButton("作业"));

    // The state is a fill on the selected label, not a lightness step across
    // the others: `--fg-1` against `--fg-2` is 2.29:1 and reads as no change.
    expect(labelButton("作业").getAttribute("aria-pressed")).toBe("true");
    expect(labelButton("作业").className).toContain("--on");
    expect(labelButton("学情").getAttribute("aria-pressed")).toBe("false");
    expect(labelButton("学情").className).not.toContain("--on");
  });

  it("clears the filter when the active workflow is selected again", async () => {
    render(<Hub modules={modules} />);
    await userEvent.click(labelButton("作业"));
    expect(screen.queryByText("2 份学情报告待查看")).toBeNull();

    await userEvent.click(labelButton("作业"));
    expect(screen.getByText("2 份学情报告待查看")).toBeTruthy();
    // Nothing is marked once no workflow is selected.
    expect(labelButton("作业").className).not.toContain("--on");
    expect(labelButton("学情").className).not.toContain("--on");
  });

  it("tags attention rows only while several workflows are in view", async () => {
    render(<Hub modules={modules} />);
    const unfiltered = screen.getByText("2 份作答待批改").closest("a, div, li");
    expect(within(unfiltered as HTMLElement).queryByText("作业")).toBeTruthy();

    await userEvent.click(labelButton("作业"));
    const filtered = screen.getByText("2 份作答待批改").closest("a, div, li");
    expect(within(filtered as HTMLElement).queryByText("作业")).toBeNull();
  });
});
