"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, GripVertical } from "lucide-react";
import { useMemo } from "react";
import { GroupIcon } from "@/components/widgets/group-icon";
import { useActiveSection } from "@/hooks/use-active-section";
import { useActiveWidget } from "@/hooks/use-active-widget";
import { usePreference } from "@/hooks/use-preferences";
import { PREF_DEFAULTS, PREF_KEYS } from "@/lib/preferences";
import { WIDGETS, WIDGET_LABELS } from "@/lib/widgets/registry";
import type { GroupDef, WidgetId } from "@/lib/widgets/types";
import { cn } from "@/lib/utils";

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  const fallback = document.querySelector<HTMLElement>(`[data-section="${id}"]`);
  if (fallback) fallback.scrollIntoView({ behavior: "smooth", block: "start" });
}

function EmptyGroupDropZone({ groupId }: { groupId: string }) {
  const { isOver, setNodeRef } = useDroppable({ id: `__empty:${groupId}` });
  return (
    <li
      ref={setNodeRef}
      className={cn(
        "rounded-md px-3 py-1.5 text-[12px] text-muted-foreground/70 transition-colors",
        isOver && "bg-sidebar-accent/60 text-foreground",
      )}
    >
      비어 있음 — 위젯을 드래그
    </li>
  );
}

function SidebarWidgetRow({
  id,
  active,
}: {
  id: WidgetId;
  active: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/sidebar-row relative flex items-center",
        isDragging && "z-10 opacity-90",
      )}
    >
      <a
        href={`#${id}`}
        onClick={(e) => {
          e.preventDefault();
          scrollToId(id);
        }}
        className={cn(
          "block flex-1 truncate rounded-r-md py-1 pl-3 pr-6 text-[13px] transition-colors",
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <span
          className={cn(
            "-ml-3 border-l-2 pl-3",
            active ? "border-foreground" : "border-transparent",
          )}
        >
          {WIDGET_LABELS[id] ?? id}
        </span>
      </a>
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`${WIDGET_LABELS[id]} 이동`}
        {...attributes}
        {...listeners}
        className={cn(
          "absolute right-1 top-1/2 -translate-y-1/2 cursor-grab touch-none rounded p-0.5 text-muted-foreground transition-opacity hover:text-foreground active:cursor-grabbing",
          "opacity-0 group-hover/sidebar-row:opacity-100",
          isDragging && "opacity-100",
        )}
      >
        <GripVertical className="size-3" strokeWidth={2} />
      </button>
    </li>
  );
}

export function SidebarNav() {
  const activeGroup = useActiveSection();
  const activeWidget = useActiveWidget();

  const [order, setOrder] = usePreference<WidgetId[]>(
    PREF_KEYS.widgetOrder,
    PREF_DEFAULTS.widgetOrder,
  );
  const [groups, setGroups] = usePreference<GroupDef[]>(
    PREF_KEYS.widgetGroups,
    PREF_DEFAULTS.widgetGroups,
  );
  const [hidden] = usePreference<WidgetId[]>(
    PREF_KEYS.hiddenWidgets,
    PREF_DEFAULTS.hiddenWidgets,
  );
  const [expanded, setExpanded] = usePreference<string[]>(
    PREF_KEYS.expandedGroups,
    PREF_DEFAULTS.expandedGroups,
  );

  const orderIdx = useMemo(() => {
    const m = new Map<string, number>();
    order.forEach((w, i) => m.set(w, i));
    return m;
  }, [order]);

  const sortedGroups = useMemo(() => {
    const assigned = new Set<WidgetId>();
    for (const g of groups) for (const w of g.widgets) assigned.add(w);
    return groups.map((g) => {
      const injected = WIDGETS.filter(
        (w) => w.defaultGroup === g.id && !assigned.has(w.id),
      ).map((w) => w.id);
      return {
        ...g,
        widgets: [...g.widgets, ...injected]
          .filter((w) => !hidden.includes(w))
          .sort(
            (a, b) =>
              (orderIdx.get(a) ?? Number.MAX_SAFE_INTEGER) -
              (orderIdx.get(b) ?? Number.MAX_SAFE_INTEGER),
          ),
      };
    });
  }, [groups, hidden, orderIdx]);

  const groupOfWidget = useMemo<Map<string, string>>(() => {
    const m = new Map<string, string>();
    for (const g of groups) {
      for (const w of g.widgets) m.set(w, g.id);
    }
    for (const w of WIDGETS) {
      if (!m.has(w.id)) m.set(w.id, w.defaultGroup);
    }
    return m;
  }, [groups]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  function toggleExpand(groupId: string) {
    setExpanded((prev) =>
      prev.includes(groupId)
        ? prev.filter((g) => g !== groupId)
        : [...prev, groupId],
    );
  }

  function jumpToGroup(g: GroupDef) {
    const first = g.widgets.find((w) => !hidden.includes(w));
    if (first) scrollToId(first);
  }

  function handleDragEnd(event: DragEndEvent) {
    const activeId = event.active.id as WidgetId;
    const rawOver = event.over?.id as string | undefined;
    if (!rawOver || activeId === rawOver) return;

    const sourceGroup = groupOfWidget.get(activeId);
    if (!sourceGroup) return;

    // Drop on an empty group's placeholder: only change membership, keep page order.
    if (rawOver.startsWith("__empty:")) {
      const targetGroup = rawOver.slice("__empty:".length);
      if (sourceGroup === targetGroup) return;
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === sourceGroup) {
            return { ...g, widgets: g.widgets.filter((w) => w !== activeId) };
          }
          if (g.id === targetGroup) {
            return g.widgets.includes(activeId)
              ? g
              : { ...g, widgets: [...g.widgets, activeId] };
          }
          return g;
        }),
      );
      return;
    }

    const overId = rawOver as WidgetId;
    const targetGroup = groupOfWidget.get(overId);
    if (!targetGroup) return;

    setOrder((prev) => {
      // Ensure newly-added widgets (not yet in saved order) are present
      // before we try to reorder.
      const fullPrev: WidgetId[] = [...prev];
      for (const w of WIDGETS) {
        if (!fullPrev.includes(w.id)) fullPrev.push(w.id);
      }
      const fromIdx = fullPrev.indexOf(activeId);
      const toIdx = fullPrev.indexOf(overId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      return arrayMove(fullPrev, fromIdx, toIdx);
    });

    if (sourceGroup !== targetGroup) {
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === sourceGroup) {
            return { ...g, widgets: g.widgets.filter((w) => w !== activeId) };
          }
          if (g.id === targetGroup) {
            return g.widgets.includes(activeId)
              ? g
              : { ...g, widgets: [...g.widgets, activeId] };
          }
          return g;
        }),
      );
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <nav className="flex flex-col gap-0.5 px-3">
        {sortedGroups.map((g) => {
          const isActive = activeGroup === g.id;
          const isExpanded = expanded.includes(g.id);
          return (
            <div key={g.id} className="flex flex-col">
              <div
                className={cn(
                  "group/row flex items-center rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(g.id)}
                  aria-label={isExpanded ? "접기" : "펼치기"}
                  aria-expanded={isExpanded}
                  className="flex size-9 shrink-0 items-center justify-center rounded-l-xl text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight
                    className={cn(
                      "size-3.5 transition-transform",
                      isExpanded && "rotate-90",
                    )}
                    strokeWidth={2.4}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => jumpToGroup(g)}
                  className="flex flex-1 items-center gap-2.5 rounded-r-xl py-2.5 pr-3 text-left"
                >
                  <GroupIcon
                    groupId={g.id}
                    className={cn(
                      "size-[18px] shrink-0 transition-colors",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground group-hover/row:text-foreground",
                    )}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  <span>{g.label}</span>
                </button>
              </div>

              {isExpanded ? (
                <SortableContext
                  items={g.widgets}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="ml-9 flex flex-col gap-0.5 border-l border-border/60 py-0.5">
                    {g.widgets.length === 0 ? (
                      <EmptyGroupDropZone groupId={g.id} />
                    ) : (
                      g.widgets.map((wid) => (
                        <SidebarWidgetRow
                          key={wid}
                          id={wid}
                          active={activeWidget === wid}
                        />
                      ))
                    )}
                  </ul>
                </SortableContext>
              ) : null}
            </div>
          );
        })}
      </nav>
    </DndContext>
  );
}
