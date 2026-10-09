import { describe, test, expect } from "vitest";
import type { SaunaVisit } from "../types";
import { IMPORT_MAX_BATCH_BYTES, dropApiImageUrls, chunkVisitsForImport, parseImportText, filterNewVisits, ImportFileError } from "./visitImport";

describe("dropApiImageUrls", () => {
  test("画像エンドポイントの URL だけを外し、記録本体の写しも最新履歴へ揃える", () => {
    const visit: SaunaVisit = {
      id: "1",
      name: "Sauna A",
      lat: 35,
      lng: 139,
      comment: "latest",
      date: "2026-08-02",
      image: "/api/v1/images/latest",
      visitCount: 3,
      history: [
        { date: "2026-08-01", comment: "first", image: "data:image/png;base64,AAAA" },
        { date: "2026-08-02", comment: "latest", image: "/api/v1/images/latest" },
      ],
    };

    const { visits, droppedImages } = dropApiImageUrls([visit]);

    expect(droppedImages).toBe(1);
    expect(visits[0].image).toBeUndefined();
    expect(visits[0].history?.[0].image).toBe("data:image/png;base64,AAAA");
    expect(visits[0].history?.[1].image).toBeUndefined();
    // 旧形式から引き継いだ訪問回数は取り込みでは維持する
    expect(visits[0].visitCount).toBe(3);
  });

  test("外す写真がない記録は同じ参照のまま返す", () => {
    const visit: SaunaVisit = {
      id: "1", name: "Sauna A", lat: 35, lng: 139, comment: "", date: "2026-08-02",
      history: [{ date: "2026-08-02", comment: "" }],
    };
    const { visits, droppedImages } = dropApiImageUrls([visit]);
    expect(droppedImages).toBe(0);
    expect(visits[0]).toBe(visit);
  });
});

describe("chunkVisitsForImport", () => {
  const visit = (id: string, comment = ""): SaunaVisit => ({ id, name: id, lat: 35, lng: 139, comment, date: "2026-08-02" });
  const bytesOf = (item: SaunaVisit) => new TextEncoder().encode(JSON.stringify(item)).byteLength;

  test("件数の上限で区切る", () => {
    const visits = Array.from({ length: 25 }, (_, index) => visit(`v${index}`));
    expect(chunkVisitsForImport(visits, 10, Infinity).map((chunk) => chunk.length)).toEqual([10, 10, 5]);
  });

  test("件数に収まっていてもバイト数の上限を超える前に区切る", () => {
    // 写真入りの記録を想定した大きな記録。3 件で上限を超えるため 2 件ずつに分かれる
    const large = Array.from({ length: 5 }, (_, index) => visit(`v${index}`, "x".repeat(1000)));
    const limit = bytesOf(large[0]) * 2 + 10;
    expect(chunkVisitsForImport(large, 10, limit).map((chunk) => chunk.map((item) => item.id))).toEqual([
      ["v0", "v1"],
      ["v2", "v3"],
      ["v4"],
    ]);
  });

  test("マルチバイト文字は UTF-8 のバイト数で数える", () => {
    const japanese = [visit("a", "あ".repeat(100)), visit("b", "あ".repeat(100))];
    // 文字数（length）で数えると 2 件とも 1 チャンクに収まってしまう上限
    const limit = JSON.stringify(japanese[0]).length * 2 + 10;
    expect(chunkVisitsForImport(japanese, 10, limit)).toHaveLength(2);
  });

  test("1 件だけで上限を超える記録は単独のチャンクとして送る", () => {
    const visits = [visit("small"), visit("huge", "x".repeat(5000)), visit("small2")];
    const limit = bytesOf(visits[0]) * 3;
    expect(chunkVisitsForImport(visits, 10, limit).map((chunk) => chunk.map((item) => item.id))).toEqual([
      ["small"],
      ["huge"],
      ["small2"],
    ]);
  });

  test("既定のバイト数の上限は Cloud Run のリクエスト上限（32MiB）と Rails の RequestBodyLimit（24MiB）より十分小さい", () => {
    expect(IMPORT_MAX_BATCH_BYTES).toBeLessThanOrEqual(16 * 1024 * 1024);
  });

  test("空の配列はチャンクを作らない", () => {
    expect(chunkVisitsForImport([])).toEqual([]);
  });
});

describe("取り込みデータの検証", () => {
  test("不正なJSONと不正な記録をファイルの問題として区別して伝える", () => {
    expect(() => parseImportText("壊れたJSON")).toThrow(ImportFileError);
    expect(() => parseImportText("null")).toThrow("サウナ記録の配列ではありません");
    expect(() => parseImportText('[{"id":"1"}]')).toThrow("1件目の記録の「name」");
  });

  test("既存IDを除外し、元データを変更せず旧形式の履歴を正規化する", () => {
    const known: SaunaVisit = { id: "known", name: "登録済み", lat: 35, lng: 139, comment: "", date: "2026-08-02" };
    const added: SaunaVisit = { ...known, id: "new", name: "新規" };
    const imported = [known, added];
    const before = structuredClone(imported);
    const result = filterNewVisits(imported, [known]);
    expect(result.alreadyKnown).toBe(1);
    expect(result.normalizedImported).toHaveLength(1);
    expect(result.normalizedImported[0].history).toHaveLength(1);
    expect(imported).toEqual(before);
  });
});
