/**
 * <Queue> behaviour. The paradigm's iron rules are the thing worth testing here,
 * because the component exists to make them unreachable to get wrong:
 * rows never cards, a trailing action button, and the action opening a right
 * Drawer rather than navigating away.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Queue } from "../src/components/queue.js";

interface Item {
  readonly id: string;
  readonly name: string;
}

const items: Item[] = [
  { id: "a", name: "作业一" },
  { id: "b", name: "作业二" },
];

const empty = { title: "没有待办", desc: "都处理完了" };

function renderQueue(
  overrides: Partial<Parameters<typeof Queue<Item>>[0]> = {},
): { readonly drawerBody: ReturnType<typeof vi.fn> } {
  const drawerBody = vi.fn();
  render(
    <Queue<Item>
      items={items}
      rowKey={(i) => i.id}
      toRow={(i) => ({ title: i.name })}
      actionLabel={() => "批改"}
      drawer={(i, close) => {
        drawerBody(i.id);
        return {
          title: `批改 ${i.name}`,
          body: (
            <button type="button" onClick={close}>
              完成
            </button>
          ),
        };
      }}
      empty={empty}
      {...overrides}
    />,
  );
  return { drawerBody };
}

describe("the queue shape", () => {
  it("gives every item a trailing action button", () => {
    renderQueue();
    expect(screen.getAllByRole("button", { name: "批改" })).toHaveLength(2);
  });

  it("shows the empty state instead of an empty frame", () => {
    render(
      <Queue<Item>
        items={[]}
        rowKey={(i) => i.id}
        toRow={(i) => ({ title: i.name })}
        actionLabel={() => "批改"}
        drawer={() => ({ title: "", body: null })}
        empty={empty}
      />,
    );
    expect(screen.getByText("没有待办")).toBeDefined();
    expect(screen.queryByRole("button", { name: "批改" })).toBeNull();
  });
});

describe("acting on an item", () => {
  it("opens a drawer rather than navigating", async () => {
    renderQueue();
    expect(screen.queryByRole("dialog")).toBeNull();

    await userEvent.click(screen.getAllByRole("button", { name: "批改" })[0]!);

    const drawer = screen.getByRole("dialog");
    expect(drawer.getAttribute("aria-modal")).toBe("true");
    expect(screen.getByText("批改 作业一")).toBeDefined();
  });

  it("opens the drawer for the row that was clicked, not the first", async () => {
    const { drawerBody } = renderQueue();

    await userEvent.click(screen.getAllByRole("button", { name: "批改" })[1]!);

    expect(screen.getByText("批改 作业二")).toBeDefined();
    expect(drawerBody).toHaveBeenLastCalledWith("b");
  });

  it("closes via the callback handed to the drawer", async () => {
    renderQueue();
    await userEvent.click(screen.getAllByRole("button", { name: "批改" })[0]!);
    expect(screen.getByRole("dialog")).toBeDefined();

    await userEvent.click(screen.getByRole("button", { name: "完成" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("closes on Escape", async () => {
    renderQueue();
    await userEvent.click(screen.getAllByRole("button", { name: "批改" })[0]!);

    await userEvent.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("reopens with the newly chosen item after closing", async () => {
    // Guards a stale-selection bug: close then open another row must not show
    // the first row's drawer.
    renderQueue();
    await userEvent.click(screen.getAllByRole("button", { name: "批改" })[0]!);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    await userEvent.click(screen.getAllByRole("button", { name: "批改" })[1]!);

    expect(screen.getByText("批改 作业二")).toBeDefined();
  });
});
