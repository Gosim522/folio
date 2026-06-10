"use client";

import { Fragment, useMemo } from "react";
import { usePreference } from "@/hooks/use-preferences";
import { PREF_DEFAULTS, PREF_KEYS } from "@/lib/preferences";

type Props = {
  sections: Record<string, React.ReactNode>;
};

/** Renders section nodes in the user's chosen order, skipping hidden ones. */
export function OrderedSections({ sections }: Props) {
  const [order] = usePreference<string[]>(
    PREF_KEYS.sectionOrder,
    PREF_DEFAULTS.sectionOrder,
  );
  const [hidden] = usePreference<string[]>(
    PREF_KEYS.hiddenSections,
    PREF_DEFAULTS.hiddenSections,
  );

  const ordered = useMemo(() => {
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const id of order) {
      if (id in sections && !seen.has(id)) {
        ids.push(id);
        seen.add(id);
      }
    }
    // Append any new sections not yet in user's saved order
    for (const id of Object.keys(sections)) {
      if (!seen.has(id)) ids.push(id);
    }
    return ids.filter((id) => !hidden.includes(id));
  }, [sections, order, hidden]);

  return (
    <>
      {ordered.map((id) => (
        <Fragment key={id}>{sections[id]}</Fragment>
      ))}
    </>
  );
}
