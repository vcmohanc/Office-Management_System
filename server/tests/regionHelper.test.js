import { describe, it, expect } from 'vitest';
import {
  INITIAL_JAPAN_REGIONS,
  normalizeSearchString,
  filterRegions
} from '../../client/src/utils/regionHelper.js';

describe('Japanese Regions Helper', () => {
  it('contains exactly 8 standard regions and 47 prefectures', () => {
    expect(INITIAL_JAPAN_REGIONS).toHaveLength(8);
    const totalPrefectures = INITIAL_JAPAN_REGIONS.reduce(
      (sum, r) => sum + r.prefectures.length,
      0
    );
    expect(totalPrefectures).toBe(47);
  });

  it('normalizes macrons properly for search', () => {
    expect(normalizeSearchString('Kantō')).toBe('kanto');
    expect(normalizeSearchString('Tōhoku')).toBe('tohoku');
    expect(normalizeSearchString('Kyūshū')).toBe('kyushu');
    expect(normalizeSearchString('Hokkaidō')).toBe('hokkaido');
    expect(normalizeSearchString('Chūbu')).toBe('chubu');
    expect(normalizeSearchString('Chūgoku')).toBe('chugoku');
  });

  it('filters by Romaji region name', () => {
    const results = filterRegions(INITIAL_JAPAN_REGIONS, 'kanto');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Kantō');
    expect(results[0].matchingPrefectures).toHaveLength(7);
  });

  it('filters by Japanese prefecture Kanji', () => {
    const results = filterRegions(INITIAL_JAPAN_REGIONS, '東京');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Kantō');
    expect(results[0].matchingPrefectures).toHaveLength(1);
    expect(results[0].matchingPrefectures[0].name).toBe('東京都');
  });

  it('filters multiple prefectures across regions matching partial Kanji', () => {
    const results = filterRegions(INITIAL_JAPAN_REGIONS, '山');
    expect(results.length).toBeGreaterThanOrEqual(2);
    results.forEach(r => {
      expect(r.matchingPrefectures.length).toBeGreaterThan(0);
    });
  });

  it('resolves prefectures and looks up postal & travel rates correctly', async () => {
    const { 
      resolvePrefecture, 
      lookupPostalRate, 
      lookupTravelRate, 
      generateInitialPostalRates, 
      generateInitialTravelRates 
    } = await import('../../client/src/utils/regionHelper.js');

    const tokyo = resolvePrefecture('東京都');
    const osaka = resolvePrefecture('大阪府');
    expect(tokyo).toBeDefined();
    expect(tokyo.id).toBe('pref-13');
    expect(osaka).toBeDefined();
    expect(osaka.id).toBe('pref-27');

    const postalRates = generateInitialPostalRates(INITIAL_JAPAN_REGIONS);
    const travelRates = generateInitialTravelRates(INITIAL_JAPAN_REGIONS);

    const postPrice = lookupPostalRate('東京都', '大阪府', INITIAL_JAPAN_REGIONS, postalRates);
    expect(postPrice).toBeGreaterThan(0);

    const busPrice = lookupTravelRate('東京都', '大阪府', 'バス', INITIAL_JAPAN_REGIONS, travelRates);
    expect(busPrice).toBeGreaterThan(0);

    const flightPrice = lookupTravelRate('東京都', '北海道', '飛行機', INITIAL_JAPAN_REGIONS, travelRates);
    expect(flightPrice).toBeGreaterThan(0);
  });
});
