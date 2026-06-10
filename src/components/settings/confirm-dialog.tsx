"use client";

import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "계속",
  cancelLabel = "취소",
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onCancel() : undefined)}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <div className="mb-1 flex size-9 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
            <ShieldAlert className="size-4" strokeWidth={2} />
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton={false}>
          <Button variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? "destructive" : "default"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
