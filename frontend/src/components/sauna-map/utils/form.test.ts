import { describe, it, expect } from "vitest";
import { getDefaultForm, getSubmitBlockedReason, toFormState, validateVisitForm, toNormalizedTags } from "./form";
import { getTodayDate } from "./date";
import { buildHistoryUpdate } from "./visitHistory";
import { SaunaVisit, VisitFormState } from "../types";

describe("getDefaultForm", () => {
  it("returns the default form state with an empty date when no date is provided", () => {
    const form = getDefaultForm();
    expect(form).toEqual({
      name: "",
      comment: "",
      image: "",
      date: "",
      rating: 0,
      tagsText: "",
      status: "visited",
      area: "",
      appendHistory: false,
    });
  });

  it("returns the default form state with the provided date", () => {
    const date = "2024-03-15";
    const form = getDefaultForm(date);
    expect(form).toEqual({
      name: "",
      comment: "",
      image: "",
      date: "2024-03-15",
      rating: 0,
      tagsText: "",
      status: "visited",
      area: "",
      appendHistory: false,
    });
  });
});

describe("buildHistoryUpdate", () => {
  it("should append a new history entry when appendHistory is true", () => {
    const visit = {
      id: "1",
      name: "Test Sauna",
      lat: 0,
      lng: 0,
      date: "2023-01-01",
      comment: "First visit",
      rating: 3,
      history: [
        { date: "2023-01-01", comment: "First visit", rating: 3 },
      ],
    } as SaunaVisit;

    const form = {
      date: "2023-02-01",
      comment: "Second visit",
      rating: 4,
      image: "new.jpg",
      appendHistory: true,
    } as VisitFormState;

    const result = buildHistoryUpdate(visit, form);

    expect(result.history).toHaveLength(2);
    expect(result.history![1]).toEqual({
      date: "2023-02-01",
      comment: "Second visit",
      rating: 4,
      image: "new.jpg",
    });
    expect(result.comment).toBe("Second visit");
    expect(result.date).toBe("2023-02-01");
    expect(result.rating).toBe(4);
    expect(result.image).toBe("new.jpg");
    expect(result.visitCount).toBe(2);
  });

  it("should update the latest history entry when appendHistory is false", () => {
    const visit = {
      id: "1",
      name: "Test Sauna",
      lat: 0,
      lng: 0,
      date: "2023-01-01",
      comment: "First visit",
      rating: 3,
      history: [
        { date: "2023-01-01", comment: "First visit", rating: 3 },
        { date: "2023-02-01", comment: "Second visit", rating: 4 },
      ],
    } as SaunaVisit;

    const form = {
      date: "2023-02-05",
      comment: "Second visit updated",
      rating: 5,
      image: "updated.jpg",
      appendHistory: false,
    } as VisitFormState;

    const result = buildHistoryUpdate(visit, form);

    expect(result.history).toHaveLength(2);
    expect(result.history![0]).toEqual({ date: "2023-01-01", comment: "First visit", rating: 3 });
    expect(result.history![1]).toEqual({
      date: "2023-02-05",
      comment: "Second visit updated",
      rating: 5,
      image: "updated.jpg",
    });
    expect(result.comment).toBe("Second visit updated");
    expect(result.date).toBe("2023-02-05");
    expect(result.rating).toBe(5);
    expect(result.visitCount).toBe(2);
  });

  it("should use fallback values for date and rating when form values are falsy", () => {
    const visit = {
      id: "1",
      name: "Test Sauna",
      lat: 0,
      lng: 0,
      date: "2023-01-01",
      comment: "First visit",
      history: [],
    } as SaunaVisit;

    const form = {
      date: "", // Falsy date
      comment: "Fallback test",
      rating: 0, // Falsy rating
      image: undefined,
      appendHistory: true,
    } as unknown as VisitFormState;

    const result = buildHistoryUpdate(visit, form);

    expect(result.history).toHaveLength(2);
    expect(result.history![1].date).toBe(getTodayDate());
    expect(result.history![1].rating).toBe(0);
    expect(result.history![1].comment).toBe("Fallback test");
  });

  it("should calculate visitCount correctly when it is missing or large", () => {
    const visit = {
      id: "1",
      name: "Test Sauna",
      lat: 0,
      lng: 0,
      date: "2023-01-01",
      comment: "First visit",
      visitCount: 5, // Larger than history
      history: [{ date: "2023-01-01", comment: "First visit", rating: 3 }],
    } as SaunaVisit;

    const form = {
      date: "2023-02-01",
      comment: "Second visit",
      rating: 4,
      appendHistory: true,
    } as VisitFormState;

    const result = buildHistoryUpdate(visit, form);

    expect(result.visitCount).toBe(5);
  });
});

describe("toFormState", () => {
  it("converts a basic SaunaVisit without history to VisitFormState", () => {
    const visit: SaunaVisit = {
      id: "1",
      name: "Test Sauna",
      lat: 35.0,
      lng: 135.0,
      date: "2023-10-01",
      comment: "Nice place",
      rating: 4,
      image: "test.jpg",
      tags: ["relaxing", "hot"],
      status: "wishlist",
      area: "Tokyo",
    };

    const formState = toFormState(visit);

    expect(formState).toEqual({
      name: "Test Sauna",
      comment: "Nice place",
      image: "test.jpg",
      date: "2023-10-01",
      rating: 4,
      tagsText: "relaxing, hot",
      status: "wishlist",
      area: "Tokyo",
      appendHistory: false,
    });
  });

  it("uses the latest history entry when a history array is present", () => {
    const visit: SaunaVisit = {
      id: "1",
      name: "History Sauna",
      lat: 35.0,
      lng: 135.0,
      date: "2022-01-01", // Old date
      comment: "Old comment", // Old comment
      history: [
        {
          date: "2023-01-01",
          comment: "First visit",
          rating: 3,
          image: "old.jpg",
        },
        {
          date: "2023-11-01",
          comment: "Latest visit",
          rating: 5,
          image: "new.jpg",
        },
      ],
      tags: ["sauna"],
      status: "visited",
      area: "Osaka",
    };

    const formState = toFormState(visit);

    expect(formState).toEqual({
      name: "History Sauna",
      comment: "Latest visit",
      image: "new.jpg",
      date: "2023-11-01",
      rating: 5,
      tagsText: "sauna",
      status: "visited",
      area: "Osaka",
      appendHistory: false,
    });
  });

  it("handles missing optional fields by providing default values", () => {
    const visit: SaunaVisit = {
      id: "1",
      name: "Minimal Sauna",
      lat: 35.0,
      lng: 135.0,
      date: "2023-10-01",
      comment: "",
    };

    const formState = toFormState(visit);

    expect(formState).toEqual({
      name: "Minimal Sauna",
      comment: "",
      image: "",
      date: "2023-10-01",
      rating: 0,
      tagsText: "",
      status: "visited",
      area: "",
      appendHistory: false,
    });
  });

  it("transforms tags array into a comma-separated string", () => {
    const visit: SaunaVisit = {
      id: "1",
      name: "Tags Sauna",
      lat: 35.0,
      lng: 135.0,
      date: "2023-10-01",
      comment: "",
      tags: ["a", "b", "c"],
    };

    const formState = toFormState(visit);
    expect(formState.tagsText).toBe("a, b, c");
  });
});

describe("validateVisitForm", () => {
  it("validates valid form state successfully", () => {
    const validForm: VisitFormState = {
      name: "サウナしきじ",
      comment: "聖地巡礼",
      image: "",
      date: "2026-07-24",
      rating: 5,
      tagsText: "水風呂, 薬草サウナ",
      status: "visited",
      area: "静岡",
      appendHistory: false,
    };

    const result = validateVisitForm(validForm);
    expect(result.success).toBe(true);
  });

  it("returns error when sauna name is empty", () => {
    const invalidForm: VisitFormState = {
      name: "   ",
      comment: "",
      image: "",
      date: "2026-07-24",
      rating: 4,
      tagsText: "",
      status: "visited",
      area: "",
      appendHistory: false,
    };

    const result = validateVisitForm(invalidForm);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContain("サウナ名を入力してください。");
    }
  });

  it("returns error when date format is invalid", () => {
    const invalidForm: VisitFormState = {
      name: "ウェルビー栄",
      comment: "",
      image: "",
      date: "2026/07/24", // Invalid format
      rating: 5,
      tagsText: "",
      status: "visited",
      area: "名古屋",
      appendHistory: false,
    };

    const result = validateVisitForm(invalidForm);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContain("日付の形式が正しくありません。");
    }
  });

  it("returns error when rating is out of range", () => {
    const invalidForm: VisitFormState = {
      name: "北欧",
      comment: "",
      image: "",
      date: "2026-07-24",
      rating: 6, // Invalid rating
      tagsText: "",
      status: "visited",
      area: "上野",
      appendHistory: false,
    };

    const result = validateVisitForm(invalidForm);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContain("満足度は5以下で指定してください。");
    }
  });
});

describe("toNormalizedTags", () => {
  it("returns an empty array for an empty string", () => {
    expect(toNormalizedTags("")).toEqual([]);
  });

  it("returns an array with a single tag for a single word", () => {
    expect(toNormalizedTags("sauna")).toEqual(["sauna"]);
  });

  it("trims whitespace around tags", () => {
    expect(toNormalizedTags("  hot  , relaxing ")).toEqual(["hot", "relaxing"]);
  });

  it("filters out empty values caused by consecutive or trailing commas", () => {
    expect(toNormalizedTags("a,,b,")).toEqual(["a", "b"]);
  });

  it("returns an empty array for strings with only spaces or commas", () => {
    expect(toNormalizedTags("  , ,  ")).toEqual([]);
  });
});

describe("getSubmitBlockedReason", () => {
  const sampleLocation = { lat: 35.6812, lng: 139.7671 };

  it("returns reason when location is not selected", () => {
    expect(getSubmitBlockedReason(null, "サウナしきじ", false)).toBe(
      "地図上をクリックして場所を選択してください",
    );
  });

  it("returns reason when name is empty", () => {
    expect(getSubmitBlockedReason(sampleLocation, "", false)).toBe(
      "サウナ名を入力してください",
    );
    expect(getSubmitBlockedReason(sampleLocation, "   ", false)).toBe(
      "サウナ名を入力してください",
    );
  });

  it("returns reason when image is uploading", () => {
    expect(getSubmitBlockedReason(sampleLocation, "サウナしきじ", true)).toBe(
      "画像の処理が終わるまでお待ちください",
    );
  });

  it("returns null when form is ready to submit", () => {
    expect(getSubmitBlockedReason(sampleLocation, "サウナしきじ", false)).toBeNull();
  });
});

