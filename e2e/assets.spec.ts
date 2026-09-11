import { test, expect } from "@playwright/test";
import { login, uniqueTag } from "./helpers";

test.describe("資産管理", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("円建て口座に残高を記録すると一覧・詳細に反映される", async ({ page }) => {
    const note = uniqueTag("asset-jpy");
    await page.goto("/assets/a1");
    await page.getByRole("button", { name: "＋ 残高・評価額を記録" }).click();
    await page.getByLabel("残高・評価額").fill("1500000");
    await page.getByLabel("メモ").fill(note);
    await page.getByRole("button", { name: "保存" }).click();

    await expect(page.getByText("記録しました")).toBeVisible();
    // hero・履歴の両方に同じ金額が出るため .first() で厳密一致エラーを避ける
    await expect(page.getByText("¥1,500,000").first()).toBeVisible();
    await expect(page.getByText(note)).toBeVisible();
  });

  test("外貨建て投資口座に元本・為替レート付きで記録すると含み損益と円換算が表示される", async ({
    page,
  }) => {
    // a2 は米国株口座（USD建て・investment）としてシード済み
    await page.goto("/assets/a2");
    await page.getByRole("button", { name: "＋ 残高・評価額を記録" }).click();
    await page.getByLabel("残高・評価額").fill("5000");
    await page.getByLabel(/元本/).fill("4000");
    await page.getByLabel(/為替レート/).fill("150");
    await page.getByRole("button", { name: "保存" }).click();

    await expect(page.getByText("記録しました")).toBeVisible();
    // 評価額はUSD表示（hero・履歴の両方に出るため .first() で厳密一致エラーを避ける）
    await expect(page.getByText("$5,000").first()).toBeVisible();
    // 円換算（≒）表示
    await expect(page.getByText(/≒¥750,000/).first()).toBeVisible();
    // 含み損益 = 5000 - 4000 = +1000 USD
    await expect(page.getByText(/含み損益 \+\$1,000/).first()).toBeVisible();
  });

  test("設定で外貨口座を新規作成し、資産管理から選択できる", async ({ page }) => {
    const accountName = uniqueTag("eur-account");
    await page.goto("/settings?tab=assets");
    // 既に口座が登録済みだと「資産口座を追加」セクションは既定で閉じているため開く
    await page.getByText("資産口座を追加").click();
    await page.getByPlaceholder("口座名（例: 普通預金（三井住友））").fill(accountName);
    await page.getByRole("button", { name: "投資信託・株式等" }).click();
    await page.getByLabel("通貨").selectOption("EUR");
    await page.getByRole("button", { name: "追加" }).click();

    await expect(page.getByText("資産口座を追加しました")).toBeVisible();
    await expect(page.getByText(accountName)).toBeVisible();
    await expect(page.getByText("投資信託・株式等 ・ EUR")).toBeVisible();

    await page.goto("/assets");
    await page.getByText(accountName).click();
    await expect(page).toHaveURL(/\/assets\//);
  });
});
