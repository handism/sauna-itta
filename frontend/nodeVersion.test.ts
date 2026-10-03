import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import packageJson from "./package.json";

// CI と Docker は .nvmrc（リポジトリ直下）の版を使い、vitest.config.ts は engines で実行環境を確かめる。
// 片方だけ上げると、どちらかの確認が古い版を基準にしてしまうため、両者の一致を検査する。
const nvmrcPath = path.resolve(__dirname, "../.nvmrc");

describe("Node.js の版", () => {
  // frontend/ だけをビルドコンテキストにする開発用コンテナには .nvmrc が無い
  it.skipIf(!existsSync(nvmrcPath))("package.json の engines は .nvmrc の版と揃っている", () => {
    const nvmrcMajor = readFileSync(nvmrcPath, "utf8").trim().replace(/^v/, "").split(".")[0];
    expect(packageJson.engines.node).toBe(`>=${nvmrcMajor}`);
  });
});
