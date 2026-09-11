/**
 * サーバーアクションのエラーはトーストに要約だけ出すと原因が追えなくなるため、
 * コンソールに詳細を残しつつユーザーには実際のエラー内容を含めて表示する。
 */
export function describeError(err: unknown, fallback: string): string {
  console.error(err);
  const detail = err instanceof Error ? err.message : String(err);
  return detail ? `${fallback}（${detail}）` : fallback;
}
