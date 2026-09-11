export const AUTH_COOKIE = "household_auth";
export const ATTEMPT_COOKIE = "household_login_attempts";
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_SECONDS = 60;
// 記録フォームの入力中（日付・金額・カテゴリ・メンバー・メモの入力）に
// セッションが切れて保存が失敗することがあったため、実際の入力に十分な
// 余裕を持たせている。proxy.ts がリクエストのたびにこの秒数で有効期限を
// 延長する（スライディングセッション）ため、操作を続けている限り切れない。
export const SESSION_SECONDS = 60 * 30;

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getPasscode(): string {
  return process.env.APP_PASSCODE ?? "0607";
}

export function checkPasscode(input: string): boolean {
  return input === getPasscode();
}

export async function authToken(): Promise<string> {
  return sha256Hex(getPasscode());
}
