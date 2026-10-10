import { describe, expect, it } from "vitest";
import {
  IMPORT_MAX_BATCH_SIZE,
  MAX_IMAGE_BYTES,
  API_ALLOWED_IMAGE_MIME_TYPES,
} from "./apiLimits";

describe("apiLimits", () => {
  describe("IMPORT_MAX_BATCH_SIZE", () => {
    it("should be a positive number", () => {
      expect(typeof IMPORT_MAX_BATCH_SIZE).toBe("number");
      expect(IMPORT_MAX_BATCH_SIZE).toBeGreaterThan(0);
    });
  });

  describe("MAX_IMAGE_BYTES", () => {
    it("should be a positive number", () => {
      expect(typeof MAX_IMAGE_BYTES).toBe("number");
      expect(MAX_IMAGE_BYTES).toBeGreaterThan(0);
    });
  });

  describe("API_ALLOWED_IMAGE_MIME_TYPES", () => {
    it("should be a non-empty array of strings", () => {
      expect(Array.isArray(API_ALLOWED_IMAGE_MIME_TYPES)).toBe(true);
      expect(API_ALLOWED_IMAGE_MIME_TYPES.length).toBeGreaterThan(0);
      API_ALLOWED_IMAGE_MIME_TYPES.forEach((mimeType) => {
        expect(typeof mimeType).toBe("string");
      });
    });
  });
});
