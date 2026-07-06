import { describe, it, expect } from 'vitest';
import { getVisitCount } from './utils';
import { SaunaVisit } from './types';

describe('getVisitCount', () => {
  it('should return 1 when both visitCount and history are missing', () => {
    const visit = {} as SaunaVisit;
    expect(getVisitCount(visit)).toBe(1);
  });

  it('should return the correct count when visitCount is provided and history is missing', () => {
    const visit = { visitCount: 3 } as SaunaVisit;
    expect(getVisitCount(visit)).toBe(3);
  });

  it('should return 1 when visitCount is 0 and history is missing', () => {
    const visit = { visitCount: 0 } as SaunaVisit;
    expect(getVisitCount(visit)).toBe(1);
  });

  it('should return history length when history is provided and visitCount is missing', () => {
    const visit = {
      history: [
        { date: '2023-01-01', comment: '', rating: 3, image: '' },
        { date: '2023-01-02', comment: '', rating: 4, image: '' },
      ],
    } as SaunaVisit;
    expect(getVisitCount(visit)).toBe(2);
  });

  it('should return the maximum of visitCount and history length when both are provided', () => {
    const visit = {
      visitCount: 1,
      history: [
        { date: '2023-01-01', comment: '', rating: 3, image: '' },
        { date: '2023-01-02', comment: '', rating: 4, image: '' },
      ],
    } as SaunaVisit;
    expect(getVisitCount(visit)).toBe(2);
  });

  it('should return visitCount when visitCount is larger than history length', () => {
    const visit = {
      visitCount: 5,
      history: [
        { date: '2023-01-01', comment: '', rating: 3, image: '' },
        { date: '2023-01-02', comment: '', rating: 4, image: '' },
      ],
    } as SaunaVisit;
    expect(getVisitCount(visit)).toBe(5);
  });

  it('should handle empty history array', () => {
    const visit = { history: [] } as SaunaVisit;
    expect(getVisitCount(visit)).toBe(1);
  });

  it('should handle negative visitCount by returning 1', () => {
    const visit = { visitCount: -5 } as SaunaVisit;
    expect(getVisitCount(visit)).toBe(1);
  });

  it('should handle invalid history type', () => {
    const visit = { history: 'invalid' as any } as SaunaVisit;
    expect(getVisitCount(visit)).toBe(1);
  });
});
