import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, SESSION_SECONDS, authToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const cookie = request.cookies.get(AUTH_COOKIE)?.value;
  const expected = await authToken();

  if (cookie === expected) {
    const response = NextResponse.next();
    // アクセスのたびに有効期限を延長するスライディングセッション。
    // 家計簿の記録フォームなどを操作している間はリクエストが発生し続ける
    // ため、固定の有効期限だと入力の途中でセッションが切れて
    // 「保存に失敗しました」となる問題があった（フォーム記入は
    // SESSION_SECONDS を超えることがあるため）。
    response.cookies.set(AUTH_COOKIE, cookie, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_SECONDS,
      path: "/",
    });
    return response;
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico).*)"],
};
