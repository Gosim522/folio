"use client";

import { useServerInsertedHTML } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

// next-themes used "theme" as its default storage key — existing users keep
// their preference after we switched off next-themes.
const STORAGE_KEY = "theme";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/*
  Custom theme provider (replaces next-themes). next-themes rendered its
  flash-prevention <script> inside a component, which React 19 flags as a
  dev-console error ("Encountered a script tag..."). Here the same script is
  injected via useServerInsertedHTML — into the SSR stream, outside React's
  component tree — so React never sees a <script> and never warns.
*/
const FOUC_SCRIPT =
  `try{var t=localStorage.getItem('${STORAGE_KEY}')||'system';` +
  `var d=t==='dark'||(t==='system'&&` +
  `window.matchMedia('(prefers-color-scheme:dark)').matches);` +
  `var e=document.documentElement;e.classList.toggle('dark',d);` +
  `e.style.colorScheme=d?'dark':'light';}catch(e){}`;

function systemDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function resolve(theme: Theme): ResolvedTheme {
  return theme === "system" ? (systemDark() ? "dark" : "light") : theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  // The FOUC script already applied the correct class before hydration, so the
  // first run of the apply-effect must skip — otherwise it briefly clobbers the
  // class with the stale default and the user sees a flash.
  const applied = useRef(false);

  useServerInsertedHTML(() => (
    <script dangerouslySetInnerHTML={{ __html: FOUC_SCRIPT }} />
  ));

  // Adopt the stored theme on mount — synchronising React state with an
  // external system (localStorage). Legitimate setState-in-effect use.
  useEffect(() => {
    let stored: Theme = "system";
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "light" || raw === "dark" || raw === "system") stored = raw;
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(stored);
    setResolvedTheme(resolve(stored));
  }, []);

  // While theme is "system", follow OS preference changes.
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolvedTheme(mq.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  // Sync the <html> class to the resolved theme — skipping the first run, which
  // the FOUC script already handled.
  useEffect(() => {
    if (!applied.current) {
      applied.current = true;
      return;
    }
    const el = document.documentElement;
    el.classList.toggle("dark", resolvedTheme === "dark");
    el.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    setThemeState(next);
    setResolvedTheme(resolve(next));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return (
    useContext(ThemeContext) ?? {
      theme: "system",
      resolvedTheme: "light",
      setTheme: () => {},
    }
  );
}
