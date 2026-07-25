import type { CSSProperties } from "react";

export type ChartTheme = "dark" | "light";

export interface ChartColors {
  /** 軸ラベル・目盛りの文字色 */
  tick: string;
  /** グリッド線・軸線の色 */
  grid: string;
  /** 強調テキスト（ツールチップ本文・中央表示など）の色 */
  text: string;
  /** ホバー時に棒の背後へ敷くカーソルの塗り */
  cursorFill: string;
}

const CHART_COLORS: Record<ChartTheme, ChartColors> = {
  light: {
    tick: "rgba(30, 41, 59, 0.8)",
    grid: "rgba(15, 23, 42, 0.08)",
    text: "#1e293b",
    cursorFill: "rgba(0, 0, 0, 0.04)",
  },
  dark: {
    tick: "rgba(241, 245, 249, 0.8)",
    grid: "rgba(241, 245, 249, 0.1)",
    text: "#f8fafc",
    cursorFill: "rgba(255, 255, 255, 0.05)",
  },
};

export function getChartColors(theme: ChartTheme): ChartColors {
  return CHART_COLORS[theme];
}

/**
 * Recharts の <Tooltip contentStyle> 用スタイル。
 * グラフを追加する際もこれを使い、ツールチップの見た目を揃えること。
 */
export function getTooltipStyle(theme: ChartTheme): CSSProperties {
  const colors = getChartColors(theme);
  return {
    backgroundColor:
      theme === "light" ? "rgba(255, 255, 255, 0.92)" : "rgba(20, 24, 33, 0.92)",
    backdropFilter: "blur(12px)",
    borderColor: theme === "light" ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.15)",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
    color: colors.text,
    fontWeight: 600,
    fontSize: "13px",
    padding: "8px 14px",
  };
}
