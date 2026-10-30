/**
 * <Queue> behaviour. The paradigm's iron rules are the thing worth testing here,
 * because the component exists to make them unreachable to get wrong:
 * rows never cards, a trailing action button, and the action opening a right
 * Drawer rather than navigating away.
 */
import { render,screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe,expect,it,vi } from "vitest";
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

describe("acting on an item", () => {

  it("BA-35 点击 Queue 第二行打开第二行，而非首行", async () => {
    const { drawerBody } = renderQueue();

    await userEvent.click(screen.getAllByRole("button", { name: "批改" })[1]!);

    expect(screen.getByText("批改 作业二")).toBeDefined();
    expect(drawerBody).toHaveBeenLastCalledWith("b");
  });
});
