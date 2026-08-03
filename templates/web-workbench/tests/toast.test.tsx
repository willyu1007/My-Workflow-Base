/**
 * <ToastProvider> / useToast behaviour.
 *
 * Fake timers throughout: the auto-close windows are 3.8s and 6s, and a suite
 * that actually waits them out is a suite nobody runs. The tone-dependent delay
 * is itself worth holding — an error that vanishes as fast as a success is a
 * real defect, and it is invisible without controlling the clock.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider, useToast, type ToastApi } from "../src/components/toast.js";

let api: ToastApi;

function Probe(): React.ReactElement {
  api = useToast();
  return <div />;
}

const renderProvider = () =>
  render(
    <ToastProvider>
      <Probe />
    </ToastProvider>,
  );

/** Advance the fake clock inside act, so React flushes the resulting state. */
const advance = async (ms: number): Promise<void> => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("notify", () => {
  it("shows a toast in a polite live region", async () => {
    renderProvider();

    await act(async () => api.notify("info", "已保存"));

    expect(screen.getByText("已保存")).toBeDefined();
    const region = screen.getByRole("status");
    expect(region.getAttribute("aria-live")).toBe("polite");
  });

  it("stacks several rather than replacing", async () => {
    renderProvider();

    await act(async () => {
      api.notify("info", "第一条");
      api.notify("info", "第二条");
    });

    expect(screen.getByText("第一条")).toBeDefined();
    expect(screen.getByText("第二条")).toBeDefined();
  });

  it("auto-closes a normal toast after 3.8s", async () => {
    renderProvider();
    await act(async () => api.notify("success", "完成"));

    await advance(3799);
    expect(screen.queryByText("完成")).not.toBeNull();

    await advance(2);
    expect(screen.queryByText("完成")).toBeNull();
  });

  it("keeps an error up longer than a success", async () => {
    renderProvider();
    await act(async () => {
      api.notify("success", "成功了");
      api.notify("error", "失败了");
    });

    await advance(3801);

    // The success is gone; the error has 6s, so it must still be readable.
    expect(screen.queryByText("成功了")).toBeNull();
    expect(screen.queryByText("失败了")).not.toBeNull();

    await advance(2200);
    expect(screen.queryByText("失败了")).toBeNull();
  });

  it("can be dismissed by the user before it expires", async () => {
    renderProvider();
    await act(async () => api.notify("info", "可关闭"));

    // fireEvent, not userEvent: userEvent schedules its own inter-event delays
    // on the timer queue, which fake timers never advance unless the test drives
    // them — the click then never lands and the test times out instead of
    // failing. A plain click needs none of that machinery.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    });

    expect(screen.queryByText("可关闭")).toBeNull();
  });
});

describe("run", () => {
  it("shows a busy toast that does not auto-close while in flight", async () => {
    renderProvider();
    let finish: (v: string) => void = () => {};
    const work = new Promise<string>((resolve) => {
      finish = resolve;
    });

    act(() => {
      void api.run("提交中", () => work);
    });
    expect(screen.getByText("提交中")).toBeDefined();

    // A busy toast is pushed with autoClose off — it must survive past the
    // window that would have closed a normal one.
    await advance(7000);
    expect(screen.queryByText("提交中")).not.toBeNull();

    await act(async () => {
      finish("ok");
      await work;
    });
  });

  it("replaces busy with success and returns the value", async () => {
    renderProvider();
    let result: string | undefined;

    await act(async () => {
      result = await api.run("提交中", () => Promise.resolve("值"));
    });

    expect(result).toBe("值");
    expect(screen.getByText("操作已完成")).toBeDefined();
  });

  it("replaces busy with the error message and resolves undefined", async () => {
    renderProvider();
    let result: string | undefined = "unset";

    await act(async () => {
      result = await api.run("提交中", () => Promise.reject(new Error("409 冲突")));
    });

    // run() swallows deliberately — the toast IS the error report — so callers
    // must be able to tell failure from success by the undefined.
    expect(result).toBeUndefined();
    expect(screen.getByText("409 冲突")).toBeDefined();
    expect(screen.queryByText("提交中")).toBeNull();
  });

  it("uses the supplied labels over the defaults", async () => {
    renderProvider();

    await act(async () => {
      await api.run("导出中", () => Promise.resolve(1), { successMsg: "已导出 3 份" });
    });

    expect(screen.getByText("已导出 3 份")).toBeDefined();
    expect(screen.queryByText("操作已完成")).toBeNull();
  });
});

describe("provider boundary", () => {
  it("fails loudly when useToast is called outside a provider", () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    // A silent no-op here would mean a host wires toasts, sees nothing, and has
    // no way to tell the provider is missing.
    expect(() => render(<Probe />)).toThrow(/ToastProvider/);
    quiet.mockRestore();
  });
});
