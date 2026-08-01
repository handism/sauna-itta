import { describe, it, expect } from "vitest";
import { getChartColors, getTooltipStyle } from "./chartTheme";

describe("chartTheme", () => {
  describe("getChartColors", () => {
    it("should return the correct colors for light theme", () => {
      const colors = getChartColors("light");
      expect(colors).toEqual({
        tick: "rgba(30, 41, 59, 0.8)",
        grid: "rgba(15, 23, 42, 0.08)",
        text: "#1e293b",
        cursorFill: "rgba(0, 0, 0, 0.04)",
      });
    });

    it("should return the correct colors for dark theme", () => {
      const colors = getChartColors("dark");
      expect(colors).toEqual({
        tick: "rgba(241, 245, 249, 0.8)",
        grid: "rgba(241, 245, 249, 0.1)",
        text: "#f8fafc",
        cursorFill: "rgba(255, 255, 255, 0.05)",
      });
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
