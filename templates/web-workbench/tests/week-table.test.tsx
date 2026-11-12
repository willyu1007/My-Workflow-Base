import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { WeekTable, type WeekTableProps } from "../src/components/week-table.js";

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

it("covers the grid with combined row and column spans without rendering covered cells", () => {
  render(<WeekTable label="合并安排" rowHeading="时间段" days={days} navigation={{previous: {onPress() {}}, next: {onPress() {}}}}
    rows={[
      {id: "a", heading: "第一段", cells: [{date: days[0].date, rowSpan: 3, span: 2, content: "长活动"}, {date: days[2].date, span: 5, content: "其余"}]},
      {id: "b", heading: "第二段", cells: [{date: days[2].date, span: 5, content: "中间"}]},
      {id: "c", heading: "第三段", cells: [{date: days[2].date, span: 5, content: "末段"}]},
    ]} />);
  const merged = screen.getByRole("cell", {name: "长活动"});
  expect(merged.getAttribute("rowspan")).toBe("3");
  expect(merged.getAttribute("colspan")).toBe("2");
  expect(screen.getAllByRole("cell")).toHaveLength(4);
});

it.each([0, -1, 1.5, 3])("rejects rowSpan %s outside the actual row bounds", rowSpan => {
  expect(() => render(<WeekTable label="无效" rowHeading="时间段" days={days} navigation={{previous: {onPress() {}}, next: {onPress() {}}}}
    rows={[{id: "a", heading: "一段", cells: [{date: days[0].date, span: 7, rowSpan, content: "越界"}]}]} />)).toThrow(/WeekTable/);
});

it("rejects a cell that overlaps a covered column on a later row", () => {
  expect(() => render(<WeekTable label="重叠" rowHeading="时间段" days={days} navigation={{previous: {onPress() {}}, next: {onPress() {}}}}
    rows={[
      {id: "a", heading: "一", cells: [{date: days[0].date, content: "a"}, {date: days[1].date, rowSpan: 2, content: "b"}, {date: days[2].date, span: 5, content: "c"}]},
      {id: "b", heading: "二", cells: [{date: days[0].date, span: 7, content: "错误"}]},
    ]} />)).toThrow(/WeekTable/);
});

it("allows the range to open a week picker while hiding weekday numbers", async () => {
  const open = vi.fn(), user = userEvent.setup();
  render(<WeekTable label="选择周" rowHeading="时间段" days={days} showDayNumbers={false}
    navigation={{previous: {onPress() {}}, next: {onPress() {}}, range: {onPress: open}}} rows={[]} />);
  expect(screen.getByRole("columnheader", {name: "周日"})).toBeTruthy();
  await user.click(screen.getByRole("button", {name: "选择周 · 2026年12月28日–2027年1月3日"}));
  expect(open).toHaveBeenCalledOnce();
});

it("renders only the controlled outer edges of a range and preserves its native editor", async () => {
  const press = vi.fn(), user = userEvent.setup();
  const rows: WeekTableProps["rows"] = [
    {id: "first", heading: "第一段", cells: [{date: days[0].date, selected: true, selectionEdges: ["top", "left", "right"], content: "范围首格"}, {date: days[1].date, span: 6, content: "一"}]},
    {id: "middle", heading: "第二段", cells: [{date: days[0].date, selected: true, selectionEdges: ["left", "right"], content: <button onClick={press}>范围中格</button>}, {date: days[1].date, span: 6, content: "二"}]},
    {id: "last", heading: "第三段", cells: [{date: days[0].date, selected: true, selectionEdges: ["bottom", "left", "right"], content: "范围末格"}, {date: days[1].date, span: 6, content: "三"}]},
  ];
  const table = (items: WeekTableProps["rows"]) => <WeekTable label="选区" rowHeading="时间段" days={days}
    navigation={{previous: {onPress() {}}, next: {onPress() {}}}} rows={items}/>;
  const {rerender} = render(table(rows));
  expect(screen.getByRole("cell", {name: "范围首格"}).getAttribute("data-selection-edges")).toBe("top left right");
  expect(screen.getByRole("cell", {name: "范围中格"}).getAttribute("data-selection-edges")).toBe("left right");
  expect(screen.getByRole("cell", {name: "范围末格"}).getAttribute("data-selection-edges")).toBe("bottom left right");
  await user.click(screen.getByRole("button", {name: "范围中格"}));
  expect(press).toHaveBeenCalledOnce();
  expect(document.activeElement).toBe(screen.getByRole("button", {name: "范围中格"}));
  rerender(table(rows.map(row => row.id === "middle" ? {...row, cells: row.cells.map((cell, index) => index ? cell : {...cell, selected: false})} : row)));
  expect(screen.getByRole("cell", {name: "范围中格"}).getAttribute("data-selection-edges")).toBeNull();
  expect(screen.getByRole("cell", {name: "范围首格"}).getAttribute("data-selection-edges")).toBe("top left right");
});
