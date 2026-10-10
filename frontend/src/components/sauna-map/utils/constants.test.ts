import { describe, it, expect } from 'vitest';
import { VISITS_STORAGE_KEY, THEME_STORAGE_KEY, MOBILE_BREAKPOINT } from './constants';

describe('Constants', () => {
  it('should have correct VISITS_STORAGE_KEY value', () => {
    expect(VISITS_STORAGE_KEY).toBe('sauna-itta_visits');
  });

  it('should have correct THEME_STORAGE_KEY value', () => {
    expect(THEME_STORAGE_KEY).toBe('sauna-itta_theme');
  });

  it('should have correct MOBILE_BREAKPOINT value', () => {
    expect(MOBILE_BREAKPOINT).toBe(768);
  });
});
