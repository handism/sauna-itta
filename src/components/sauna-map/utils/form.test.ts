import { describe, it, expect } from "vitest";
import { toFormState, getTodayDate } from "./form";
import { buildHistoryUpdate } from "./visitHistory";
import { SaunaVisit, VisitFormState } from "../types";

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
