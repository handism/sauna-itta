import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * CSS は jsdom 上で評価されないため、デザイントークンの規約
 * （AGENTS.md「CSS ＆ スタイリング」）を静的検査で担保する。
 */
const STYLE_DIR = __dirname;

const styleFiles = readdirSync(STYLE_DIR)
  .filter((file) => file.endsWith(".css"))
  .map((file) => ({ file, css: readFileSync(join(STYLE_DIR, file), "utf8") }));

// JS が実行時に設定する変数は base.css には定義されない
const RUNTIME_DEFINED = new Set(["--drag-offset-y", "--font-outfit"]);

const definedTokens = (() => {
  const base = readFileSync(join(STYLE_DIR, "base.css"), "utf8");
  return new Set(base.match(/^\s*(--[a-z0-9-]+):/gm)?.map((line) => line.trim().replace(":", "")) ?? []);
})();

describe("CSS デザイントークンの規約", () => {
  it("スタイルファイルが読み込めていること", () => {
    expect(styleFiles.length).toBeGreaterThan(0);
  });

  it("var() にハードコードされた色のフォールバックを持たないこと", () => {
    const offenders = styleFiles.flatMap(({ file, css }) =>
      (css.match(/var\(--[a-z0-9-]+, *(?:#[0-9a-fA-F]{3,8}|rgba?\([^()]*\))\)/g) ?? []).map(
        (match) => `${file}: ${match}`
      )
    );

    // 未定義変数を隠すうえ、ダーク固定色がライトテーマに漏れる
    expect(offenders).toEqual([]);
  });

  it("参照している変数が base.css に定義されていること", () => {
    const offenders = styleFiles.flatMap(({ file, css }) =>
      (css.match(/var\((--[a-z0-9-]+)/g) ?? [])
        .map((match) => match.replace("var(", ""))
        .filter((token) => !definedTokens.has(token) && !RUNTIME_DEFINED.has(token))
        .map((token) => `${file}: ${token}`)
    );

    // 未定義変数は無言で無効化され、背景が透明になる等の不具合になる
    expect([...new Set(offenders)]).toEqual([]);
  });

  it("面に重ねる色は白の直書きではなくトークンを使うこと", () => {
    // base.css はトークン定義そのもの、map.css のマーカーは地図タイル上の
    // コントラスト確保のため意図的に白枠・白文字を使う
    const targets = styleFiles.filter(
      ({ file }) => file !== "base.css" && file !== "map.css"
    );

    /** 彩度の高い塗りの上のハイライトなど、テーマに依存せず成立する例外 */
    const ALLOWED_SELECTORS = [".btn-primary"];

    const offenders = targets.flatMap(({ file, css }) =>
      [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
        .filter(([, , body]) => /rgba\(255, *255, *255/.test(body))
        .map(([, selector]) => ({ file, selector: selector.trim().replace(/\s+/g, " ") }))
        .filter(
          ({ selector }) =>
            // ライトテーマ用の明示的な上書きは対象外
            !selector.includes("light-theme") &&
            !ALLOWED_SELECTORS.some((allowed) => selector.includes(allowed))
        )
        .map(({ selector }) => `${file}: ${selector}`)
    );

    expect(offenders).toEqual([]);
  });

  it("影は rgba(0, 0, 0, ...) の直書きではなくトークンを使うこと", () => {
    /*
     * --shadow-* はライトテーマで弱い値へ差し替わる。直書きするとその切り替えから
     * 漏れ、明るい背景に濃い黒の影が落ちる。統計ページの CSS Modules も対象に含める。
     */
    const targets = [
      ...styleFiles.filter(({ file }) => file !== "base.css"),
      {
        file: "app/stats/stats.module.css",
        css: readFileSync(resolve(STYLE_DIR, "../../../app/stats/stats.module.css"), "utf8"),
      },
    ];

    const offenders = targets.flatMap(({ file, css }) =>
      (css.match(/box-shadow:[^;]*rgba\(0, *0, *0[^;]*;/g) ?? []).map(
        (match) => `${file}: ${match.replace(/\s+/g, " ")}`
      )
    );

    expect(offenders).toEqual([]);
  });

  it("エラー色は直書きせず --error / --error-text を使うこと", () => {
    // #ef4444 系を直書きすると、ライトテーマで文字色のコントラストが 4.5:1 を下回る
    const offenders = styleFiles
      .filter(({ file }) => file !== "base.css")
      .flatMap(({ file, css }) =>
        (css.match(/#ef4444|#f87171|#fca5a5|rgba\(239, *68, *68/gi) ?? []).map(
          (match) => `${file}: ${match}`
        )
      );

    expect([...new Set(offenders)]).toEqual([]);
  });

  it("色を持つトークンが :root と .light-theme の両方に定義されていること", () => {
    const base = readFileSync(join(STYLE_DIR, "base.css"), "utf8");
    const blockOf = (selector: string) => {
      const match = base.match(new RegExp(`${selector}\\s*\\{([^{}]*)\\}`));
      if (!match) throw new Error(`${selector} ブロックが見つかりません`);
      return match[1];
    };
    const tokensIn = (block: string) =>
      new Map(
        [...block.matchAll(/^\s*(--[a-z0-9-]+):\s*([^;]+);/gm)].map(([, name, value]) => [
          name,
          value,
        ])
      );

    const rootTokens = tokensIn(blockOf(":root"));
    const lightTokens = tokensIn(blockOf("\\.light-theme"));

    /*
     * ライトテーマで意図的に共有するトークン。増やす場合は必ず理由を添えること。
     * --shadow-marker 系: 地図タイル上のマーカー用。弱めるとタイルに溶けて位置が読めない。
     * --error:            面の色として両テーマで成立する（文字色には --error-text を使う）。
     */
    const SHARED_ON_PURPOSE = new Set([
      "--shadow-marker-sm",
      "--shadow-marker",
      "--shadow-marker-lifted",
      "--error",
    ]);

    const hasLiteralColor = (value: string) => /#[0-9a-f]{3,8}|rgba?\(/i.test(value);

    const offenders = [...rootTokens]
      .filter(
        ([name, value]) =>
          hasLiteralColor(value) && !lightTokens.has(name) && !SHARED_ON_PURPOSE.has(name)
      )
      .map(([name]) => name);

    // 未上書きのままだと、ダーク前提の濃い色がライトテーマへそのまま漏れる
    expect(offenders).toEqual([]);
  });

  it("CSS のクラス名がコンポーネント側に存在すること", () => {
    /*
     * `.mobile-nav-icon-add` と `mobile-nav-icon--add` のような綴り違いは
     * 誰もエラーにしてくれず、スタイルが当たらないまま放置される。
     */
    const srcDir = resolve(STYLE_DIR, "../../..");
    const codeTokens = new Set<string>();
    const collect = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          collect(full);
        } else if (/\.tsx?$/.test(entry.name)) {
          for (const token of readFileSync(full, "utf8").match(/[A-Za-z0-9_-]+/g) ?? []) {
            codeTokens.add(token);
          }
        }
      }
    };
    collect(srcDir);

    // Leaflet 由来のクラスと、テンプレートリテラルで組み立てる修飾子は対象外
    const IGNORED_PREFIXES = ["leaflet-", "app-toast--", "bottom-sheet--"];

    const offenders = styleFiles.flatMap(({ file, css }) =>
      [...new Set((css.match(/\.(-?[A-Za-z_][A-Za-z0-9_-]*)/g) ?? []).map((m) => m.slice(1)))]
        .filter(
          (cls) =>
            !codeTokens.has(cls) &&
            !IGNORED_PREFIXES.some((prefix) => cls.startsWith(prefix))
        )
        .map((cls) => `${file}: .${cls}`)
    );

    expect(offenders).toEqual([]);
  });

  it("モバイル境界が JS の「768px 未満」と一致していること", () => {
    const offenders = styleFiles
      .filter(({ css }) => css.includes("@media (max-width: 768px)"))
      .map(({ file }) => file);
    const bottomSheet = readFileSync(join(STYLE_DIR, "bottom-sheet.css"), "utf8");

    expect(offenders).toEqual([]);
    expect(bottomSheet).toContain("@media (max-width: 767px)");
    expect(bottomSheet).toContain("@media (min-width: 768px)");
  });

  it("見落としやすいモバイル操作にも 44px のターゲットが定義されていること", () => {
    const bottomSheet = readFileSync(join(STYLE_DIR, "bottom-sheet.css"), "utf8");
    const visitCard = readFileSync(join(STYLE_DIR, "visit-card.css"), "utf8");
    const stats = readFileSync(
      resolve(STYLE_DIR, "../../../app/stats/stats.module.css"),
      "utf8"
    );

    expect(bottomSheet).toMatch(
      /\.mobile-nav-item\s*\{[^}]*min-height:\s*44px;[^}]*height:\s*100%;/
    );
    expect(visitCard).toMatch(
      /@media \(max-width: 767px\)[\s\S]*\.history-delete-btn\s*\{[^}]*width:\s*44px;/
    );
    expect(stats).toMatch(
      /@media \(max-width: 720px\)[\s\S]*\.backLink\s*\{[^}]*height:\s*44px;/
    );
  });
});
