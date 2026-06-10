"use client";

import { RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type FolioDesktop = {
  isDesktop?: boolean;
  onUpdateReady?: (cb: (version: string) => void) => void;
  restartToUpdate?: () => void;
};

function desktopApi(): FolioDesktop | undefined {
  return (window as unknown as { folioDesktop?: FolioDesktop }).folioDesktop;
}

/**
 * Shows a banner when the Electron auto-updater has finished downloading a new
 * version, with a "지금 재시작" button. Renders nothing in the browser (no
 * `folioDesktop` bridge) and when no update is pending.
 */
export function UpdateBanner() {
  const [version, setVersion] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // onUpdateReady's callback fires on an IPC event (post-mount), so this is
    // not a synchronous setState-in-effect.
    desktopApi()?.onUpdateReady?.((v) => setVersion(v || ""));
  }, []);

  if (version === null || dismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-3 border-t border-foreground/10 bg-foreground px-4 py-2.5 text-background shadow-lg">
      <RefreshCw className="size-4 shrink-0" strokeWidth={2} />
      <span className="text-sm font-medium">
        새 버전{version ? ` v${version}` : ""}이 준비됐어요 — 재시작하면
        적용됩니다.
      </span>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => desktopApi()?.restartToUpdate?.()}
      >
        지금 재시작
      </Button>
      <button
        type="button"
        aria-label="닫기"
        onClick={() => setDismissed(true)}
        className="rounded-md p-1 text-background/70 transition-colors hover:bg-background/10 hover:text-background"
      >
        <X className="size-4" strokeWidth={2} />
      </button>
    </div>
  );
}
