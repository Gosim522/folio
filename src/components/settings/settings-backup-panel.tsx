"use client";

import { Check, Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import {
  downloadSettings,
  importSettingsFile,
} from "@/lib/settings-backup";
import { cn } from "@/lib/utils";

type Status = "idle" | "exported" | "imported" | "error";

/**
 * Export/import all preferences as a JSON file. Lets users carry their layout,
 * widgets, theme and keys across devices or app updates.
 */
export function SettingsBackupPanel() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  function handleExport() {
    downloadSettings();
    setStatus("exported");
    window.setTimeout(() => setStatus("idle"), 2500);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const ok = await importSettingsFile(file);
    if (ok) {
      setStatus("imported");
      // Reload so every widget/panel picks up the restored prefs cleanly.
      window.setTimeout(() => window.location.reload(), 700);
    } else {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          <Download className="size-4" strokeWidth={1.8} />
          내보내기
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          <Upload className="size-4" strokeWidth={1.8} />
          가져오기
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      <p
        className={cn(
          "flex items-center gap-1.5 text-xs",
          status === "error" ? "text-neg" : "text-muted-foreground",
        )}
      >
        {status === "exported" ? (
          <>
            <Check className="size-3.5 text-pos" strokeWidth={2.4} />
            설정 파일을 저장했어요.
          </>
        ) : status === "imported" ? (
          <>
            <Check className="size-3.5 text-pos" strokeWidth={2.4} />
            복원 완료 — 새로고침 중…
          </>
        ) : status === "error" ? (
          "올바른 Folio 설정 파일이 아니에요."
        ) : (
          "위젯·레이아웃·테마·키 등 모든 설정을 파일 하나로 백업/복원합니다."
        )}
      </p>
    </div>
  );
}
