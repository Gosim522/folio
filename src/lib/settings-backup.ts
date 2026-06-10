import { PREF_PREFIX } from "./preferences";

export type SettingsBackup = {
  app: "folio";
  version: 1;
  exportedAt: string;
  prefs: Record<string, unknown>;
};

/** Collects every `pref:*` localStorage entry into a portable object. */
export function exportSettings(): SettingsBackup {
  const prefs: Record<string, unknown> = {};
  if (typeof window !== "undefined") {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(PREF_PREFIX)) continue;
      const raw = window.localStorage.getItem(key);
      if (raw === null) continue;
      try {
        prefs[key] = JSON.parse(raw);
      } catch {
        prefs[key] = raw;
      }
    }
  }
  return {
    app: "folio",
    version: 1,
    exportedAt: new Date().toISOString(),
    prefs,
  };
}

/** Triggers a browser download of the current settings as a JSON file. */
export function downloadSettings() {
  if (typeof window === "undefined") return;
  const data = exportSettings();
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const stamp = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  const a = document.createElement("a");
  a.href = url;
  a.download = `folio-settings-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Writes a backup's prefs back into localStorage. Returns false if invalid. */
export function applySettingsBackup(data: unknown): boolean {
  if (typeof window === "undefined") return false;
  if (
    !data ||
    typeof data !== "object" ||
    (data as SettingsBackup).app !== "folio" ||
    typeof (data as SettingsBackup).prefs !== "object"
  ) {
    return false;
  }
  const prefs = (data as SettingsBackup).prefs;
  let count = 0;
  for (const [key, value] of Object.entries(prefs)) {
    if (!key.startsWith(PREF_PREFIX)) continue;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      count += 1;
    } catch {
      /* ignore individual key failures */
    }
  }
  return count > 0;
}

/** Parses + applies a user-selected backup file. Resolves to applied/!applied. */
export async function importSettingsFile(file: File): Promise<boolean> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    return applySettingsBackup(data);
  } catch {
    return false;
  }
}
