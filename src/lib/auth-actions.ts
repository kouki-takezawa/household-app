"use server";

import { cookies } from "next/headers";
import { AUTH_COOKIE, authToken, checkPasscode } from "./auth";

export async function login(passcode: string): Promise<{ ok: boolean }> {
  if (!checkPasscode(passcode)) {
    return { ok: false };
  }
  const token = await authToken();
  const store = await cookies();
  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    // ログイン状態を長く保持しない：離脱・再訪時には毎回ログインを求めるが、
    // フォーム入力中に途中で切れて保存に失敗しないよう、操作に十分な猶予を持たせる。
    maxAge: 90,
    path: "/",
  });
  return { ok: true };
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
}
