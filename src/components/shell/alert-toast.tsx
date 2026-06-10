"use client";

import { Bell, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { PriceAlert } from "@/lib/alerts/types";
import { cn } from "@/lib/utils";

/*
  가격 알림 발동 시 우상단에 쌓이는 토스트. PriceAlertWatcher 가 디스패치하는
  `folio:alert-triggered` 이벤트를 듣고, 6초 후 자동 사라짐. 클릭하면 즉시 닫힘.
*/

type Toast = {
  id: string;
  alert: PriceAlert;
  current: number;
};

const TOAST_TTL_MS = 6_000;

export function AlertToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const onTrigger = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { alert: PriceAlert; current: number }
        | undefined;
      if (!detail) return;
      const t: Toast = {
        id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        alert: detail.alert,
        current: detail.current,
      };
      setToasts((prev) => [...prev, t]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, TOAST_TTL_MS);
    };
    window.addEventListener("folio:alert-triggered", onTrigger);
    return () => window.removeEventListener("folio:alert-triggered", onTrigger);
  }, []);

  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed right-4 top-16 z-50 flex flex-col items-end gap-2">
      {toasts.map((t) => {
        const above = t.alert.direction === "above";
        return (
          <button
            key={t.id}
            type="button"
            onClick={() =>
              setToasts((prev) => prev.filter((x) => x.id !== t.id))
            }
            className={cn(
              "pointer-events-auto flex w-80 max-w-[90vw] items-start gap-3 rounded-xl border border-border bg-background p-3 text-left shadow-floating",
            )}
          >
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full",
                above ? "bg-pos-soft text-pos" : "bg-neg-soft text-neg",
              )}
            >
              <Bell className="size-4" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-semibold">
                  {t.alert.name}
                </span>
                <X
                  className="size-3.5 shrink-0 text-muted-foreground"
                  strokeWidth={2}
                />
              </div>
              <div
                className={cn(
                  "mt-0.5 text-xs tabular",
                  above ? "text-pos" : "text-neg",
                )}
              >
                목표 {above ? "상회" : "하회"} —{" "}
                {t.current.toLocaleString("ko-KR")} /{" "}
                {t.alert.targetPrice.toLocaleString("ko-KR")}{" "}
                {t.alert.market === "KR" ? "원" : "$"}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
