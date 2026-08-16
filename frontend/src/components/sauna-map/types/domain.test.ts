import { describe, it, expect } from "vitest";
import { VisitFormInputSchema } from "./domain";

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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { name, ...invalidData } = validData;
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { comment, tagsText, status, ...incompleteData } = validData;
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
