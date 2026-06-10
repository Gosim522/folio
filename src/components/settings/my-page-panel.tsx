"use client";

import {
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldAlert,
  Unlock,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePreference } from "@/hooks/use-preferences";
import { BROKERS, type BrokerDef, type BrokerId } from "@/lib/brokers";
import { PREF_KEYS } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "./confirm-dialog";

type Tone = "ok" | "warn" | "off";

// Auto-mask delay after revealing a secret value.
const REVEAL_TIMEOUT_MS = 5000;

type Pending = {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
};

export function MyPagePanel() {
  const [displayName, setDisplayName] = usePreference<string>(
    PREF_KEYS.userDisplayName,
    "",
  );

  /*
    3-step disclosure (security model unchanged, now multi-broker):
      Step 0 — API section hidden entirely; no key components in the DOM.
      Step 1 — broker list visible; each broker a locked card, status badge only.
      Step 2 — one broker's inputs expanded (still masked unless revealed).
    Every transition requires a confirmation dialog. State resets when this
    panel unmounts (Settings Sheet close).
  */
  const [step, setStep] = useState<0 | 1>(0);
  const [expanded, setExpanded] = useState<BrokerId | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);

  function requestStep1() {
    setPending({
      title: "API 키 설정을 표시할까요?",
      description:
        "현재 화면을 공유하거나 녹화 중이라면 키가 노출될 수 있어요. 확실히 안전한 환경인지 확인하고 계속하세요.",
      confirmLabel: "표시",
      onConfirm: () => {
        setStep(1);
        setPending(null);
      },
    });
  }

  function requestExpand(broker: BrokerDef) {
    setPending({
      title: `${broker.label} 입력 폼을 펼칠까요?`,
      description:
        "키 입력 칸이 화면에 나타납니다. 값 자체는 마스킹되지만, 폼이 화면에 보인다는 사실 자체에 주의가 필요합니다.",
      confirmLabel: "펼치기",
      onConfirm: () => {
        setExpanded(broker.id);
        setPending(null);
      },
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label
          htmlFor="user-display-name"
          className="text-xs text-muted-foreground"
        >
          표시 이름
        </Label>
        <Input
          id="user-display-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="예: 김토스"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {step === 0 ? (
        <button
          type="button"
          onClick={requestStep1}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-card/50 p-3 text-left text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex items-center gap-2 text-muted-foreground">
            <KeyRound className="size-4" strokeWidth={1.8} />
            증권사 API 키 관리 (고급)
          </span>
          <ChevronRight className="size-4 text-muted-foreground" strokeWidth={2} />
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            API 키를 입력하면 해당 증권사 시세를 우선 사용해요 — 우선순위는 토스 →
            한국투자 → Yahoo(기본) 순입니다.
          </p>
          {BROKERS.map((broker) => (
            <BrokerCredentialCard
              key={broker.id}
              broker={broker}
              expanded={expanded === broker.id}
              onRequestExpand={() => requestExpand(broker)}
              onCollapse={() => setExpanded(null)}
            />
          ))}
          <button
            type="button"
            onClick={() => {
              setStep(0);
              setExpanded(null);
            }}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            ← 다시 숨김
          </button>
        </div>
      )}

      <ConfirmDialog
        open={!!pending}
        title={pending?.title ?? ""}
        description={pending?.description ?? ""}
        confirmLabel={pending?.confirmLabel ?? "계속"}
        danger={pending?.danger}
        onConfirm={() => pending?.onConfirm()}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}

function BrokerCredentialCard({
  broker,
  expanded,
  onRequestExpand,
  onCollapse,
}: {
  broker: BrokerDef;
  expanded: boolean;
  onRequestExpand: () => void;
  onCollapse: () => void;
}) {
  const [appKey, setAppKey] = usePreference<string>(broker.appKeyPref, "");
  const [appSecret, setAppSecret] = usePreference<string>(broker.secretPref, "");

  const connected = appKey.length > 0 && appSecret.length > 0;
  const partial = !connected && (appKey.length > 0 || appSecret.length > 0);
  const tone: Tone = connected ? "ok" : partial ? "warn" : "off";
  const statusLabel = connected ? "키 입력됨" : partial ? "키 부족" : "미연동";

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={onRequestExpand}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <Lock
            className="size-4 shrink-0 text-muted-foreground"
            strokeWidth={1.8}
          />
          <div className="min-w-0">
            <div className="text-sm font-semibold">{broker.label}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {connected
                ? "입력된 키 확인 · 수정"
                : partial
                  ? "한 쪽 키가 비어있어요"
                  : "키 입력을 시작합니다"}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge tone={tone} label={statusLabel} />
          <ChevronRight
            className="size-4 text-muted-foreground"
            strokeWidth={2}
          />
        </div>
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Unlock className="size-4 text-foreground" strokeWidth={1.8} />
          <div className="text-sm font-semibold">{broker.label}</div>
          <StatusBadge tone={tone} label={statusLabel} />
        </div>
        <button
          type="button"
          onClick={onCollapse}
          aria-label="접기"
          className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" strokeWidth={1.8} />
        </button>
      </div>

      <SecretField
        id={`${broker.id}-app-key`}
        label="AppKey"
        value={appKey}
        onChange={setAppKey}
      />
      <SecretField
        id={`${broker.id}-app-secret`}
        label="AppSecret"
        value={appSecret}
        onChange={setAppSecret}
      />

      <p className="flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground">
        <ShieldAlert
          className="mt-[1px] size-3 shrink-0 text-amber-500"
          strokeWidth={2}
        />
        <span>
          키는 이 브라우저의 localStorage에 평문 저장돼요. 공용·공유 PC에서는
          입력하지 마세요. 사용 후엔 우측 ✕로 닫아두는 것을 권장합니다.
        </span>
      </p>
    </div>
  );
}

function SecretField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [reveal, setReveal] = useState(false);
  const [askingReveal, setAskingReveal] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-mask after the timeout, with a visible countdown.
  useEffect(() => {
    if (!reveal) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    intervalRef.current = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) {
          setReveal(false);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [reveal]);

  function handleEye() {
    if (reveal) {
      setReveal(false);
    } else {
      setAskingReveal(true);
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <Label
          htmlFor={id}
          className="text-[11px] uppercase tracking-wider text-muted-foreground"
        >
          {label}
        </Label>
        {reveal ? (
          <span className="text-[10px] tabular text-amber-500">
            {countdown}초 후 다시 가려져요
          </span>
        ) : null}
      </div>
      <div className="relative">
        <Input
          id={id}
          type={reveal ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          placeholder="필수"
          className="pr-16 font-mono tracking-tight"
        />
        <div className="absolute inset-y-0 right-0 flex items-center">
          {value.length > 0 ? (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="지우기"
              className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3.5" strokeWidth={2} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleEye}
            aria-label={reveal ? "감추기" : "보기"}
            className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            {reveal ? (
              <EyeOff className="size-4" strokeWidth={1.8} />
            ) : (
              <Eye className="size-4" strokeWidth={1.8} />
            )}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={askingReveal}
        title="지금 키 값을 화면에 표시할까요?"
        description={`${(REVEAL_TIMEOUT_MS / 1000).toFixed(0)}초간 평문으로 표시되고 자동으로 다시 가려집니다. 캡쳐·녹화·화면 공유 중이 아닌지 다시 한 번 확인해주세요.`}
        confirmLabel="표시"
        danger
        onConfirm={() => {
          setCountdown(Math.ceil(REVEAL_TIMEOUT_MS / 1000));
          setReveal(true);
          setAskingReveal(false);
        }}
        onCancel={() => setAskingReveal(false)}
      />
    </div>
  );
}

function StatusBadge({ tone, label }: { tone: Tone; label: string }) {
  const dot =
    tone === "ok"
      ? "bg-pos"
      : tone === "warn"
        ? "bg-amber-500"
        : "bg-muted-foreground";
  const text =
    tone === "ok"
      ? "text-pos"
      : tone === "warn"
        ? "text-amber-500"
        : "text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium",
        text,
      )}
    >
      <span className={cn("size-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}
