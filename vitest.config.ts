import { configDefaults, defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    // e2e/ 配下は @playwright/test 用のE2Eテスト（npm run test:e2e）。
    // vitestのデフォルト探索パターンにも一致してしまうため明示的に除外する。
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
