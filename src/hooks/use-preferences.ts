"use client";

import { useCallback, useSyncExternalStore } from "react";
import { PREF_PREFIX, readPref, writePref } from "@/lib/preferences";

/*
  React 19 권장 패턴 — 외부 저장소(localStorage)에 양방향 바인딩하는 훅.

  왜 useSyncExternalStore 인가:
  - 이전 구현은 mount-effect 에서 setState 를 동기 호출 → `react-hooks/set-state-in-effect`
    경고 + 캐스케이드 렌더 위험.
  - useSyncExternalStore 는 외부 저장소 변경을 React 의 동시성 모델 안에서 일관되게
    구독하도록 설계됨. 하이드레이션 안전, tearing 방지.

  핵심 디테일 — 안정 참조 캐시:
  - useSyncExternalStore 의 getSnapshot 은 "값이 바뀌지 않으면 같은 참조" 를 돌려줘야
    한다. 배열·객체 값 (예: widgetOrder: string[]) 을 매번 JSON.parse 하면 새 ref →
    React 가 변경으로 오인 → 무한 재렌더. raw 문자열을 캐시해 변하지 않았을 때 같은
    파싱 결과 객체를 재사용.
*/

type Cached = { raw: string | null; value: unknown };
const snapshotCache = new Map<string, Cached>();

function readSnapshot<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  const raw = window.localStorage.getItem(PREF_PREFIX + key);
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) return cached.value as T;
  const value = readPref<T>(key, defaultValue);
  snapshotCache.set(key, { raw, value });
  return value;
}

function subscribePref(key: string, callback: () => void): () => void {
  const handler = (e: Event) => {
    if (e instanceof StorageEvent) {
      if (e.key === PREF_PREFIX + key) callback();
      return;
    }
    const detail = (e as CustomEvent).detail as { key?: string } | undefined;
    if (!detail?.key || detail.key === key) callback();
  };
  window.addEventListener("storage", handler);
  window.addEventListener("preferences:change", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("preferences:change", handler);
  };
}

/**
 * Two-way bound localStorage state under `pref:<key>`.
 * Stays in sync across components in the same tab (via custom `preferences:change` event)
 * and across tabs (via native `storage` event).
 */
export function usePreference<T>(key: string, defaultValue: T) {
  const subscribe = useCallback(
    (cb: () => void) => subscribePref(key, cb),
    [key],
  );
  const getSnapshot = useCallback(
    () => readSnapshot<T>(key, defaultValue),
    [key, defaultValue],
  );
  const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);

  const value = useSyncExternalStore<T>(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = readPref<T>(key, defaultValue);
      const resolved =
        typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      writePref(key, resolved);
    },
    [key, defaultValue],
  );

  return [value, update] as const;
}
