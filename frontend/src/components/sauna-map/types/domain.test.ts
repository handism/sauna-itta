import { describe, it, expect } from 'vitest';
import { VisitHistoryEntrySchema } from './domain';

describe('VisitHistoryEntrySchema', () => {
  it('should validate successfully with all fields', () => {
    const validData = {
      id: 'entry-123',
      date: '2023-10-01',
      comment: 'Great sauna!',
      rating: 5,
      image: 'sauna.jpg',
    };
    const result = VisitHistoryEntrySchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should validate successfully with only required fields', () => {
    const validData = {
      date: '2023-10-01',
      comment: 'Great sauna!',
    };
    const result = VisitHistoryEntrySchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should fail validation when required field "date" is missing', () => {
    const invalidData = {
      comment: 'Great sauna!',
    };
    const result = VisitHistoryEntrySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should fail validation when required field "comment" is missing', () => {
    const invalidData = {
      date: '2023-10-01',
    };
    const result = VisitHistoryEntrySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should fail validation when "rating" is of incorrect type', () => {
    const invalidData = {
      date: '2023-10-01',
      comment: 'Great sauna!',
      rating: '5', // should be number
    };
    const result = VisitHistoryEntrySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should fail validation when "date" is of incorrect type', () => {
    const invalidData = {
      date: 1696118400000, // should be string
      comment: 'Great sauna!',
    };
    const result = VisitHistoryEntrySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
