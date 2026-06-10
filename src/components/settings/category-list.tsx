"use client";

import { Eye, EyeOff, Maximize2, RotateCcw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { WidgetPreviewDialog } from "@/components/settings/widget-preview-dialog";
import { GroupIcon } from "@/components/widgets/group-icon";
import { usePreference } from "@/hooks/use-preferences";
import { PREF_DEFAULTS, PREF_KEYS } from "@/lib/preferences";
import { WIDGETS, WIDGET_LABELS } from "@/lib/widgets/registry";
import type { GroupDef, WidgetId } from "@/lib/widgets/types";
import { cn } from "@/lib/utils";

export function CategoryList() {
  const [groups] = usePreference<GroupDef[]>(
    PREF_KEYS.widgetGroups,
    PREF_DEFAULTS.widgetGroups,
  );
  const [order] = usePreference<WidgetId[]>(
    PREF_KEYS.widgetOrder,
    PREF_DEFAULTS.widgetOrder,
  );
  const [hidden, setHidden] = usePreference<WidgetId[]>(
    PREF_KEYS.hiddenWidgets,
    PREF_DEFAULTS.hiddenWidgets,
  );
  const [previewId, setPreviewId] = useState<WidgetId | null>(null);

  const orderIdx = useMemo(() => {
    const m = new Map<WidgetId, number>();
    order.forEach((id, i) => m.set(id, i));
    return m;
  }, [order]);

  // Build display: each group with its widgets sorted by widgetOrder. Widgets
  // not yet a member of any saved group are auto-injected into their defaultGroup
  // (so newly added widgets surface where the user expects them).
  const sections = useMemo(() => {
    const assigned = new Set<WidgetId>();
    for (const g of groups) for (const w of g.widgets) assigned.add(w);
    return groups.map((g) => {
      const injected = WIDGETS.filter(
        (w) => w.defaultGroup === g.id && !assigned.has(w.id),
      ).map((w) => w.id);
      const widgets = [...g.widgets, ...injected].sort(
        (a, b) =>
          (orderIdx.get(a) ?? Number.MAX_SAFE_INTEGER) -
          (orderIdx.get(b) ?? Number.MAX_SAFE_INTEGER),
      );
      return { id: g.id, label: g.label, widgets };
    });
  }, [groups, orderIdx]);

  function toggleHidden(id: WidgetId) {
    setHidden((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {WIDGETS.length - hidden.length}개 표시 · {hidden.length}개 숨김
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setHidden(PREF_DEFAULTS.hiddenWidgets)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Sparkles className="size-3" strokeWidth={2} />
            추천 구성
          </button>
          {hidden.length > 0 ? (
            <button
              type="button"
              onClick={() => setHidden([])}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <RotateCcw className="size-3" strokeWidth={2} />
              모두 표시
            </button>
          ) : null}
        </div>
      </div>

      <p className="text-xs text-muted-foreground/80">
        위젯 이름을 누르면 미리보기가 떠요. 숨긴 위젯은 거기서 바로 추가할 수 있어요.
      </p>

      <div className="space-y-4">
        {sections.map((s) => (
          <section key={s.id} className="space-y-1.5">
            <div className="flex items-center gap-1.5 px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <GroupIcon groupId={s.id} className="size-3" strokeWidth={2} />
              <span>{s.label}</span>
            </div>
            {s.widgets.length === 0 ? (
              <p className="px-1 text-xs text-muted-foreground/70">위젯 없음</p>
            ) : (
              <ul className="space-y-1">
                {s.widgets.map((id) => {
                  const isHidden = hidden.includes(id);
                  return (
                    <li
                      key={id}
                      className={cn(
                        "group flex items-center gap-1 rounded-lg border border-border bg-card",
                        isHidden && "opacity-60",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewId(id)}
                        className="flex min-w-0 flex-1 items-center gap-2 rounded-l-lg py-1.5 pr-1 pl-3 text-left transition-colors hover:bg-muted"
                      >
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate text-sm",
                            isHidden &&
                              "text-muted-foreground line-through",
                          )}
                        >
                          {WIDGET_LABELS[id]}
                        </span>
                        <Maximize2
                          className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-70"
                          strokeWidth={2}
                        />
                      </button>
                      <button
                        type="button"
                        aria-label={isHidden ? "표시" : "숨김"}
                        aria-pressed={!isHidden}
                        onClick={() => toggleHidden(id)}
                        className="mr-1 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        {isHidden ? (
                          <EyeOff className="size-4" strokeWidth={1.8} />
                        ) : (
                          <Eye className="size-4" strokeWidth={1.8} />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))}
      </div>

      <WidgetPreviewDialog
        widgetId={previewId}
        groups={groups}
        isHidden={previewId !== null && hidden.includes(previewId)}
        onOpenChange={(open) => {
          if (!open) setPreviewId(null);
        }}
        onToggleHidden={toggleHidden}
      />
    </div>
  );
}
