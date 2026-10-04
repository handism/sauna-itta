import { describe, it, expect } from "vitest";
import { getChartColors, getTooltipStyle } from "./chartTheme";

describe("chartTheme", () => {
  describe("getChartColors", () => {
    it("should return the correct colors for light theme", () => {
      const colors = getChartColors("light");
      expect(colors).toMatchObject({
        tick: "rgba(30, 41, 59, 0.8)",
        grid: "rgba(15, 23, 42, 0.08)",
        text: "#1e293b",
        cursorFill: "rgba(0, 0, 0, 0.04)",
      });
    });

    it("should return the correct colors for dark theme", () => {
      const colors = getChartColors("dark");
      expect(colors).toMatchObject({
        tick: "rgba(241, 245, 249, 0.8)",
        grid: "rgba(241, 245, 249, 0.1)",
        text: "#f8fafc",
        cursorFill: "rgba(255, 255, 255, 0.05)",
      });
    });
  });

  describe("満足度の配色", () => {
    // 相対輝度（WCAG）。評価の段階が明るさの順に並んでいるかを確かめる
    const luminance = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => {
        const c = parseInt(hex.slice(i, i + 2), 16) / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const ratings = [5, 4, 3, 2, 1] as const;

    it("ダークでは高い評価ほど明るい（暗い背景から浮く）", () => {
      const { rating } = getChartColors("dark");
      const values = ratings.map((r) => luminance(rating[r]));
      expect(values).toEqual([...values].sort((a, b) => b - a));
      expect(new Set(values).size).toBe(5);
    });

    it("ライトでは高い評価ほど暗い（明るい背景から浮く）", () => {
      const { rating } = getChartColors("light");
      const values = ratings.map((r) => luminance(rating[r]));
      expect(values).toEqual([...values].sort((a, b) => a - b));
      expect(new Set(values).size).toBe(5);
    });
  });

  describe("getTooltipStyle", () => {
    it("should return the correct style for light theme", () => {
      const style = getTooltipStyle("light");
      expect(style.backgroundColor).toBe("rgba(255, 255, 255, 0.92)");
      expect(style.backdropFilter).toBe("blur(12px)");
      expect(style.borderColor).toBe("rgba(0, 0, 0, 0.1)");
      expect(style.borderRadius).toBe("12px");
      expect(style.boxShadow).toBe("0 10px 25px rgba(0,0,0,0.2)");
      expect(style.color).toBe("#1e293b"); // text color for light theme
      expect(style.fontWeight).toBe(600);
      expect(style.fontSize).toBe("13px");
      expect(style.padding).toBe("8px 14px");
    });

    it("should return the correct style for dark theme", () => {
      const style = getTooltipStyle("dark");
      expect(style.backgroundColor).toBe("rgba(20, 24, 33, 0.92)");
      expect(style.backdropFilter).toBe("blur(12px)");
      expect(style.borderColor).toBe("rgba(255, 255, 255, 0.15)");
      expect(style.borderRadius).toBe("12px");
      expect(style.boxShadow).toBe("0 10px 25px rgba(0,0,0,0.2)");
      expect(style.color).toBe("#f8fafc"); // text color for dark theme
      expect(style.fontWeight).toBe(600);
      expect(style.fontSize).toBe("13px");
      expect(style.padding).toBe("8px 14px");
    });
  });
});
