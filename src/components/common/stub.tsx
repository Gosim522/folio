import { Construction } from "lucide-react";

export function StubPanel({ note }: { note?: string }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Construction className="size-5" strokeWidth={1.8} />
      </div>
      <div className="space-y-1 px-6">
        <p className="font-medium">준비 중</p>
        <p className="text-sm text-muted-foreground">
          {note ?? "이 페이지는 곧 작업할 예정이에요."}
        </p>
      </div>
    </div>
  );
}
