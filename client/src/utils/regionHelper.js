/**
 * Japanese Regions and Prefectures Data & Helper Utilities
 * Covers all 8 traditional regions and 47 prefectures of Japan.
 */

export const INITIAL_JAPAN_REGIONS = [
  {
    id: 'hokkaido',
    name: 'Hokkaidō',
    prefectures: [
      { id: 'pref-01', name: '北海道' }
    ]
  },
  {
    id: 'tohoku',
    name: 'Tōhoku',
    prefectures: [
      { id: 'pref-02', name: '青森県' },
      { id: 'pref-03', name: '岩手県' },
      { id: 'pref-04', name: '宮城県' },
      { id: 'pref-05', name: '秋田県' },
      { id: 'pref-06', name: '山形県' },
      { id: 'pref-07', name: '福島県' }
    ]
  },
  {
    id: 'kanto',
    name: 'Kantō',
    prefectures: [
      { id: 'pref-08', name: '茨城県' },
      { id: 'pref-09', name: '栃木県' },
      { id: 'pref-10', name: '群馬県' },
      { id: 'pref-11', name: '埼玉県' },
      { id: 'pref-12', name: '千葉県' },
      { id: 'pref-13', name: '東京都' },
      { id: 'pref-14', name: '神奈川県' }
    ]
  },
  {
    id: 'chubu',
    name: 'Chūbu',
    prefectures: [
      { id: 'pref-15', name: '新潟県' },
      { id: 'pref-16', name: '富山県' },
      { id: 'pref-17', name: '石川県' },
      { id: 'pref-18', name: '福井県' },
      { id: 'pref-19', name: '山梨県' },
      { id: 'pref-20', name: '長野県' },
      { id: 'pref-21', name: '岐阜県' },
      { id: 'pref-22', name: '静岡県' },
      { id: 'pref-23', name: '愛知県' }
    ]
  },
  {
    id: 'kansai',
    name: 'Kansai',
    prefectures: [
      { id: 'pref-24', name: '三重県' },
      { id: 'pref-25', name: '滋賀県' },
      { id: 'pref-26', name: '京都府' },
      { id: 'pref-27', name: '大阪府' },
      { id: 'pref-28', name: '兵庫県' },
      { id: 'pref-29', name: '奈良県' },
      { id: 'pref-30', name: '和歌山県' }
    ]
  },
  {
    id: 'chugoku',
    name: 'Chūgoku',
    prefectures: [
      { id: 'pref-31', name: '鳥取県' },
      { id: 'pref-32', name: '島根県' },
      { id: 'pref-33', name: '岡山県' },
      { id: 'pref-34', name: '広島県' },
      { id: 'pref-35', name: '山口県' }
    ]
  },
  {
    id: 'shikoku',
    name: 'Shikoku',
    prefectures: [
      { id: 'pref-36', name: '徳島県' },
      { id: 'pref-37', name: '香川県' },
      { id: 'pref-38', name: '愛媛県' },
      { id: 'pref-39', name: '高知県' }
    ]
  },
  {
    id: 'kyushu',
    name: 'Kyūshū',
    prefectures: [
      { id: 'pref-40', name: '福岡県' },
      { id: 'pref-41', name: '佐賀県' },
      { id: 'pref-42', name: '長崎県' },
      { id: 'pref-43', name: '熊本県' },
      { id: 'pref-44', name: '大分県' },
      { id: 'pref-45', name: '宮崎県' },
      { id: 'pref-46', name: '鹿児島県' },
      { id: 'pref-47', name: '沖縄県' }
    ]
  }
];

export const STORAGE_KEY = 'oms_japanese_regions_data';

/**
 * Normalizes text for search by stripping macrons and lowercase conversion.
 * Allows searching "Kanto" to match "Kantō", "Tohoku" to match "Tōhoku", etc.
 */
export function normalizeSearchString(str = '') {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ō/g, 'o')
    .replace(/ū/g, 'u')
    .trim();
}

/**
 * Load regions from localStorage or fallback to standard initial dataset
 */
export function loadRegions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_JAPAN_REGIONS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_JAPAN_REGIONS;
  } catch (err) {
    console.error('Failed to parse regions from localStorage:', err);
    return INITIAL_JAPAN_REGIONS;
  }
}

/**
 * Save regions to localStorage and notify listeners
 */
export function saveRegions(regions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(regions));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('oms_regions_updated', { detail: regions }));
    }
  } catch (err) {
    console.error('Failed to save regions to localStorage:', err);
  }
}

/**
 * Storage key for Postage Rate Matrix
 */
export const STORAGE_KEY_POSTAL_RATES = 'oms_postal_rate_matrix';

/**
 * Normalizes region name for clean UI display without macrons
 * e.g., 'Tōhoku' -> 'Tohoku', 'Kantō' -> 'Kanto'
 */
export function getCleanRegionName(name = '') {
  if (!name) return '';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ō/g, 'o')
    .replace(/Ō/g, 'O')
    .replace(/ū/g, 'u')
    .replace(/Ū/g, 'U');
}

/**
 * Derives flattened list of prefectures ordered by active region groups
 * Each item contains: { id, name, regionId, regionName }
 */
export function flattenPrefectures(regions = []) {
  if (!Array.isArray(regions)) return [];
  const list = [];
  for (const region of regions) {
    const prefs = region.prefectures || [];
    for (const pref of prefs) {
      list.push({
        id: pref.id,
        name: pref.name,
        regionId: region.id,
        regionName: region.name
      });
    }
  }
  return list;
}

/**
 * Generates default realistic postage rates for an NxN matrix of prefectures
 * Matching standard Japanese postal rates and dashboard presets
 */
export function generateInitialPostalRates(regions = INITIAL_JAPAN_REGIONS) {
  const flattened = flattenPrefectures(regions);
  const matrix = {};

  // Standard region distances for realistic rate presets
  const regionIndexMap = {
    hokkaido: 0,
    tohoku: 1,
    kanto: 2,
    chubu: 3,
    kansai: 4,
    chugoku: 5,
    shikoku: 6,
    kyushu: 7
  };

  for (let i = 0; i < flattened.length; i++) {
    for (let j = i; j < flattened.length; j++) {
      const fromPref = flattened[i];
      const toPref = flattened[j];
      const key = `${fromPref.id}_${toPref.id}`;
      const reciprocalKey = `${toPref.id}_${fromPref.id}`;

      if (fromPref.id === toPref.id) {
        matrix[key] = '430';
        continue;
      }

      const fromNorm = normalizeSearchString(fromPref.regionName);
      const toNorm = normalizeSearchString(toPref.regionName);

      // Distance factor
      const fromIdx = regionIndexMap[fromNorm] ?? 2;
      const toIdx = regionIndexMap[toNorm] ?? 2;
      const diff = Math.abs(fromIdx - toIdx);

      let price = '10';
      if (fromNorm === 'hokkaido' || toNorm === 'hokkaido') {
        price = diff > 4 ? '4,630' : '4,530';
      } else if (fromNorm === toNorm) {
        price = '530';
      } else if (diff === 1) {
        price = '430';
      } else if (diff === 2) {
        price = '430';
      } else if (diff === 3) {
        price = '130';
      } else if (diff === 4) {
        price = '120';
      } else {
        price = '10';
      }

      matrix[key] = price;
      matrix[reciprocalKey] = price;
    }
  }

  return matrix;
}

/**
 * Load postage rate matrix from localStorage or initialize with sensible defaults
 */
export function loadPostalRateMatrix(regions = INITIAL_JAPAN_REGIONS) {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_POSTAL_RATES) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        // Normalize any legacy 'なし' entries into editable prices
        const normalized = {};
        for (const [k, v] of Object.entries(parsed)) {
          normalized[k] = v === 'なし' ? '430' : v;
        }
        return normalized;
      }
    }
  } catch (err) {
    console.error('Failed to parse postal rate matrix from localStorage:', err);
  }
  return generateInitialPostalRates(regions);
}


/**
 * Save postage rate matrix to localStorage and notify listeners
 */
export function savePostalRateMatrix(rates) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_POSTAL_RATES, JSON.stringify(rates));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('oms_postal_rates_updated', { detail: rates }));
    }
  } catch (err) {
    console.error('Failed to save postal rate matrix to localStorage:', err);
  }
}

/**
 * Storage key for Travel Expenses Rate Matrix
 */
export const STORAGE_KEY_TRAVEL_RATES = 'oms_travel_rate_matrix';

/**
 * Generates default realistic travel rates (bus & flight) for an NxN matrix of prefectures
 */
export function generateInitialTravelRates(regions = INITIAL_JAPAN_REGIONS) {
  const flattened = flattenPrefectures(regions);
  const matrix = {};

  const regionIndexMap = {
    hokkaido: 0,
    tohoku: 1,
    kanto: 2,
    chubu: 3,
    kansai: 4,
    chugoku: 5,
    shikoku: 6,
    kyushu: 7
  };

  for (let i = 0; i < flattened.length; i++) {
    for (let j = i; j < flattened.length; j++) {
      const fromPref = flattened[i];
      const toPref = flattened[j];
      const key = `${fromPref.id}_${toPref.id}`;
      const reciprocalKey = `${toPref.id}_${fromPref.id}`;

      if (fromPref.id === toPref.id) {
        matrix[key] = { bus: '430', flight: '' };
        continue;
      }

      const fromNorm = normalizeSearchString(fromPref.regionName);
      const toNorm = normalizeSearchString(toPref.regionName);

      const fromIdx = regionIndexMap[fromNorm] ?? 2;
      const toIdx = regionIndexMap[toNorm] ?? 2;
      const diff = Math.abs(fromIdx - toIdx);

      let cellValue;
      if (fromNorm === 'hokkaido' || toNorm === 'hokkaido' || diff >= 4) {
        cellValue = { bus: '4,530', flight: '9,130' };
      } else if (fromNorm === toNorm) {
        cellValue = { bus: '530', flight: '' };
      } else if (diff === 1) {
        cellValue = { bus: '430', flight: '' };
      } else if (diff === 2) {
        cellValue = { bus: '630', flight: '5,500' };
      } else {
        cellValue = { bus: '830', flight: '7,200' };
      }

      matrix[key] = { ...cellValue };
      matrix[reciprocalKey] = { ...cellValue };
    }
  }

  return matrix;
}

/**
 * Load travel rate matrix from localStorage or initialize with sensible defaults
 */
export function loadTravelRateMatrix(regions = INITIAL_JAPAN_REGIONS) {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_TRAVEL_RATES) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        // Guarantee diagonal cells (origin === destination) have flight: ''
        for (const key in parsed) {
          const idx = key.indexOf('_');
          if (idx !== -1 && key.slice(0, idx) === key.slice(idx + 1)) {
            const item = parsed[key];
            if (typeof item === 'object') {
              item.flight = '';
            } else {
              parsed[key] = { bus: item || '', flight: '' };
            }
          }
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to parse travel rate matrix from localStorage:', err);
  }
  return generateInitialTravelRates(regions);
}

/**
 * Save travel rate matrix to localStorage and notify listeners
 */
export function saveTravelRateMatrix(rates) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_TRAVEL_RATES, JSON.stringify(rates));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('oms_travel_rates_updated', { detail: rates }));
    }
  } catch (err) {
    console.error('Failed to save travel rate matrix to localStorage:', err);
  }
}


/**
 * Filters regions and prefectures based on query string.
 * Query matches region name (Romaji) or prefecture name (Kanji).
 * Dynamically computes matching prefectures for each region.
 */
export function filterRegions(regions, query) {
  const q = normalizeSearchString(query);
  if (!q) {
    return regions.map(reg => ({
      ...reg,
      matchingPrefectures: reg.prefectures || []
    }));
  }

  const result = [];
  for (const reg of regions) {
    const regMatches = normalizeSearchString(reg.name).includes(q);
    const prefectures = reg.prefectures || [];

    if (regMatches) {
      // Entire region matches, show all prefectures
      result.push({
        ...reg,
        matchingPrefectures: prefectures
      });
    } else {
      // Check individual prefectures
      const matchingPrefectures = prefectures.filter(p =>
        p.name.includes(query) || normalizeSearchString(p.name).includes(q)
      );
      if (matchingPrefectures.length > 0) {
        result.push({
          ...reg,
          matchingPrefectures
        });
      }
    }
  }

  return result;
}

/**
 * Resolves a prefecture item or ID from name (exact or normalized) or existing id
 */
export function resolvePrefecture(query = '', regions = INITIAL_JAPAN_REGIONS) {
  if (!query) return null;
  const flattened = flattenPrefectures(regions);
  const qTrimmed = String(query).trim();
  const qNorm = normalizeSearchString(qTrimmed);
  return flattened.find(p => 
    p.id === qTrimmed || 
    p.name === qTrimmed || 
    p.name.replace(/[都道府県]/g, '') === qTrimmed.replace(/[都道府県]/g, '') ||
    normalizeSearchString(p.name) === qNorm ||
    normalizeSearchString(p.regionName) === qNorm
  ) || null;
}

/**
 * Looks up postal rate between two locations (Prefecture names or IDs)
 */
export function lookupPostalRate(fromQuery, toQuery, regions = INITIAL_JAPAN_REGIONS, postalMatrix = {}) {
  if (!fromQuery || !toQuery || !postalMatrix) return 0;
  const fromPref = resolvePrefecture(fromQuery, regions);
  const toPref = resolvePrefecture(toQuery, regions);
  if (!fromPref || !toPref) return 0;
  const key = `${fromPref.id}_${toPref.id}`;
  const raw = postalMatrix[key];
  if (!raw || raw === 'なし') return 0;
  return Number(String(raw).replace(/[^0-9]/g, '')) || 0;
}

/**
 * Storage key for Transport Modes Availability Settings (Bus & Flight)
 */
export const STORAGE_KEY_TRANSPORT_MODES = 'oms_transport_modes_settings';

/**
 * Generates default transport mode availability settings (all enabled by default)
 */
export function getDefaultTransportModeSettings(regions = INITIAL_JAPAN_REGIONS) {
  const settings = {
    master: {
      bus: true,
      flight: true
    },
    regions: {}
  };
  for (const reg of regions) {
    settings.regions[reg.id] = {
      bus: true,
      flight: true
    };
  }
  return settings;
}

/**
 * Loads transport mode availability settings from localStorage
 */
export function loadTransportModeSettings(regions = INITIAL_JAPAN_REGIONS) {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_TRANSPORT_MODES) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.master) {
        // Ensure all active regions have keys
        const next = { ...parsed, regions: { ...parsed.regions } };
        for (const reg of regions) {
          if (!next.regions[reg.id]) {
            next.regions[reg.id] = { bus: true, flight: true };
          }
        }
        return next;
      }
    }
  } catch (err) {
    console.error('Failed to parse transport mode settings from localStorage:', err);
  }
  return getDefaultTransportModeSettings(regions);
}

/**
 * Saves transport mode availability settings to localStorage and dispatches event
 */
export function saveTransportModeSettings(settings) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_TRANSPORT_MODES, JSON.stringify(settings));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('oms_transport_modes_updated', { detail: settings }));
    }
  } catch (err) {
    console.error('Failed to save transport mode settings to localStorage:', err);
  }
}

/**
 * Checks whether a transport mode (bus or flight) is enabled for a specific route
 */
export function isRouteTransportEnabled(type, originRegionId, destRegionId, settings) {
  if (!settings) return true;
  if (settings.master && settings.master[type] === false) return false;
  if (settings.regions) {
    if (originRegionId && settings.regions[originRegionId]?.[type] === false) return false;
    if (destRegionId && settings.regions[destRegionId]?.[type] === false) return false;
  }
  return true;
}

/**
 * Looks up travel rate between two locations (Prefecture names or IDs), respecting transport mode availability
 */
export function lookupTravelRate(fromQuery, toQuery, method = '', regions = INITIAL_JAPAN_REGIONS, travelMatrix = {}, transportSettings = null) {
  if (!fromQuery || !toQuery || !travelMatrix) return 0;
  const fromPref = resolvePrefecture(fromQuery, regions);
  const toPref = resolvePrefecture(toQuery, regions);
  if (!fromPref || !toPref) return 0;

  const settings = transportSettings || loadTransportModeSettings(regions);
  const isBusActive = isRouteTransportEnabled('bus', fromPref.regionId, toPref.regionId, settings);
  const isFlightActive = fromPref.id !== toPref.id && isRouteTransportEnabled('flight', fromPref.regionId, toPref.regionId, settings);

  const key = `${fromPref.id}_${toPref.id}`;
  const cell = travelMatrix[key];
  if (!cell) return 0;
  if (typeof cell === 'string' || typeof cell === 'number') {
    return Number(String(cell).replace(/[^0-9]/g, '')) || 0;
  }
  const busVal = isBusActive ? (Number(String(cell.bus || '').replace(/[^0-9]/g, '')) || 0) : 0;
  const flightVal = isFlightActive ? (Number(String(cell.flight || '').replace(/[^0-9]/g, '')) || 0) : 0;

  if (method === 'バス') return busVal;
  if (method === '飛行機') return flightVal;
  return busVal > 0 ? busVal : flightVal;
}

