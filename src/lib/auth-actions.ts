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
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return { ok: true };
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
}
