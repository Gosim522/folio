"use client";

import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GroupIcon } from "@/components/widgets/group-icon";
import { labelForGroup } from "@/lib/widgets/groups";
import { WIDGET_BY_ID } from "@/lib/widgets/registry";
import type { GroupDef, WidgetId } from "@/lib/widgets/types";

type Props = {
  /** Widget being previewed, or null when the dialog is closed. */
  widgetId: WidgetId | null;
  groups: GroupDef[];
  isHidden: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleHidden: (id: WidgetId) => void;
};

/**
 * Centered dialog that explains a widget's purpose before the user adds it.
 * Opened from the 위젯 settings list — lets you decide what a hidden widget
 * does without first un-hiding it.
 */
export function WidgetPreviewDialog({
  widgetId,
  groups,
  isHidden,
  onOpenChange,
  onToggleHidden,
}: Props) {
  const def = widgetId ? WIDGET_BY_ID[widgetId] : null;

  return (
    <Dialog open={def !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {def ? (
          <>
            <DialogHeader>
              <div className="mb-1 flex size-10 items-center justify-center rounded-xl bg-muted text-foreground">
                <GroupIcon
                  groupId={def.defaultGroup}
                  className="size-5"
                  strokeWidth={2}
                />
              </div>
              <DialogTitle>{def.label}</DialogTitle>
              <DialogDescription>
                {labelForGroup(def.defaultGroup, groups)} 카테고리
                {isHidden ? " · 지금은 숨김" : " · 표시 중"}
              </DialogDescription>
            </DialogHeader>

            <p className="text-sm leading-relaxed text-foreground">
              {def.description}
            </p>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                닫기
              </Button>
              <Button
                variant={isHidden ? "default" : "outline"}
                onClick={() => {
                  if (widgetId) onToggleHidden(widgetId);
                  onOpenChange(false);
                }}
              >
                {isHidden ? (
                  <Eye strokeWidth={2} />
                ) : (
                  <EyeOff strokeWidth={2} />
                )}
                {isHidden ? "위젯 추가" : "위젯 숨기기"}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
