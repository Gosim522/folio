import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { KIS_KEY_COOKIE, KIS_SECRET_COOKIE } from "@/lib/quotes/broker-creds";

/*
  브로커 API 키를 서버에서 `HttpOnly` 쿠키로 굽는 라우트.

  왜 클라이언트 document.cookie 가 아니라 이 경로인가:
  - HttpOnly 쿠키는 JS 로 읽지 못한다 (사양상 document.cookie 에서 안 보임).
  - 클라이언트에서 직접 만든 쿠키는 HttpOnly 적용 불가 → 페이지의 어떤 스크립트도
    키를 훔칠 수 있다.
  - 서버 라우트에서 `Set-Cookie` 헤더로 굽는 것만이 HttpOnly 를 강제할 수 있다.

  Same-origin POST 라 CSRF 위험 거의 없지만 `SameSite=Strict` 도 함께 적용.
*/

// 쿠키는 1년 유효 — 사용자가 명시적으로 키를 지우거나 만료 갱신할 때까지.
const ONE_YEAR = 60 * 60 * 24 * 365;

type Body = {
  appKey?: string;
  appSecret?: string;
};

export async function POST(req: Request) {
  let body: Body | null = null;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  const appKey = typeof body.appKey === "string" ? body.appKey : "";
  const appSecret = typeof body.appSecret === "string" ? body.appSecret : "";
  const store = await cookies();

  const opts = {
    httpOnly: true,
    sameSite: "strict" as const,
    path: "/",
    maxAge: ONE_YEAR,
  };

  if (appKey.length > 0 && appSecret.length > 0) {
    store.set(KIS_KEY_COOKIE, encodeURIComponent(appKey), opts);
    store.set(KIS_SECRET_COOKIE, encodeURIComponent(appSecret), opts);
  } else {
    // 빈 값이 오면 — 사용자가 키를 지운 것 — 쿠키도 삭제.
    store.delete(KIS_KEY_COOKIE);
    store.delete(KIS_SECRET_COOKIE);
  }

  return NextResponse.json({ ok: true });
}
