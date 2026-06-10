"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, EyeOff, GripVertical, MoreVertical } from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { GroupDef, WidgetId } from "@/lib/widgets/types";
import { WIDGET_LABELS } from "@/lib/widgets/registry";
import { cn } from "@/lib/utils";
import { GroupIcon } from "./group-icon";

type Props = {
  id: WidgetId;
  /** Group the widget currently belongs to — drives data-section for scroll-spy. */
  group: string;
  groups: GroupDef[];
  onHide: (id: WidgetId) => void;
  onMoveToGroup: (widgetId: WidgetId, targetGroupId: string) => void;
  children: React.ReactNode;
};

export function WidgetFrame({
  id,
  group,
  groups,
  onHide,
  onMoveToGroup,
  children,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const [menuOpen, setMenuOpen] = useState(false);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      id={id}
      data-widget={id}
      data-section={group}
      className={cn(
        "group/widget relative scroll-mt-16",
        isDragging && "z-20 opacity-90",
      )}
    >
      <div
        className={cn(
          "absolute left-full top-2 z-10 ml-1.5 flex flex-col items-center gap-0.5 rounded-lg px-0.5 py-0.5 transition-opacity duration-150",
          "opacity-20 group-hover/widget:opacity-100",
          isDragging || menuOpen ? "opacity-100" : "",
        )}
      >
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`${WIDGET_LABELS[id]} 이동`}
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical className="size-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          aria-label={`${WIDGET_LABELS[id]} 숨기기`}
          onClick={() => onHide(id)}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <EyeOff className="size-4" strokeWidth={1.8} />
        </button>
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger
            aria-label={`${WIDGET_LABELS[id]} 더보기`}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[popup-open]:bg-muted data-[popup-open]:text-foreground"
          >
            <MoreVertical className="size-4" strokeWidth={1.8} />
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="bottom"
            sideOffset={6}
            className="w-56 gap-1.5 p-1.5"
          >
            <div className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              그룹으로 이동
            </div>
            <div className="flex flex-col">
              {groups.map((g) => {
                const active = g.id === group;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      onMoveToGroup(id, g.id);
                      setMenuOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                      active
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <GroupIcon groupId={g.id} className="size-4 shrink-0" />
                    <span className="flex-1 truncate">{g.label}</span>
                    {active ? (
                      <Check className="size-3.5 text-foreground" strokeWidth={2.2} />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {children}
    </div>
  );
}
