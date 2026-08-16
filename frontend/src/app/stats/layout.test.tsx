import { describe, expect, it } from "vitest";
import StatsLayout, { metadata } from "./layout";

describe("StatsLayout", () => {
  describe("metadata", () => {
    it("統計ダッシュボード用のタイトルと説明が設定されていること", () => {
      expect(metadata.title).toBe("統計ダッシュボード | サウナイッタ");
      expect(metadata.description).toBe(
        "あなたのサウナ訪問履歴を月別訪問数・満足度分布・カレンダーでまとめたダッシュボードです。",
      );
    });
  });

  describe("コンポーネント描画", () => {
    it("children をそのままパススルーしてレンダリングすること", () => {
      const child = <div data-testid="test-child">統計コンテンツ</div>;
      const result = StatsLayout({ children: child });
      expect(result).toBe(child);
    });
  });
});
