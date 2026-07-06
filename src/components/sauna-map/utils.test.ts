import { describe, it, expect } from 'vitest';
import { getVisitHistoryEntries } from './utils';
import { SaunaVisit } from './types';

describe('getVisitHistoryEntries', () => {
  it('returns visit.history when it is a non-empty array', () => {
    const mockHistory = [
      { date: '2023-01-01', comment: 'Great', rating: 5 },
      { date: '2023-02-01', comment: 'Good', rating: 4 },
    ];

    const visit = {
      id: '1',
      name: 'Test Sauna',
      lat: 0,
      lng: 0,
      date: '2022-01-01',
      comment: 'Old',
      history: mockHistory,
    } as SaunaVisit;

    const result = getVisitHistoryEntries(visit);
    expect(result).toBe(mockHistory);
    expect(result).toHaveLength(2);
  });

  it('returns a fallback entry when history is undefined', () => {
    const visit = {
      id: '1',
      name: 'Test Sauna',
      lat: 0,
      lng: 0,
      date: '2023-01-01',
      comment: 'Nice place',
      rating: 4,
      image: 'test.jpg',
    } as SaunaVisit;

    const result = getVisitHistoryEntries(visit);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      date: '2023-01-01',
      comment: 'Nice place',
      rating: 4,
      image: 'test.jpg',
    });
  });

  it('returns a fallback entry when history is an empty array', () => {
    const visit = {
      id: '1',
      name: 'Test Sauna',
      lat: 0,
      lng: 0,
      date: '2023-01-01',
      comment: 'Empty history',
      rating: 3,
      history: [],
    } as SaunaVisit;

    const result = getVisitHistoryEntries(visit);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      date: '2023-01-01',
      comment: 'Empty history',
      rating: 3,
      image: undefined,
    });
  });

  it('uses default values for missing comment and rating in fallback', () => {
    const visit = {
      id: '1',
      name: 'Test Sauna',
      lat: 0,
      lng: 0,
      date: '2023-01-01',
    } as SaunaVisit;

    const result = getVisitHistoryEntries(visit);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      date: '2023-01-01',
      comment: '',
      rating: 0,
      image: undefined,
    });
  });
});
