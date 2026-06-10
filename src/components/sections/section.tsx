import { cn } from "@/lib/utils";

type Props = {
  id: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * Vertical section. No min-height — section is exactly as tall as its content
 * (plus py-* padding), so adjacent sections connect immediately when one is short.
 * `scroll-mt-16` keeps anchor scrolls clear of the sticky topbar.
 */
export function Section({ id, children, className }: Props) {
  return (
    <section
      id={id}
      data-section={id}
      className={cn("scroll-mt-16 py-6 md:py-8", className)}
    >
      {children}
    </section>
  );
}
