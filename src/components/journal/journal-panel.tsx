"use client";

import { BookOpen, Check, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { usePreference } from "@/hooks/use-preferences";
import { PREF_KEYS } from "@/lib/preferences";
import { cn } from "@/lib/utils";

/*
  매매일지 — 로컬에 저장되는 자유 형식의 회고·메모. 외부 동기화 없음 — localStorage 만 사용.
  v0.21 부터 정보 제공 전용 — 거래 입력 경로가 사라져 거래 연결 UI 도 같이 제거됨.
  (이전 버전에서 저장된 `tradeLabel` 필드는 데이터에 남을 수 있으나 무시한다.)
*/

type Entry = {
  id: string;
  /** ISO datetime when entry was first created. */
  createdAt: string;
  /** ISO datetime of last edit; equals createdAt if never edited. */
  updatedAt: string;
  /** 사용자가 비워두면 "(무제)" 로 표시. */
  title: string;
  content: string;
};

const NEW_ID = "__new__";

function newEntryId(): string {
  return `j_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

const dateFmt = new Intl.DateTimeFormat("ko-KR", {
  year: "2-digit",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function fmtWhen(iso: string): string {
  try {
    return dateFmt.format(new Date(iso));
  } catch {
    return iso;
  }
}

export function JournalPanel() {
  const [entries, setEntries] = usePreference<Entry[]>(
    PREF_KEYS.journalEntries,
    [],
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [search, setSearch] = useState("");

  const startNew = () => {
    setEditingId(NEW_ID);
    setDraftTitle("");
    setDraftContent("");
  };

  const startEdit = (e: Entry) => {
    setEditingId(e.id);
    setDraftTitle(e.title === "(무제)" ? "" : e.title);
    setDraftContent(e.content);
  };

  const cancel = () => {
    setEditingId(null);
    setDraftTitle("");
    setDraftContent("");
  };

  const save = () => {
    const title = draftTitle.trim();
    const content = draftContent.trim();
    if (!title && !content) {
      cancel();
      return;
    }
    const now = new Date().toISOString();
    if (editingId === NEW_ID) {
      const e: Entry = {
        id: newEntryId(),
        createdAt: now,
        updatedAt: now,
        title: title || "(무제)",
        content,
      };
      setEntries([e, ...entries]);
    } else if (editingId) {
      setEntries(
        entries.map((e) =>
          e.id === editingId
            ? {
                ...e,
                title: title || "(무제)",
                content,
                updatedAt: now,
              }
            : e,
        ),
      );
    }
    cancel();
  };

  const remove = (id: string) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("이 일지를 삭제할까요?")
    ) {
      return;
    }
    setEntries(entries.filter((e) => e.id !== id));
  };

  // 새 것이 위로 — 작성 시각 내림차순. 검색어는 제목·내용에 적용.
  const sorted = useMemo(() => {
    const desc = [...entries].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
    const q = search.trim().toLowerCase();
    if (!q) return desc;
    return desc.filter((e) =>
      `${e.title} ${e.content}`.toLowerCase().includes(q),
    );
  }, [entries, search]);

  return (
    <div className="space-y-3">
      {editingId === null && entries.length > 0 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" strokeWidth={2} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="일지 검색 (제목·내용)"
            className="pl-8 h-8 text-xs"
          />
        </div>
      )}
      {editingId === null ? (
        <button
          type="button"
          onClick={startNew}
          className="inline-flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted hover:text-foreground"
        >
          <Plus className="size-4" strokeWidth={2} />새 일지 작성
        </button>
      ) : (
        <div className="space-y-2 rounded-xl border border-border bg-card/40 p-3">
          <input
            type="text"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            placeholder="제목 (선택)"
            autoFocus
            className="w-full rounded-md border-0 bg-transparent px-2 py-1 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
          />
          <textarea
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            placeholder="오늘의 시장·관찰·생각 — 자유롭게."
            rows={6}
            className="w-full resize-y rounded-md border border-border bg-background px-2 py-1.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={cancel}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" strokeWidth={2} />
              취소
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!draftTitle.trim() && !draftContent.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check className="size-3.5" strokeWidth={2.25} />
              저장
            </button>
          </div>
        </div>
      )}

      {sorted.length === 0 && editingId === null ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/60 px-4 py-8 text-center">
          <BookOpen
            className="size-6 text-muted-foreground/60"
            strokeWidth={1.5}
          />
          <p className="text-xs text-muted-foreground">
            {search
              ? `"${search}" 와 일치하는 일지가 없어요.`
              : "아직 일지가 없어요. 위 버튼을 눌러 첫 메모를 남겨보세요."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {sorted.map((e) => {
            const edited = e.updatedAt !== e.createdAt;
            const isEditing = editingId === e.id;
            if (isEditing) return null; // edit form 렌더는 위쪽 폼 한 곳에서.
            return (
              <li
                key={e.id}
                className={cn(
                  "group rounded-xl border border-border bg-card/40 p-3",
                )}
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3
                      className={cn(
                        "truncate text-sm font-semibold",
                        e.title === "(무제)" && "text-muted-foreground",
                      )}
                    >
                      {e.title}
                    </h3>
                    <p className="mt-0.5 text-[11px] tabular text-muted-foreground">
                      {fmtWhen(e.createdAt)}
                      {edited && ` · 수정 ${fmtWhen(e.updatedAt)}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => startEdit(e)}
                      aria-label="편집"
                      className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="size-3.5" strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(e.id)}
                      aria-label="삭제"
                      className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-neg"
                    >
                      <Trash2 className="size-3.5" strokeWidth={2} />
                    </button>
                  </div>
                </div>
                {e.content && (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
                    {e.content}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
