"use server";

import { cookies } from "next/headers";
import {
  ATTEMPT_COOKIE,
  AUTH_COOKIE,
  LOCKOUT_SECONDS,
  MAX_LOGIN_ATTEMPTS,
  SESSION_SECONDS,
  authToken,
  checkPasscode,
} from "./auth";

type AttemptState = { count: number; lockedUntil?: number };

function readAttemptState(raw: string | undefined): AttemptState {
  if (!raw) return { count: 0 };
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.count === "number") return parsed;
  } catch {
    // 壊れたCookieは初期状態として扱う
  }
  return { count: 0 };
}

export type LoginResult =
  | { ok: true }
  | { ok: false; locked: false }
  | { ok: false; locked: true; retryAfterSeconds: number };

export async function login(passcode: string): Promise<LoginResult> {
  const store = await cookies();
  const secure = process.env.NODE_ENV === "production";

  const state = readAttemptState(store.get(ATTEMPT_COOKIE)?.value);
  const now = Date.now();

  // 注: この試行回数制限はCookieベースの簡易的なものであり、Cookieを削除すれば
  // 回避できてしまう。世帯内利用という前提のもとでの「抑止」目的であり、
  // 本格的な不正アクセス対策としての強度は無い（IPベースなどのサーバー側の
  // 制限が必要な場合は別途導入が必要）。
  if (state.lockedUntil && now < state.lockedUntil) {
    return { ok: false, locked: true, retryAfterSeconds: Math.ceil((state.lockedUntil - now) / 1000) };
  }

  if (!checkPasscode(passcode)) {
    const count = state.count + 1;
    const next: AttemptState = { count };
    let locked = false;
    if (count >= MAX_LOGIN_ATTEMPTS) {
      next.count = 0;
      next.lockedUntil = now + LOCKOUT_SECONDS * 1000;
      locked = true;
    }
    store.set(ATTEMPT_COOKIE, JSON.stringify(next), {
      httpOnly: true,
      sameSite: "lax",
      secure,
      maxAge: LOCKOUT_SECONDS * 5,
      path: "/",
    });
    return locked
      ? { ok: false, locked: true, retryAfterSeconds: LOCKOUT_SECONDS }
      : { ok: false, locked: false };
  }

  store.delete(ATTEMPT_COOKIE);
  const token = await authToken();
  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    // ログイン状態を長く保持しない：離脱・再訪時には毎回ログインを求める。
    // 秒数自体は SESSION_SECONDS を参照（proxy.ts がアクセスのたびに
    // 延長するため、操作を続けている間は途中で切れない）。
    maxAge: SESSION_SECONDS,
    path: "/",
  });
  return { ok: true };
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
}
