// E2Eテスト専用の簡易GASサーバーモック。
// gas/Code.gs の doGet/doPost と同じレスポンス形状（JSON配列 / {ok,row} / {error}）を
// メモリ上のデータで再現する。本物のGoogle Apps Scriptを毎回デプロイせずに
// Playwrightで実際の保存フローを検証するために使う（本番コードには含まれない）。
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const SHEET_DEFS = {
  Members: ["id", "name", "color"],
  Categories: ["id", "name", "type", "color"],
  Transactions: ["id", "date", "amount", "type", "categoryId", "memberId", "memo"],
  Events: ["id", "title", "startDate", "startTime", "endDate", "endTime", "memberId", "recurrence", "memo"],
  AssetAccounts: ["id", "name", "type", "memberId", "currency"],
  AssetSnapshots: ["id", "assetAccountId", "date", "value", "note", "costBasis", "fxRate"],
};

function freshDb() {
  return {
    Members: [
      { id: "m1", name: "たろう", color: "#3b82f6" },
      { id: "m2", name: "はなこ", color: "#ec4899" },
    ],
    Categories: [
      { id: "c1", name: "食費", type: "expense", color: "#f97316" },
      { id: "c8", name: "給与", type: "income", color: "#22c55e" },
    ],
    Transactions: [
      { id: "t1", date: "2026-09-01", amount: 3000, type: "expense", categoryId: "c1", memberId: "m1", memo: "E2Eシード" },
      // 横断検索の「全件表示」ページ（8件超のオーバーフロー）をテストするための種データ
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `search${i}`,
        date: `2026-08-${String(10 + i).padStart(2, "0")}`,
        amount: 100 + i,
        type: "expense",
        categoryId: "c1",
        memberId: "m1",
        memo: `検索テスト${i}`,
      })),
    ],
    Events: [],
    AssetAccounts: [
      { id: "a1", name: "普通預金", type: "bank", memberId: "m1", currency: "" },
      { id: "a2", name: "米国株口座", type: "investment", memberId: "m2", currency: "USD" },
    ],
    AssetSnapshots: [
      { id: "s1", assetAccountId: "a1", date: "2026-08-01", value: 1000000, note: "", costBasis: "", fxRate: "" },
    ],
  };
}

const DB = freshDb();

function json(res, obj, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
}

function getSheet(name) {
  return SHEET_DEFS[name] ? DB[name] : null;
}

const server = createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (req.method === "GET") {
    const sheetName = url.searchParams.get("sheet");
    if (!sheetName) return json(res, { sheets: Object.keys(SHEET_DEFS) });
    const sheet = getSheet(sheetName);
    if (!sheet) return json(res, { error: "sheet not found: " + sheetName }, 404);
    return json(res, sheet);
  }

  if (req.method === "POST") {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      let body;
      try {
        body = JSON.parse(raw);
      } catch (e) {
        return json(res, { error: "bad json: " + String(e) }, 400);
      }
      const { sheet: sheetName, action, id, data } = body;
      const sheet = getSheet(sheetName);
      if (!sheet) return json(res, { error: "sheet not found: " + sheetName }, 404);

      if (action === "create") {
        const row = { ...data };
        if (!row.id) row.id = randomUUID();
        sheet.push(row);
        return json(res, { ok: true, row });
      }
      if (action === "update") {
        const idx = sheet.findIndex((r) => String(r.id) === String(id));
        if (idx === -1) return json(res, { error: "id not found: " + id }, 404);
        sheet[idx] = { ...sheet[idx], ...data };
        return json(res, { ok: true, row: sheet[idx] });
      }
      if (action === "delete") {
        const idx = sheet.findIndex((r) => String(r.id) === String(id));
        if (idx === -1) return json(res, { error: "id not found: " + id }, 404);
        sheet.splice(idx, 1);
        return json(res, { ok: true });
      }
      return json(res, { error: "unknown action: " + action }, 400);
    });
    return;
  }

  json(res, { error: "method not allowed" }, 405);
});

const PORT = process.env.MOCK_GAS_PORT ? Number(process.env.MOCK_GAS_PORT) : 4545;
server.listen(PORT, () => {
  console.log(`mock GAS server listening on http://localhost:${PORT}`);
});
