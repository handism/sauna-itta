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
  /**
   * 満足度 ★1〜★5 の塗り。評価は順序のある値なので、色相を変えず（アプリのアンバー）
   * 明るさの段階で並べる。高い評価ほど背景から強く浮き、低い評価ほど背景へ退く。
   * 緑・青・赤のように色相で分けると、どれが高い評価なのかを凡例を見ないと読めない。
   * 低い段を灰色へ寄せないこと（★2〜★3 が茶色に濁って隣の段と見分けられず、
   * ★4 と ★5 も明るさの差が小さいと同じ色に見えた）。各段の明るさの差を揃えて並べる。
   */
  rating: Record<1 | 2 | 3 | 4 | 5, string>;
}

const CHART_COLORS: Record<ChartTheme, ChartColors> = {
  light: {
    tick: "rgba(30, 41, 59, 0.8)",
    grid: "rgba(15, 23, 42, 0.08)",
    text: "#1e293b",
    cursorFill: "rgba(0, 0, 0, 0.04)",
    rating: { 5: "#b84a06", 4: "#dd6f1f", 3: "#ef944f", 2: "#f5b585", 1: "#f8d3b2" },
  },
  dark: {
    tick: "rgba(241, 245, 249, 0.8)",
    grid: "rgba(241, 245, 249, 0.1)",
    text: "#f8fafc",
    cursorFill: "rgba(255, 255, 255, 0.05)",
    rating: { 5: "#ffb457", 4: "#f78c3c", 3: "#d2692a", 2: "#9c4f25", 1: "#6e3e26" },
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
