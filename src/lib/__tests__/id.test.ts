import { describe, expect, it } from "vitest";
import { generateId } from "../id";

describe("generateId", () => {
  it("指定したprefixで始まる", () => {
    expect(generateId("t")).toMatch(/^t_/);
  });

  it("連続して呼び出しても衝突しない", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateId("x")));
    expect(ids.size).toBe(1000);
  });
});
