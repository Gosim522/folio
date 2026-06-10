"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

/**
 * Manual refresh for the market treemap — re-runs the server render so the
 * heatmap picks up fresh quotes. A fallback for when the 60s auto-refresh
 * appears stuck.
 */
export function HeatmapRefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
      aria-label="시장 트리맵 새로고침"
      title="새로고침"
      className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60"
    >
      <RefreshCw
        className={cn("size-4", isPending && "animate-spin")}
        strokeWidth={1.8}
      />
    </button>
  );
}
