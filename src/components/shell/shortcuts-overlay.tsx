"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

/*
  키보드 단축키 도움말 — `?` 키로 토글.

  의도: Folio 는 키보드로 빠르게 다룰 수 있는 단축키가 늘어나는데, 새 사용자가 그것들을
  발견할 방법이 없었다. 이 오버레이가 한 곳에 정리해 보여준다.
*/

type Shortcut = {
  keys: string[];
  description: string;
};

type Group = {
  title: string;
  items: Shortcut[];
};

const GROUPS: Group[] = [
  {
    title: "화면 확대·축소",
    items: [
      { keys: ["Ctrl", "휠"], description: "위로 확대 / 아래로 축소" },
      { keys: ["Ctrl", "+"], description: "한 단계 확대" },
      { keys: ["Ctrl", "−"], description: "한 단계 축소" },
      { keys: ["Ctrl", "0"], description: "기본 배율 (100%)" },
    ],
  },
  {
    title: "섹션 이동",
    items: [
      { keys: ["↑"], description: "이전 섹션으로" },
      { keys: ["↓"], description: "다음 섹션으로" },
      { keys: ["PageUp"], description: "이전 섹션 (위와 동일)" },
      { keys: ["PageDown"], description: "다음 섹션 (위와 동일)" },
      { keys: ["우클릭", "위/아래"], description: "맨 위 / 맨 아래로 (웨일 스타일)" },
    ],
  },
  {
    title: "검색",
    items: [
      { keys: ["/"], description: "거래 내역 검색 포커스" },
    ],
  },
  {
    title: "데스크톱 앱",
    items: [
      { keys: ["Ctrl", "T"], description: "항상 위에 표시 토글" },
      { keys: ["F5"], description: "새로고침" },
      { keys: ["Ctrl", "Shift", "I"], description: "개발자 도구" },
      { keys: ["F11"], description: "전체화면" },
    ],
  },
  {
    title: "도움말",
    items: [{ keys: ["?"], description: "이 도움말 열기 / 닫기" }],
  },
];

function KeyCap({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-7 items-center justify-center rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs font-medium text-foreground/80 shadow-soft">
      {children}
    </kbd>
  );
}

export function ShortcutsOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // 입력 필드 안에서는 무시 (실제로 `?` 타이핑할 수 있어야 함).
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          (t as HTMLElement).isContentEditable)
      ) {
        return;
      }
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    // 외부 (예: 설정 Sheet 의 링크) 에서 오버레이를 열도록 신호 받기.
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("folio:open-shortcuts", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("folio:open-shortcuts", onOpen);
    };
  }, [open]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="키보드 단축키"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border border-border bg-background p-6 shadow-floating"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold">키보드 단축키</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              아무 곳이나 클릭하거나 <KeyCap>Esc</KeyCap> 로 닫기
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="닫기"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {GROUPS.map((g) => (
            <section key={g.title}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {g.title}
              </h3>
              <ul className="space-y-2">
                {g.items.map((it, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-sm">{it.description}</span>
                    <span className="flex shrink-0 gap-1">
                      {it.keys.map((k, i) => (
                        <KeyCap key={i}>{k}</KeyCap>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
