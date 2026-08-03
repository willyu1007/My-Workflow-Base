/**
 * <ListView> behaviour — the cross-cutting concerns it owns so every List gets
 * them identically: filtering, the load-more window, and the empty state.
 *
 * The presentation is deliberately a prop, so these tests render items as plain
 * text. What is being held is the container's logic, not how a card looks.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ListView, type ListFilter } from "../src/components/list-view.js";

interface Item {
  readonly id: string;
  readonly done: boolean;
}

const items: Item[] = [
  { id: "1", done: true },
  { id: "2", done: false },
  { id: "3", done: false },
  { id: "4", done: true },
  { id: "5", done: false },
];

const filters: ListFilter<Item>[] = [
  { key: "all", label: "全部" },
  { key: "open", label: "进行中", predicate: (i) => !i.done },
  { key: "done", label: "已完成", predicate: (i) => i.done },
];

const present = (shown: readonly Item[]) => (
  <ul>
    {shown.map((i) => (
      <li key={i.id}>项 {i.id}</li>
    ))}
  </ul>
);

const shownIds = (): string[] =>
  screen.queryAllByRole("listitem").map((li) => li.textContent?.replace("项 ", "") ?? "");

const openFilterMenu = async (): Promise<void> => {
  await userEvent.click(screen.getByRole("button", { name: /筛选/ }));
};

describe("filtering", () => {
  it("shows everything under the first filter", () => {
    render(<ListView items={items} filters={filters} present={present} empty={{ title: "空" }} />);
    expect(shownIds()).toEqual(["1", "2", "3", "4", "5"]);
  });

  it("narrows to the chosen filter's predicate", async () => {
    render(<ListView items={items} filters={filters} present={present} empty={{ title: "空" }} />);

    await openFilterMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /进行中/ }));

    expect(shownIds()).toEqual(["2", "3", "5"]);
  });

  it("counts each filter against the FULL list, not the current view", async () => {
    // Counts must not compound: after filtering to 进行中, 已完成 still says 2.
    render(<ListView items={items} filters={filters} present={present} empty={{ title: "空" }} />);

    await openFilterMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /进行中/ }));
    await openFilterMenu();

    expect(screen.getByRole("menuitem", { name: /已完成/ }).textContent).toContain("2");
  });

  it("shows the empty state when a filter matches nothing", async () => {
    render(
      <ListView
        items={[{ id: "1", done: true }]}
        filters={filters}
        present={present}
        empty={{ title: "没有结果", desc: "换个筛选试试" }}
      />,
    );

    await openFilterMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /进行中/ }));

    expect(screen.getByText("没有结果")).toBeDefined();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});

describe("load more", () => {
  it("caps the first page and reveals another on click", async () => {
    render(
      <ListView items={items} pageSize={2} present={present} empty={{ title: "空" }} />,
    );
    expect(shownIds()).toEqual(["1", "2"]);

    await userEvent.click(screen.getByRole("button", { name: "加载更多" }));

    expect(shownIds()).toEqual(["1", "2", "3", "4"]);
  });

  it("hides the button once everything is shown", async () => {
    render(<ListView items={items} pageSize={4} present={present} empty={{ title: "空" }} />);

    await userEvent.click(screen.getByRole("button", { name: "加载更多" }));

    expect(shownIds()).toHaveLength(5);
    expect(screen.queryByRole("button", { name: "加载更多" })).toBeNull();
  });

  it("shows everything and no button when pageSize is omitted", () => {
    render(<ListView items={items} present={present} empty={{ title: "空" }} />);
    expect(shownIds()).toHaveLength(5);
    expect(screen.queryByRole("button", { name: "加载更多" })).toBeNull();
  });

  it("resets the window when the filter changes", async () => {
    // Without the reset, switching filters keeps the expanded count and the new
    // filter opens already scrolled past its first page.
    render(
      <ListView items={items} filters={filters} pageSize={2} present={present} empty={{ title: "空" }} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "加载更多" }));
    expect(shownIds()).toHaveLength(4);

    await openFilterMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /进行中/ }));

    expect(shownIds()).toEqual(["2", "3"]);
  });
});

describe("presentation", () => {
  it("hands the presenter the filtered and capped items only", async () => {
    const present = vi.fn((shown: readonly Item[]) => <span>{shown.length}</span>);
    render(
      <ListView
        items={items}
        filters={filters}
        pageSize={2}
        present={present}
        empty={{ title: "空" }}
      />,
    );

    await openFilterMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /进行中/ }));

    // 3 match the predicate, capped to the 2-item page.
    expect(present.mock.calls.at(-1)?.[0].map((i) => i.id)).toEqual(["2", "3"]);
  });
});
