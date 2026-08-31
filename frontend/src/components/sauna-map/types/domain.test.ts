import { describe, it, expect } from "vitest";
import {
  VisitFormInputSchema,
  VisitHistoryEntrySchema,
  SaunaVisitSchema,
} from "./domain";

describe("VisitFormInputSchema", () => {
  const validData = {
    name: "Valid Sauna Name",
    comment: "This is a valid comment.",
    tagsText: "sauna, chill",
    status: "visited" as const,
    date: "2023-10-25",
    rating: 5,
  };

  it("validates a correctly structured valid input", () => {
    const result = VisitFormInputSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  describe("name field", () => {
    it("fails when name is missing", () => {
      const invalidData: Record<string, unknown> = { ...validData };
      delete invalidData.name;
      const result = VisitFormInputSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("fails when name is an empty string after trimming", () => {
      const invalidData = { ...validData, name: "   " };
      const result = VisitFormInputSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("サウナ名を入力してください。");
      }
    });

    it("trims whitespace correctly for valid names", () => {
      const data = { ...validData, name: "  Trimmed Name  " };
      const result = VisitFormInputSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Trimmed Name");
      }
    });
  });

  describe("date field", () => {
    it("accepts valid date string format YYYY-MM-DD", () => {
      const data = { ...validData, date: "2023-10-25" };
      const result = VisitFormInputSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts an empty string", () => {
      const data = { ...validData, date: "" };
      const result = VisitFormInputSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("fails with invalid date formats", () => {
      const invalidDates = ["2023/10/25", "23-10-25", "October 25, 2023", "2023-1-2", "invalid"];
      invalidDates.forEach(date => {
        const invalidData = { ...validData, date };
        const result = VisitFormInputSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("日付の形式が正しくありません。");
        }
      });
    });
  });

  describe("rating field", () => {
    it("accepts valid ratings between 0 and 5", () => {
      [0, 1, 2.5, 5].forEach(rating => {
        const data = { ...validData, rating };
        const result = VisitFormInputSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it("fails when rating is less than 0", () => {
      const invalidData = { ...validData, rating: -1 };
      const result = VisitFormInputSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("満足度は0以上で指定してください。");
      }
    });

    it("fails when rating is more than 5", () => {
      const invalidData = { ...validData, rating: 6 };
      const result = VisitFormInputSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("満足度は5以下で指定してください。");
      }
    });
  });

  describe("required and optional fields", () => {
    it("requires comment, tagsText, and status", () => {
      const incompleteData: Record<string, unknown> = { ...validData };
      delete incompleteData.comment;
      delete incompleteData.tagsText;
      delete incompleteData.status;
      const result = VisitFormInputSchema.safeParse(incompleteData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorPaths = result.error.issues.map(i => i.path[0]);
        expect(errorPaths).toContain("comment");
        expect(errorPaths).toContain("tagsText");
        expect(errorPaths).toContain("status");
      }
    });

    it("accepts payload with all optional fields present", () => {
      const completeData = {
        ...validData,
        image: "image.jpg",
        area: "Tokyo",
        appendHistory: true,
      };
      const result = VisitFormInputSchema.safeParse(completeData);
      expect(result.success).toBe(true);
    });
  });
});

describe("VisitHistoryEntrySchema", () => {
  const validEntry = {
    date: "2024-01-15",
    comment: "Good sauna experience",
  };

  it("validates a minimal valid history entry", () => {
    const result = VisitHistoryEntrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it("validates entry with all optional fields", () => {
    const fullEntry = {
      ...validEntry,
      id: "hist-1",
      rating: 4.5,
      image: "data:image/png;base64,...",
    };
    const result = VisitHistoryEntrySchema.safeParse(fullEntry);
    expect(result.success).toBe(true);
  });

  it("fails when required fields are missing", () => {
    expect(VisitHistoryEntrySchema.safeParse({ comment: "no date" }).success).toBe(false);
    expect(VisitHistoryEntrySchema.safeParse({ date: "2024-01-15" }).success).toBe(false);
  });

  it("fails when fields are of incorrect type", () => {
    expect(
      VisitHistoryEntrySchema.safeParse({
        date: 1696118400000,
        comment: "Great sauna!",
      }).success
    ).toBe(false);
    expect(
      VisitHistoryEntrySchema.safeParse({
        date: "2024-01-15",
        comment: "Great sauna!",
        rating: "5",
      }).success
    ).toBe(false);
  });
});

describe("SaunaVisitSchema", () => {
  const validVisit = {
    id: "visit-1",
    name: "Sauna Center",
    lat: 35.6895,
    lng: 139.6917,
    comment: "Classic Finnish style",
    date: "2024-01-15",
  };

  it("validates a minimal valid sauna visit", () => {
    const result = SaunaVisitSchema.safeParse(validVisit);
    expect(result.success).toBe(true);
  });

  it("validates sauna visit with all optional fields", () => {
    const fullVisit = {
      ...validVisit,
      image: "https://example.com/photo.jpg",
      rating: 4,
      tags: ["dry", "water-bath"],
      status: "visited" as const,
      area: "Tokyo",
      visitCount: 2,
      history: [
        {
          id: "hist-1",
          date: "2024-01-10",
          comment: "First visit",
          rating: 4,
        },
      ],
      lockVersion: 1,
    };
    const result = SaunaVisitSchema.safeParse(fullVisit);
    expect(result.success).toBe(true);
  });

  it("fails when required fields are missing", () => {
    const requiredKeys = ["id", "name", "lat", "lng", "comment", "date"] as const;
    for (const key of requiredKeys) {
      const data = { ...validVisit };
      delete (data as Record<string, unknown>)[key];
      const result = SaunaVisitSchema.safeParse(data);
      expect(result.success).toBe(false);
    }
  });

  it("fails when fields have incorrect types", () => {
    expect(SaunaVisitSchema.safeParse({ ...validVisit, lat: "35.6895" }).success).toBe(false);
    expect(SaunaVisitSchema.safeParse({ ...validVisit, lng: "139.6917" }).success).toBe(false);
    expect(SaunaVisitSchema.safeParse({ ...validVisit, rating: "4" }).success).toBe(false);
    expect(SaunaVisitSchema.safeParse({ ...validVisit, tags: "dry" }).success).toBe(false);
    expect(
      SaunaVisitSchema.safeParse({
        ...validVisit,
        history: [{ date: "2024-01-10" }], // missing comment in history entry
      }).success
    ).toBe(false);
  });

  it("fails on invalid status", () => {
    const invalidData = { ...validVisit, status: "unknown" };
    const result = SaunaVisitSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("fails on negative or non-integer lockVersion", () => {
    expect(SaunaVisitSchema.safeParse({ ...validVisit, lockVersion: -1 }).success).toBe(false);
    expect(SaunaVisitSchema.safeParse({ ...validVisit, lockVersion: 1.5 }).success).toBe(false);
  });
});
