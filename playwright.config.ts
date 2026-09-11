import { defineConfig, devices } from "@playwright/test";

// 開発中に手元で `npm run dev`（ポート3000）を別途動かしていても衝突しないよう、
// E2E専用のポートを使う。
const APP_PORT = 3100;
const MOCK_GAS_PORT = 4546;

export default defineConfig({
  testDir: "./e2e",
  // モックGASサーバーはメモリ上の単一データセットを共有するため、テストを
  // 並列実行すると互いのデータ操作が干渉する。確実性を優先して直列実行する。
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  // GAS経由の保存は数百ms〜のネットワーズラグを挟むため、デフォルトの5秒だと
  // 環境負荷が高いとき（他プロセスと同時実行等）にまれに間に合わずフレーキーになる。
  // 余裕を持たせて安定させる。
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    trace: "on-first-retry",
    actionTimeout: 10_000,
  },
  // `next dev`（Turbopack）はルート・サーバーアクションを初回アクセス時に
  // 遅延コンパイルするため、テストの実行順序によってはその初回コンパイル分
  // だけ応答が数秒遅れ、アサーションのタイムアウトを不安定に超えることがある。
  // 本番ビルド（build + start）に対して実行することで、実行順序に左右されない
  // 安定したタイミングで検証する。
  webServer: [
    {
      command: `node e2e/mock-gas-server.mjs`,
      port: MOCK_GAS_PORT,
      env: { MOCK_GAS_PORT: String(MOCK_GAS_PORT) },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npm run build && npm run start -- --port ${APP_PORT}`,
      port: APP_PORT,
      env: {
        GAS_API_URL: `http://localhost:${MOCK_GAS_PORT}`,
        APP_PASSCODE: "0607",
      },
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
