/**
 * 家計・資産管理アプリ用データベース（スプレッドシート）自動作成スクリプト
 *
 * 使い方:
 * 1. https://script.google.com/ にアクセスし「新しいプロジェクト」を作成
 * 2. デフォルトの Code.gs の中身を全て削除し、このファイルの内容を貼り付け
 * 3. 上部の関数選択プルダウンで setupDatabase を選び「実行」ボタンを押す
 * 4. 初回は権限の承認を求められるので許可する
 * 5. 実行後、画面下部の「実行ログ」に作成されたスプレッドシートのURLが出力される
 *    （出ていない場合は 表示 > 実行数 / 実行ログ から確認できます）
 * 6. そのURLをこの後の会話で渡してください。アプリに組み込みます
 *
 * 併せて Web アプリとしてデプロイ（デプロイ > 新しいデプロイ > 種類: ウェブアプリ、
 * 実行ユーザー: 自分、アクセスできるユーザー: 全員）すると、
 * doGet / doPost 経由でこのシートをそのままAPIとして使えるようにしてあります。
 * その場合は「ウェブアプリのURL」の方を渡してください（推奨）。
 *
 * 既にこのスクリプトで作成済みのスプレッドシートを使っている場合（アップデート時）:
 * このファイルの内容を丸ごと貼り替えたあと、関数選択プルダウンで次を順に実行してください
 * （どちらも、既に列がある場合は何もしないので、間違って複数回実行しても安全です）。
 * - migrateAddMemberIdToTransactions （Transactions シートに記録者(memberId)列を追加）
 * - migrateAddInvestmentColumns （AssetAccounts に通貨(currency)列、
 *   AssetSnapshots に元本(costBasis)・為替レート(fxRate)列を追加）
 */

// ---- シート定義（列の並び = ヘッダー） ----------------------------------
const SHEET_DEFS = {
  Members: ["id", "name", "color"],
  Categories: ["id", "name", "type", "color"],
  Transactions: ["id", "date", "amount", "type", "categoryId", "memberId", "memo"],
  Events: ["id", "title", "startDate", "startTime", "endDate", "endTime", "memberId", "recurrence", "memo"],
  AssetAccounts: ["id", "name", "type", "memberId", "currency"],
  AssetSnapshots: ["id", "assetAccountId", "date", "value", "note", "costBasis", "fxRate"],
};

// ---- 初期データ（今アプリで使っているサンプルと同じ内容） -------------------
const SEED_DATA = {
  Members: [
    ["m1", "たろう", "#3b82f6"],
    ["m2", "はなこ", "#ec4899"],
    ["m3", "こども", "#22c55e"],
  ],
  Categories: [
    ["c1", "食費", "expense", "#f97316"],
    ["c2", "光熱費", "expense", "#eab308"],
    ["c3", "住居費", "expense", "#8b5cf6"],
    ["c4", "通信費", "expense", "#06b6d4"],
    ["c5", "日用品", "expense", "#10b981"],
    ["c6", "交通費", "expense", "#6366f1"],
    ["c7", "娯楽費", "expense", "#f43f5e"],
    ["c8", "給与", "income", "#22c55e"],
    ["c9", "その他収入", "income", "#84cc16"],
  ],
  Transactions: [
    ["t1", "2026-08-01", 320000, "income", "c8", "m1", "給料"],
    ["t2", "2026-08-01", 180000, "income", "c8", "m2", "給料"],
    ["t3", "2026-08-02", 8500, "expense", "c1", "m2", "スーパー"],
    ["t4", "2026-08-03", 12000, "expense", "c3", "m1", "家賃一部"],
    ["t5", "2026-08-04", 4200, "expense", "c2", "m1", "電気代"],
    ["t6", "2026-08-05", 5400, "expense", "c4", "m1", "携帯代"],
    ["t7", "2026-08-05", 3200, "expense", "c6", "m2", "電車代"],
    ["t8", "2026-08-06", 6800, "expense", "c7", "m1", "映画・外食"],
    ["t9", "2026-08-06", 2100, "expense", "c5", "m2", "日用品購入"],
  ],
  Events: [
    ["e1", "家族会議", "2026-08-06", "20:00", "2026-08-06", "21:00", "m1", "none", ""],
    ["e2", "こども 歯科検診", "2026-08-08", "10:30", "2026-08-08", "11:00", "m3", "none", ""],
    ["e3", "ゴミ出し（燃えるゴミ）", "2026-08-10", "", "2026-08-10", "", "m2", "weekly", ""],
    ["e4", "給料日", "2026-08-25", "", "2026-08-25", "", "m1", "monthly", ""],
    ["e5", "はなこ ヨガ教室", "2026-08-12", "19:00", "2026-08-12", "20:00", "m2", "weekly", ""],
    ["e6", "家族旅行", "2026-08-15", "", "2026-08-17", "", "m1", "none", ""],
    ["e7", "住宅ローン引き落とし", "2026-08-27", "", "2026-08-27", "", "m1", "monthly", ""],
    ["e8", "こども 授業参観", "2026-08-20", "13:00", "2026-08-20", "14:00", "m3", "none", ""],
  ],
  AssetAccounts: [
    ["a1", "普通預金（三井住友）", "bank", "m1", ""],
    ["a2", "定期預金", "bank", "m1", ""],
    ["a3", "現金（財布）", "cash", "m2", ""],
    ["a4", "つみたてNISA（eMAXIS Slim）", "investment", "m1", ""],
    ["a5", "特定口座（米国株）", "investment", "m2", "USD"],
  ],
  // 列: id, assetAccountId, date, value, note, costBasis（元本・任意）, fxRate（為替レート・外貨口座のみ）
  AssetSnapshots: [
    ["s1", "a1", "2026-05-31", 1200000, "", "", ""],
    ["s2", "a1", "2026-06-30", 1350000, "", "", ""],
    ["s3", "a1", "2026-07-31", 1280000, "", "", ""],
    ["s4", "a1", "2026-08-05", 1420000, "", "", ""],
    ["s5", "a2", "2026-05-31", 2000000, "", "", ""],
    ["s6", "a2", "2026-06-30", 2000000, "", "", ""],
    ["s7", "a2", "2026-07-31", 2000000, "", "", ""],
    ["s8", "a2", "2026-08-05", 2005000, "", "", ""],
    ["s9", "a3", "2026-05-31", 45000, "", "", ""],
    ["s10", "a3", "2026-06-30", 38000, "", "", ""],
    ["s11", "a3", "2026-07-31", 52000, "", "", ""],
    ["s12", "a3", "2026-08-05", 41000, "", "", ""],
    ["s13", "a4", "2026-05-31", 850000, "", 800000, ""],
    ["s14", "a4", "2026-06-30", 910000, "", 850000, ""],
    ["s15", "a4", "2026-07-31", 890000, "", 850000, ""],
    ["s16", "a4", "2026-08-05", 965000, "", 900000, ""],
    ["s17", "a5", "2026-05-31", 4200, "", 4000, 148.5],
    ["s18", "a5", "2026-06-30", 4350, "", 4000, 149.2],
    ["s19", "a5", "2026-07-31", 4500, "", 4000, 150.1],
    ["s20", "a5", "2026-08-05", 4600, "", 4200, 151.0],
  ],
};

/**
 * メイン: 新しいスプレッドシートを作成し、全シート・ヘッダー・初期データを作る。
 * 実行後、URLが実行ログに出力される。
 */
function setupDatabase() {
  const ss = SpreadsheetApp.create("家計・資産管理アプリ DB");

  // デフォルトで作られる「シート1」は最後に削除する
  const defaultSheet = ss.getSheets()[0];

  Object.keys(SHEET_DEFS).forEach(function (sheetName) {
    const headers = SHEET_DEFS[sheetName];
    const sheet = ss.insertSheet(sheetName);

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);

    const seed = SEED_DATA[sheetName];
    if (seed && seed.length > 0) {
      sheet.getRange(2, 1, seed.length, headers.length).setValues(seed);
    }

    sheet.autoResizeColumns(1, headers.length);
  });

  ss.deleteSheet(defaultSheet);

  const url = ss.getUrl();
  Logger.log("=====================================");
  Logger.log("作成しました。以下のURLを控えてください:");
  Logger.log(url);
  Logger.log("=====================================");
  console.log("Database created:", url);
  return url;
}

/**
 * マイグレーション共通ヘルパー: シートに columnName 列が無ければ末尾に追加する。
 * 既にある場合は何もしない（戻り値 false）ので、複数回実行しても安全。
 */
function addColumnIfMissing_(sheet, columnName) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (headers.indexOf(columnName) !== -1) return false;
  const col = headers.length + 1;
  sheet.insertColumnAfter(headers.length);
  sheet.getRange(1, col).setValue(columnName);
  return true;
}

/**
 * 既存のスプレッドシート用マイグレーション:
 * 以前のバージョンで作成した Transactions シートには memberId 列が無く、
 * 家計簿の記録者（メンバー）が保存されずに欠落していた。この関数を1回だけ
 * 実行すると、Transactions シートに memberId 列（無ければ）を追加する。
 * 既に列がある場合は何もしない（複数回実行しても安全）。
 */
function migrateAddMemberIdToTransactions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Transactions");
  if (!sheet) {
    Logger.log("Transactions シートが見つかりません。");
    return;
  }
  const added = addColumnIfMissing_(sheet, "memberId");
  Logger.log(added ? "memberId 列を追加しました。" : "memberId 列は既に存在します。何もしませんでした。");
}

/**
 * 既存のスプレッドシート用マイグレーション:
 * 投資口座の含み損益（元本との差分）・外貨建て資産に対応するため、
 * AssetAccounts に通貨(currency)列、AssetSnapshots に元本(costBasis)・
 * 為替レート(fxRate)列を追加する。どちらもすべて空欄のまま追加され、
 * 既存データはこれまで通り円建て・元本未記録として扱われる
 * （空欄なら含み損益・外貨換算の表示は出ない）。
 * 既に列がある場合は何もしない（複数回実行しても安全）。
 */
function migrateAddInvestmentColumns() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const accounts = ss.getSheetByName("AssetAccounts");
  const snapshots = ss.getSheetByName("AssetSnapshots");
  if (!accounts || !snapshots) {
    Logger.log("AssetAccounts または AssetSnapshots シートが見つかりません。");
    return;
  }
  const addedCurrency = addColumnIfMissing_(accounts, "currency");
  const addedCostBasis = addColumnIfMissing_(snapshots, "costBasis");
  const addedFxRate = addColumnIfMissing_(snapshots, "fxRate");
  Logger.log(
    "currency: " + (addedCurrency ? "追加しました" : "既に存在") +
    " / costBasis: " + (addedCostBasis ? "追加しました" : "既に存在") +
    " / fxRate: " + (addedFxRate ? "追加しました" : "既に存在")
  );
}

// ---- ここから下は Web アプリとしてデプロイした場合に使う簡易API -------------
// GET  ?sheet=Transactions            -> そのシートの全行をJSON配列で返す
// GET  （sheet指定なし）                -> シート名の一覧を返す
// POST { sheet, action, id, data }    -> action: "create" | "update" | "delete"

function doGet(e) {
  const sheetName = e && e.parameter && e.parameter.sheet;
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!sheetName) {
    return jsonResponse_({ sheets: Object.keys(SHEET_DEFS) });
  }

  const sheet = getSheet_(ss, sheetName);
  if (!sheet) return jsonResponse_({ error: "sheet not found: " + sheetName }, 404);

  return jsonResponse_(sheetToObjects_(sheet));
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getSheet_(ss, body.sheet);
    if (!sheet) return jsonResponse_({ error: "sheet not found: " + body.sheet }, 404);

    if (body.action === "create") {
      const row = createRow_(sheet, body.data);
      return jsonResponse_({ ok: true, row: row });
    }
    if (body.action === "update") {
      const row = updateRow_(sheet, body.id, body.data);
      if (!row) return jsonResponse_({ error: "id not found: " + body.id }, 404);
      return jsonResponse_({ ok: true, row: row });
    }
    if (body.action === "delete") {
      const deleted = deleteRow_(sheet, body.id);
      if (!deleted) return jsonResponse_({ error: "id not found: " + body.id }, 404);
      return jsonResponse_({ ok: true });
    }
    return jsonResponse_({ error: "unknown action: " + body.action }, 400);
  } catch (err) {
    return jsonResponse_({ error: String(err) }, 500);
  }
}

// ---- 内部ヘルパー ----------------------------------------------------------

function getSheet_(ss, name) {
  if (!SHEET_DEFS[name]) return null;
  return ss.getSheetByName(name);
}

// Google Sheets は "2026-08-06" や "20:00" のような文字列を自動で日付/時刻型に
// 変換してしまうため、読み書きの両方でプレーンな文字列に正規化する。
function isDateColumn_(header) {
  return /date$/i.test(header) || header === "date";
}
function isTimeColumn_(header) {
  return /time$/i.test(header);
}

function normalizeReadValue_(value, header, tz) {
  if (Object.prototype.toString.call(value) === "[object Date]") {
    if (isTimeColumn_(header)) return Utilities.formatDate(value, tz, "HH:mm");
    if (isDateColumn_(header)) return Utilities.formatDate(value, tz, "yyyy-MM-dd");
    return Utilities.formatDate(value, tz, "yyyy-MM-dd'T'HH:mm:ss");
  }
  return value;
}

function sheetToObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const tz = Session.getScriptTimeZone();
  return values.slice(1).map(function (row) {
    const obj = {};
    headers.forEach(function (h, i) {
      obj[h] = normalizeReadValue_(row[i], h, tz);
    });
    return obj;
  });
}

// 日付/時刻っぽい列は書き込み前にセル書式をプレーンテキストへ強制し、
// Sheets側の自動変換で値が壊れるのを防ぐ。
function forceTextFormat_(sheet, rowIndex, headers) {
  headers.forEach(function (h, i) {
    if (isDateColumn_(h) || isTimeColumn_(h)) {
      sheet.getRange(rowIndex, i + 1).setNumberFormat("@");
    }
  });
}

function createRow_(sheet, data) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (!data.id) {
    data.id = Utilities.getUuid();
  }
  const rowIndex = sheet.getLastRow() + 1;
  forceTextFormat_(sheet, rowIndex, headers);
  const row = headers.map(function (h) {
    return data[h] !== undefined ? data[h] : "";
  });
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([row]);
  return data;
}

function findRowIndexById_(sheet, id) {
  const ids = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 0), 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2; // +2: header行 + 0始まり補正
  }
  return -1;
}

function updateRow_(sheet, id, data) {
  const rowIndex = findRowIndexById_(sheet, id);
  if (rowIndex === -1) return null;

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const tz = Session.getScriptTimeZone();
  const current = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0]
    .map(function (v, i) { return normalizeReadValue_(v, headers[i], tz); });

  forceTextFormat_(sheet, rowIndex, headers);
  const merged = headers.map(function (h, i) {
    return data[h] !== undefined ? data[h] : current[i];
  });
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([merged]);

  const obj = {};
  headers.forEach(function (h, i) {
    obj[h] = merged[i];
  });
  return obj;
}

function deleteRow_(sheet, id) {
  const rowIndex = findRowIndexById_(sheet, id);
  if (rowIndex === -1) return false;
  sheet.deleteRow(rowIndex);
  return true;
}

function jsonResponse_(obj, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
