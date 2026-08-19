/** 衝突しにくいID発行（例: `t${Date.now()}` は複数端末の同時操作で衝突しうるため使わない） */
export function generateId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
