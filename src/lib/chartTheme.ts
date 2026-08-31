/**
 * Recharts の Tooltip/Legend はデフォルトだと白背景・黒文字で描画され、
 * カード全体を統一している --surface / --line / --foreground などの
 * デザイントークンから浮いて見える。CSS変数はSVG外のポータルに反映されない
 * ケースがあるため、実際の色は getComputedStyle で解決してから渡す。
 */
function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function chartTooltipStyle() {
  return {
    contentStyle: {
      background: cssVar("--surface", "#ffffff"),
      border: `1px solid ${cssVar("--line", "#e6e9ee")}`,
      borderRadius: 12,
      boxShadow: "0 8px 24px -10px rgba(16, 24, 40, 0.24)",
      color: cssVar("--foreground", "#12141a"),
      fontSize: 13,
      padding: "8px 12px",
    },
    labelStyle: {
      color: cssVar("--muted", "#97a0ac"),
      fontSize: 12,
      marginBottom: 2,
    },
    itemStyle: {
      color: cssVar("--foreground", "#12141a"),
    },
    cursor: { fill: cssVar("--track", "#eef0f4") },
  };
}

export function chartLegendStyle() {
  return {
    fontSize: 12,
    color: cssVar("--subtle", "#59616d"),
  };
}
