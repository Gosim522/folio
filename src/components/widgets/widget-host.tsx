"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useEffect, useMemo, useState } from "react";
import { usePreference } from "@/hooks/use-preferences";
import {
  PREF_DEFAULTS,
  PREF_KEYS,
  migrateWidgetSchema,
} from "@/lib/preferences";
import { WIDGETS } from "@/lib/widgets/registry";
import type { GroupDef, WidgetId } from "@/lib/widgets/types";
import { WidgetFrame } from "./widget-frame";

type Props = {
  nodes: Partial<Record<WidgetId, React.ReactNode>>;
};

export function WidgetHost({ nodes }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    migrateWidgetSchema();
    // Intentional post-hydration mount gate — DnD must not render during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const [order, setOrder] = usePreference<WidgetId[]>(
    PREF_KEYS.widgetOrder,
    PREF_DEFAULTS.widgetOrder,
  );
  const [hidden, setHidden] = usePreference<WidgetId[]>(
    PREF_KEYS.hiddenWidgets,
    PREF_DEFAULTS.hiddenWidgets,
  );
  const [groups, setGroups] = usePreference<GroupDef[]>(
    PREF_KEYS.widgetGroups,
    PREF_DEFAULTS.widgetGroups,
  );

  const visibleOrder = useMemo<WidgetId[]>(() => {
    const seen = new Set<WidgetId>();
    const out: WidgetId[] = [];
    for (const id of order) {
      if (nodes[id] !== undefined && !seen.has(id)) {
        out.push(id);
        seen.add(id);
      }
    }
    for (const w of WIDGETS) {
      if (!seen.has(w.id) && nodes[w.id] !== undefined) {
        out.push(w.id);
      }
    }
    return out.filter((id) => !hidden.includes(id));
  }, [nodes, order, hidden]);

  const groupOfWidget = useMemo<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const g of groups) {
      for (const wid of g.widgets) m[wid] = g.id;
    }
    for (const w of WIDGETS) {
      if (!(w.id in m)) m[w.id] = w.defaultGroup;
    }
    return m;
  }, [groups]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = visibleOrder.indexOf(active.id as WidgetId);
    const newIndex = visibleOrder.indexOf(over.id as WidgetId);
    if (oldIndex === -1 || newIndex === -1) return;
    const nextVisible = arrayMove(visibleOrder, oldIndex, newIndex);
    setOrder((prev) => {
      // First, ensure every registered widget is in the working order (newly
      // added widgets may not yet appear in the user's saved order).
      const fullPrev: WidgetId[] = [...prev];
      for (const w of WIDGETS) {
        if (!fullPrev.includes(w.id)) fullPrev.push(w.id);
      }
      // Replace visible-slot positions with the new visible sequence; hidden
      // widgets stay in their saved positions.
      const visSet = new Set(nextVisible);
      let cursor = 0;
      const merged: WidgetId[] = [];
      for (const id of fullPrev) {
        if (visSet.has(id)) {
          merged.push(nextVisible[cursor++]);
        } else {
          merged.push(id);
        }
      }
      return merged;
    });
  }

  function hideWidget(id: WidgetId) {
    setHidden((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function moveWidgetToGroup(widgetId: WidgetId, targetGroupId: string) {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === targetGroupId) {
          return g.widgets.includes(widgetId)
            ? g
            : { ...g, widgets: [...g.widgets, widgetId] };
        }
        return g.widgets.includes(widgetId)
          ? { ...g, widgets: g.widgets.filter((w) => w !== widgetId) }
          : g;
      }),
    );
  }

  if (!mounted) {
    // SSR / pre-hydration: bare list, no DnD. Avoids dnd-kit aria-describedby id mismatch.
    return (
      <div className="space-y-6 py-6 md:py-8">
        {visibleOrder.map((id) => (
          <div
            key={id}
            id={id}
            data-widget={id}
            data-section={groupOfWidget[id] ?? "dashboard"}
            className="scroll-mt-16"
          >
            {nodes[id]}
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={visibleOrder} strategy={verticalListSortingStrategy}>
        <div className="space-y-6 py-6 md:py-8">
          {visibleOrder.map((id) => (
            <WidgetFrame
              key={id}
              id={id}
              group={groupOfWidget[id] ?? "dashboard"}
              groups={groups}
              onHide={hideWidget}
              onMoveToGroup={moveWidgetToGroup}
            >
              {nodes[id]}
            </WidgetFrame>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
