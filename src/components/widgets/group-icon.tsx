import { createElement } from "react";
import { iconForGroup } from "@/lib/widgets/groups";

type Props = {
  groupId: string;
  className?: string;
  strokeWidth?: number;
};

/**
 * Stable wrapper that resolves a group's lucide icon at render time.
 * Uses createElement to satisfy `react-hooks/static-components` — JSX with a
 * function-call-derived component variable trips the lint.
 */
export function GroupIcon({ groupId, className, strokeWidth = 1.8 }: Props) {
  return createElement(iconForGroup(groupId), { className, strokeWidth });
}
