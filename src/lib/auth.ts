export const AUTH_COOKIE = "household_auth";
export const ATTEMPT_COOKIE = "household_login_attempts";
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_SECONDS = 60;

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
