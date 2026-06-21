/**
 * Toast — the host notification chrome. `notify()` pushes a toast (auto-closes
 * 3.8s, errors 6s); `run()` wraps an async action (busy → success / error). Tones
 * map to the wb-toast palette. Provide once near the app root (wrap your shell),
 * then call `useToast()` anywhere below it.
 *
 * NB: provide this OUTSIDE <AppShell> if your nav callbacks (onSwitch / add.onClick)
 * toast — they need useToast() in scope, so AppShell deliberately does not embed it.
 */
"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { IconAlert, IconCheck, IconClock, IconX } from "./icons";

export type ToastTone = "info" | "success" | "error" | "busy";

interface Toast {
  readonly id: number;
  readonly tone: ToastTone;
  readonly title: string;
  readonly msg?: string;
}

export interface ToastApi {
  notify: (tone: ToastTone, title: string, msg?: string) => void;
  /**
   * Show a busy toast, run `fn`, then resolve to success or error. Labels default
   * to Chinese ("操作已完成" / "操作失败"); override via `opts` for i18n / custom copy.
   */
  run: <T>(
    busyTitle: string,
    fn: () => Promise<T>,
    opts?: { readonly successMsg?: string; readonly errorTitle?: string },
  ) => Promise<T | undefined>;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { readonly children: ReactNode }): React.ReactElement {
  const [toasts, setToasts] = useState<readonly Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (tone: ToastTone, title: string, msg?: string, autoClose = true): number => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, tone, title, ...(msg ? { msg } : {}) }]);
      if (autoClose) {
        setTimeout(() => dismiss(id), tone === "error" ? 6000 : 3800);
      }
      return id;
    },
    [dismiss],
  );

  const notify = useCallback(
    (tone: ToastTone, title: string, msg?: string) => {
      push(tone, title, msg);
    },
    [push],
  );

  const run = useCallback(
    async <T,>(
      busyTitle: string,
      fn: () => Promise<T>,
      opts?: { readonly successMsg?: string; readonly errorTitle?: string },
    ): Promise<T | undefined> => {
      const busyId = push("busy", busyTitle, undefined, false);
      try {
        const result = await fn();
        dismiss(busyId);
        push("success", busyTitle, opts?.successMsg ?? "操作已完成");
        return result;
      } catch (error) {
        dismiss(busyId);
        const msg = error instanceof Error ? error.message : "操作失败";
        push("error", opts?.errorTitle ?? "操作失败", msg);
        return undefined;
      }
    },
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={{ notify, run, dismiss }}>
      {children}
      <div className="wb-toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <ToastView key={t.id} toast={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastView({ toast, onClose }: { readonly toast: Toast; readonly onClose: () => void }) {
  return (
    <div className={`wb-toast wb-toast--${toast.tone}`}>
      <span className="wb-toast__icon">
        {toast.tone === "success" ? (
          <IconCheck size={16} style={{ color: "var(--mt-success)" }} />
        ) : toast.tone === "error" ? (
          <IconAlert size={16} style={{ color: "var(--mt-danger)" }} />
        ) : (
          <IconClock size={16} style={{ color: "var(--mt-warning)" }} />
        )}
      </span>
      <div className="wb-toast__body">
        <div className="wb-toast__title">{toast.title}</div>
        {toast.msg && <div className="wb-toast__msg">{toast.msg}</div>}
      </div>
      <button type="button" className="wb-iconbtn" onClick={onClose} aria-label="关闭">
        <IconX size={15} />
      </button>
    </div>
  );
}
