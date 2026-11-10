"use client";

import type { ReactNode } from "react";
import { IconChevronRight } from "./icons.js";

export type WeekTableDay = Readonly<{
  date: string;
  narrow?: boolean;
  today?: boolean;
  annotation?: ReactNode;
  action?: ReactNode;
}>;
type WeekAction = Readonly<{ onPress: () => void; disabled?: boolean }>;
export type WeekTableProps = Readonly<{
  label: string;
  rowHeading: ReactNode;
  days: readonly WeekTableDay[];
  navigation: Readonly<{ previous: WeekAction; next: WeekAction; current?: WeekAction }>;
  context?: ReactNode;
  actions?: ReactNode;
  rows: readonly Readonly<{
    id: string;
    heading: ReactNode;
    accent?: boolean;
    cells: readonly Readonly<{
      date: string;
      span?: number;
      rowSpan?: number;
      tone?: "default" | "subtle" | "changed";
      selected?: boolean;
      /** Let a single editor root fill the cell; shared CSS supplies its spacing. */
      fill?: boolean;
      content: ReactNode;
    }>[];
  }>[];
  footer?: ReactNode;
  density?: "regular" | "compact";
}>;

const DAY_MS = 86_400_000;
const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"] as const;

/** Local dates are validated without using the machine's timezone or current date. */
function localDay(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("WeekTable requires valid YYYY-MM-DD dates");
  }
  return date;
}

function weekRange(dates: readonly Date[]): string {
  const first = dates[0]!;
  const last = dates[6]!;
  const start = `${first.getUTCMonth() + 1}月${first.getUTCDate()}日`;
  const end = `${last.getUTCMonth() + 1}月${last.getUTCDate()}日`;
  if (first.getUTCFullYear() !== last.getUTCFullYear()) return `${first.getUTCFullYear()}年${start}–${last.getUTCFullYear()}年${end}`;
  return `${start}–${first.getUTCMonth() === last.getUTCMonth() ? `${last.getUTCDate()}日` : end}`;
}

/** A seven-day presentation shell; consumers retain navigation, editors and writes. */
export function WeekTable({ label, rowHeading, days, navigation, context, actions, rows, footer, density = "regular" }: WeekTableProps) {
  if (days.length !== 7) throw new Error("WeekTable requires seven consecutive dates");
  const dates = days.map(day => localDay(day.date));
  if (dates.some((date, index) => date.getTime() !== dates[0]!.getTime() + index * DAY_MS)) {
    throw new Error("WeekTable requires seven consecutive dates");
  }
  const occupied = rows.map(() => Array<boolean>(7).fill(false));
  for (const [rowIndex, row] of rows.entries()) {
    let column = 0;
    for (const cell of row.cells) {
      while (occupied[rowIndex]![column]) column++;
      const columns = cell.span ?? 1, height = cell.rowSpan ?? 1;
      if (!Number.isInteger(columns) || columns < 1 || column + columns > 7 || days[column]?.date !== cell.date ||
        !Number.isInteger(height) || height < 1 || rowIndex + height > rows.length)
        throw new Error("WeekTable cells must cover the grid within its bounds");
      for (let r = rowIndex; r < rowIndex + height; r++) for (let c = column; c < column + columns; c++) {
        if (occupied[r]![c]) throw new Error("WeekTable cells must not overlap");
        occupied[r]![c] = true;
      }
      column += columns;
    }
    if (occupied[rowIndex]!.some(value => !value)) throw new Error("WeekTable cells must cover the seven dates in order");
  }
  const range = weekRange(dates);

  return <div className={`wb-week wb-week--${density}`}>
    <div className="wb-week__toolbar">
      <div className="wb-week__navigation" role="group" aria-label={`${label}周导航`}>
        <button type="button" className="wb-iconbtn wb-week__previous" aria-label="上一周"
          disabled={navigation.previous.disabled} onClick={navigation.previous.onPress}><IconChevronRight size={18} /></button>
        <strong className="wb-week__range">{range}</strong>
        <button type="button" className="wb-iconbtn" aria-label="下一周"
          disabled={navigation.next.disabled} onClick={navigation.next.onPress}><IconChevronRight size={18} /></button>
        {navigation.current && <button type="button" className="wb-action"
          disabled={navigation.current.disabled} onClick={navigation.current.onPress}>本周</button>}
      </div>
      {context}
      {actions && <div className="wb-week__actions">{actions}</div>}
    </div>
    <div className="wb-week__scroll">
      <table className="wb-week__table">
        <caption className="wb-week__caption">{label} · {range}</caption>
        <colgroup><col className="wb-week__heading-column" />{days.map(day => <col key={day.date}
          className={day.narrow ? "wb-week__narrow-column" : undefined} />)}</colgroup>
        <thead><tr><th scope="col">{rowHeading}</th>{days.map((day, index) => <th key={day.date} scope="col"
          aria-current={day.today ? "date" : undefined}>
          <div className="wb-week__day">
            <div className="wb-week__date"><span>{WEEKDAYS[dates[index]!.getUTCDay()]}</span>{" "}<time dateTime={day.date}>{dates[index]!.getUTCDate()}</time></div>
            {day.action != null && <> {day.action}</>}
          </div>
          {day.annotation}
        </th>)}</tr></thead>
        <tbody>{rows.map(row => <tr key={row.id} className={row.accent ? "wb-week__row--accent" : undefined}>
          <th scope="row">{row.heading}</th>
          {row.cells.map(cell => <td key={cell.date} colSpan={cell.span} rowSpan={cell.rowSpan}
            className={`wb-week__cell wb-week__cell--${cell.tone ?? "default"}${cell.selected ? " wb-week__cell--selected" : ""}${cell.fill ? " wb-week__cell--fill" : ""}`}>
            <div className="wb-week__content">{cell.content}</div>
          </td>)}
        </tr>)}</tbody>
        {footer != null && <tfoot><tr><td colSpan={8}>{footer}</td></tr></tfoot>}
      </table>
    </div>
  </div>;
}
