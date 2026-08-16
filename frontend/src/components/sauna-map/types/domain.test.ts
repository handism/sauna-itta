import { describe, it, expect } from "vitest";
import { SaunaVisitSchema, VisitHistoryEntrySchema } from "./domain";

describe("VisitHistoryEntrySchema", () => {
  it("should validate a valid complete object", () => {
    const validData = {
      id: "hist-1",
      date: "2023-10-01",
      comment: "Great experience",
      rating: 5,
      image: "https://example.com/image.jpg",
    };
    const result = VisitHistoryEntrySchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should validate a valid minimal object", () => {
    const minimalData = {
      date: "2023-10-01",
      comment: "Good",
    };
    const result = VisitHistoryEntrySchema.safeParse(minimalData);
    expect(result.success).toBe(true);
  });

  it("should fail if required fields are missing", () => {
    const invalidData = {
      id: "hist-1",
    };
    const result = VisitHistoryEntrySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.date).toBeDefined();
      expect(fieldErrors.comment).toBeDefined();
    }
  });
});

describe("SaunaVisitSchema", () => {
  it("should validate a valid complete object", () => {
    const validData = {
      id: "sauna-1",
      name: "Super Sauna",
      lat: 35.6895,
      lng: 139.6917,
      comment: "Very hot",
      image: "https://example.com/sauna.jpg",
      date: "2023-10-01",
      rating: 4.5,
      tags: ["löyly", "water-bath"],
      status: "visited",
      area: "Tokyo",
      visitCount: 3,
      history: [
        {
          id: "hist-1",
          date: "2023-10-01",
          comment: "Nice",
        },
      ],
      lockVersion: 1,
    };
    const result = SaunaVisitSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should validate a valid minimal object", () => {
    const minimalData = {
      id: "sauna-2",
      name: "Minimal Sauna",
      lat: 35.6895,
      lng: 139.6917,
      comment: "Just basic",
      date: "2023-10-02",
    };
    const result = SaunaVisitSchema.safeParse(minimalData);
    expect(result.success).toBe(true);
  });

  it("should fail if required fields are missing", () => {
    const invalidData = {
      name: "Incomplete Sauna",
    };
    const result = SaunaVisitSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.id).toBeDefined();
      expect(fieldErrors.lat).toBeDefined();
      expect(fieldErrors.lng).toBeDefined();
      expect(fieldErrors.comment).toBeDefined();
      expect(fieldErrors.date).toBeDefined();
    }
  });

  it("should fail if lat or lng are not numbers", () => {
    const invalidData = {
      id: "sauna-3",
      name: "Wrong Type Sauna",
      lat: "35.6895", // String instead of number
      lng: "139.6917", // String instead of number
      comment: "Wrong types",
      date: "2023-10-03",
    };
    const result = SaunaVisitSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.lat).toBeDefined();
      expect(fieldErrors.lng).toBeDefined();
    }
  });

  it("should fail if status is invalid", () => {
    const invalidData = {
      id: "sauna-4",
      name: "Invalid Status Sauna",
      lat: 35.6895,
      lng: 139.6917,
      comment: "Invalid status",
      date: "2023-10-04",
      status: "unknown",
    };
    const result = SaunaVisitSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.status).toBeDefined();
    }
  });

  it("should fail if lockVersion is negative or not an integer", () => {
    const baseData = {
      id: "sauna-5",
      name: "LockVersion Sauna",
      lat: 35.6895,
      lng: 139.6917,
      comment: "LockVersion check",
      date: "2023-10-05",
    };

    // Negative lockVersion
    const negativeResult = SaunaVisitSchema.safeParse({ ...baseData, lockVersion: -1 });
    expect(negativeResult.success).toBe(false);

    // Float lockVersion
    const floatResult = SaunaVisitSchema.safeParse({ ...baseData, lockVersion: 1.5 });
    expect(floatResult.success).toBe(false);
  });
});
