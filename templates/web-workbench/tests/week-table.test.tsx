import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { WeekTable } from "../src/components/week-table.js";

const days = [
  { date: "2026-12-28", action: <button type="button">更多</button> }, { date: "2026-12-29" }, { date: "2026-12-30" },
  { date: "2026-12-31" }, { date: "2027-01-01" },
  { date: "2027-01-02", narrow: true }, { date: "2027-01-03", narrow: true },
] as const;

it("BA-42 seven dates drive cross-year headings, native editors and navigation", async () => {
  const previous = vi.fn();
  const next = vi.fn();
  const user = userEvent.setup();
  render(<WeekTable label="周计划" rowHeading="环节" days={days}
    navigation={{ previous: { onPress: previous }, next: { onPress: next, disabled: true } }}
    rows={[{ id: "morning", heading: "上午", cells: [
      { date: "2026-12-28", content: <input aria-label="周一内容" defaultValue="绘本" /> },
      { date: "2026-12-29", span: 2, content: "合并活动" },
      { date: "2026-12-31", content: "绘画" },
      { date: "2027-01-01", content: "新年" },
      { date: "2027-01-02", span: 2, tone: "subtle", content: "休息" },
    ] }]} />);

  expect(screen.getByRole("table", { name: "周计划 · 2026年12月28日–2027年1月3日" })).toBeTruthy();
  expect(screen.getByRole("columnheader", { name: "周日 3" })).toBeTruthy();
  expect(screen.getByRole("columnheader", { name: "周一 28 更多" })).toBeTruthy();
  expect(screen.getByRole("cell", { name: "合并活动" }).getAttribute("colspan")).toBe("2");
  expect(screen.getByRole("textbox", { name: "周一内容" }).closest("button")).toBeNull();
  await user.click(screen.getByRole("button", { name: "下一周" }));
  expect(next).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "上一周" }));
  expect(previous).toHaveBeenCalledOnce();
});
