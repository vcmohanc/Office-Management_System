import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Search, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Save, 
  CheckCircle2,
  Sparkles,
  X,
  ArrowLeftRight,
  AlertTriangle,
  Bus,
  Plane,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { toastConfirm } from '../../utils/toastConfirm.jsx';
import { apiFetch } from '../../utils/apiFetch.js';
import { 
  flattenPrefectures, 
  loadTravelRateMatrix, 
  saveTravelRateMatrix, 
  generateInitialTravelRates,
  getCleanRegionName,
  normalizeSearchString,
  loadTransportModeSettings,
  saveTransportModeSettings,
  getDefaultTransportModeSettings
} from '../../utils/regionHelper.js';

/**
 * Numeric price parser - strips non-digit characters (¥, commas, spaces)
 */
const parsePrice = (val) => {
  if (val === null || val === undefined || val === '' || val === 'なし') return 0;
  return Number(String(val).replace(/[^0-9]/g, '')) || 0;
};

/**
 * Individual Travel Rate Cell Component (Memoized)
 * Supports both Bus (バス) and Flight (フライト) prices with bidirectional mirroring
 */
const TravelCell = React.memo(function TravelCell({
  fromId,
  toId,
  fromName,
  toName,
  isDiagonal,
  isRowHovered,
  isColHovered,
  isReciprocalHovered,
  isAsymmetric,
  asymmetryDetails,
  value,
  reciprocalValue,
  isAuditMode,
  isBusActive = true,
  isFlightActive = true,
  busDisabledReason = '',
  flightDisabledReason = '',
  onChange,
  onHover
}) {
  const busValue = typeof value === 'object' ? (value?.bus ?? '') : (value ?? '');
  const flightValue = (isDiagonal || !isFlightActive) ? '' : (typeof value === 'object' ? (value?.flight ?? '') : '');

  const recipBusValue = typeof reciprocalValue === 'object' ? (reciprocalValue?.bus ?? '') : (reciprocalValue ?? '');
  const recipFlightValue = (isDiagonal || !isFlightActive) ? '' : (typeof reciprocalValue === 'object' ? (reciprocalValue?.flight ?? '') : '');

  const handleBlur = (field, currentVal) => {
    if (field === 'bus' && !isBusActive) return;
    if (field === 'flight' && (isDiagonal || !isFlightActive)) return;
    const raw = String(currentVal || '').replace(/[^0-9]/g, '');
    if (raw) {
      const formatted = Number(raw).toLocaleString();
      if (formatted !== currentVal) {
        onChange(fromId, toId, field, formatted);
      }
    } else if (currentVal !== '') {
      onChange(fromId, toId, field, '');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  const showWarning = isAuditMode && isAsymmetric && !isDiagonal;
  const isBusMismatch = showWarning && asymmetryDetails?.isBusMismatch;
  const isFlightMismatch = showWarning && asymmetryDetails?.isFlightMismatch;

  return (
    <td 
      onMouseEnter={() => onHover(fromId, toId)}
      className={`p-1 border border-gray-200 text-center transition-colors relative ${
        isDiagonal 
          ? 'bg-amber-50/15' 
          : isReciprocalHovered
            ? 'bg-indigo-50/70 ring-1 ring-indigo-400 z-10'
            : (isRowHovered || isColHovered) 
              ? 'bg-blue-50/30' 
              : showWarning
                ? 'bg-amber-50/50'
                : 'bg-white'
      } hover:bg-blue-100/40`}
      title={
        isDiagonal
          ? `[${fromName} 内移動]: バスのみ利用可能（フライト対象外）`
          : showWarning 
            ? `⚠️ 双方向不整合:\n[${fromName} → ${toName}]: バス ¥${busValue || 0} / フライト ¥${flightValue || 0}\n[${toName} → ${fromName}]: バス ¥${recipBusValue || 0} / フライト ¥${recipFlightValue || 0}`
            : isReciprocalHovered && !isDiagonal
              ? `↔ 対向セル: [${toName} → ${fromName}]`
              : undefined
      }
    >
      <div className="flex flex-col space-y-1 py-0.5 relative">
        {/* Bus row */}
        <div className="flex items-center justify-between gap-1">
          <span className={`text-[10px] font-medium whitespace-nowrap select-none ${
            !isBusActive ? 'text-gray-300' : 'text-gray-400'
          }`}>
            バス
          </span>
          <div className="flex items-center relative">
            <span className={`text-xs mr-0.5 select-none font-normal ${
              !isBusActive ? 'text-gray-300' : 'text-gray-400'
            }`}>
              ¥
            </span>
            <input
              type="text"
              inputMode="numeric"
              disabled={!isBusActive}
              readOnly={!isBusActive}
              value={!isBusActive ? '' : busValue}
              onChange={(e) => isBusActive && onChange(fromId, toId, 'bus', e.target.value)}
              onBlur={(e) => isBusActive && handleBlur('bus', e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={!isBusActive ? '—' : '0'}
              tabIndex={!isBusActive ? -1 : 0}
              className={`w-14 text-right py-0.5 px-1 text-xs border rounded focus:outline-none transition-colors ${
                !isBusActive
                  ? 'border-gray-200 bg-gray-100/80 text-gray-400 cursor-not-allowed select-none placeholder:text-gray-300'
                  : isBusMismatch
                    ? 'border-amber-400 bg-amber-50/90 text-amber-900 font-semibold ring-1 ring-amber-300 focus:ring-1 focus:ring-[#162D50] focus:border-[#162D50]'
                    : busValue 
                      ? 'border-gray-200 text-gray-800 font-medium bg-white focus:ring-1 focus:ring-[#162D50] focus:border-[#162D50]' 
                      : 'border-dashed border-gray-300 text-gray-400 bg-white focus:ring-1 focus:ring-[#162D50] focus:border-[#162D50]'
              }`}
              title={
                !isBusActive
                  ? busDisabledReason || 'バス利用が無効に設定されています'
                  : isBusMismatch 
                    ? `対向バス: ¥${recipBusValue || 0}` 
                    : undefined
              }
            />
          </div>
        </div>

        {/* Flight row - disabled for intra-prefecture or inactive routes */}
        <div className="flex items-center justify-between gap-1">
          <span className={`text-[10px] font-medium whitespace-nowrap select-none ${
            (!isFlightActive || isDiagonal) ? 'text-gray-300' : 'text-gray-400'
          }`}>
            フライト
          </span>
          <div className="flex items-center relative">
            <span className={`text-xs mr-0.5 select-none font-normal ${
              (!isFlightActive || isDiagonal) ? 'text-gray-300' : 'text-gray-400'
            }`}>
              ¥
            </span>
            <input
              type="text"
              inputMode="numeric"
              disabled={!isFlightActive || isDiagonal}
              readOnly={!isFlightActive || isDiagonal}
              value={(!isFlightActive || isDiagonal) ? '' : flightValue}
              onChange={(e) => isFlightActive && !isDiagonal && onChange(fromId, toId, 'flight', e.target.value)}
              onBlur={(e) => isFlightActive && !isDiagonal && handleBlur('flight', e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={(!isFlightActive || isDiagonal) ? '—' : '0'}
              tabIndex={(!isFlightActive || isDiagonal) ? -1 : 0}
              className={`w-14 text-right py-0.5 px-1 text-xs border rounded focus:outline-none transition-colors ${
                (!isFlightActive || isDiagonal)
                  ? 'border-gray-200 bg-gray-100/80 text-gray-400 cursor-not-allowed select-none placeholder:text-gray-300'
                  : isFlightMismatch
                    ? 'border-amber-400 bg-amber-50/90 text-amber-900 font-semibold ring-1 ring-amber-300 focus:ring-1 focus:ring-[#162D50] focus:border-[#162D50]'
                    : flightValue 
                      ? 'border-gray-200 text-gray-800 font-medium bg-white focus:ring-1 focus:ring-[#162D50] focus:border-[#162D50]' 
                      : 'border-dashed border-gray-300 text-gray-400 bg-white focus:ring-1 focus:ring-[#162D50] focus:border-[#162D50]'
              }`}
              title={
                isDiagonal
                  ? '同一都道府県内のためフライト料金は設定不要（利用不可）です'
                  : !isFlightActive
                    ? flightDisabledReason || 'フライト利用が無効に設定されています'
                    : isFlightMismatch 
                      ? `対向フライト: ¥${recipFlightValue || 0}` 
                      : undefined
              }
            />
          </div>
        </div>

        {/* Warning Indicator Badge */}
        {showWarning && (
          <span 
            className="absolute -top-1 -right-1 flex h-2 w-2 pointer-events-none"
            title="双方向不整合あり"
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
        )}
      </div>
    </td>
  );
});

/**
 * Individual Travel Matrix Row Component (Memoized)
 */
const TravelRow = React.memo(function TravelRow({
  rowPref,
  rowIndex,
  totalRows,
  visiblePrefectures,
  rowRates,
  ratesByFromId,
  asymmetricKeysMap,
  isAuditMode,
  hoveredCell,
  transportSettings,
  onCellChange,
  onHover
}) {
  const isEven = rowIndex % 2 === 0;
  const isRowHovered = hoveredCell?.fromId === rowPref.id;

  return (
    <tr className={isRowHovered ? 'bg-blue-50/20' : (isEven ? 'bg-white' : 'bg-gray-50/30')}>
      {/* 
        Column 1 (Sticky Left): 
        Rendered once on row 0 spanning all visible rows
      */}
      {rowIndex === 0 && (
        <td
          rowSpan={totalRows}
          className="sticky left-0 z-10 bg-gray-50 border border-gray-200 w-[36px] min-w-[36px] max-w-[36px] text-center text-xs font-semibold text-gray-500 select-none py-6 shadow-[1px_0_0_0_#e5e7eb]"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          到着地域 / 到着県
        </td>
      )}

      {/* 
        Column 2 (Sticky Left):
        [Region Name] Prefecture Name 
      */}
      <td 
        onMouseEnter={() => onHover(rowPref.id, null)}
        className={`sticky left-[36px] z-10 border border-gray-200 px-3 py-1.5 text-xs font-medium whitespace-nowrap shadow-[1px_0_0_0_#e5e7eb] transition-colors ${
          isRowHovered ? 'bg-blue-50 text-blue-900 font-semibold' : 'bg-white text-gray-700'
        }`}
      >
        <span className="font-semibold text-gray-500 mr-1.5">
          [{getCleanRegionName(rowPref.regionName)}]
        </span>
        <span className="text-gray-800 font-medium">
          {rowPref.name}
        </span>
      </td>

      {/* Dynamic Travel Rate Cells across all destination prefectures */}
      {visiblePrefectures.map((colPref) => {
        const isDiagonal = rowPref.id === colPref.id;
        const isColHovered = hoveredCell?.toId === colPref.id;
        const isReciprocalHovered = hoveredCell?.fromId === colPref.id && hoveredCell?.toId === rowPref.id;
        const cellValue = rowRates[colPref.id] || { bus: '', flight: '' };
        const reciprocalValue = ratesByFromId[colPref.id]?.[rowPref.id] || { bus: '', flight: '' };
        const key = `${rowPref.id}_${colPref.id}`;
        const asymmetryDetails = !isDiagonal ? asymmetricKeysMap.get(key) : null;
        const isAsymmetric = !!asymmetryDetails;

        // Transport Mode Availability check
        const isBusActive = transportSettings?.master?.bus !== false && 
          transportSettings?.regions?.[rowPref.regionId]?.bus !== false && 
          transportSettings?.regions?.[colPref.regionId]?.bus !== false;

        const isFlightActive = !isDiagonal && transportSettings?.master?.flight !== false && 
          transportSettings?.regions?.[rowPref.regionId]?.flight !== false && 
          transportSettings?.regions?.[colPref.regionId]?.flight !== false;

        let busDisabledReason = '';
        if (transportSettings?.master?.bus === false) {
          busDisabledReason = 'システム全体でバス利用が無効化されています';
        } else if (transportSettings?.regions?.[rowPref.regionId]?.bus === false) {
          busDisabledReason = `[${getCleanRegionName(rowPref.regionName)}]のバス利用が無効に設定されています`;
        } else if (transportSettings?.regions?.[colPref.regionId]?.bus === false) {
          busDisabledReason = `[${getCleanRegionName(colPref.regionName)}]のバス利用が無効に設定されています`;
        }

        let flightDisabledReason = '';
        if (isDiagonal) {
          flightDisabledReason = '同一都道府県内のためフライト料金は設定不要（利用不可）です';
        } else if (transportSettings?.master?.flight === false) {
          flightDisabledReason = 'システム全体でフライト利用が無効化されています';
        } else if (transportSettings?.regions?.[rowPref.regionId]?.flight === false) {
          flightDisabledReason = `[${getCleanRegionName(rowPref.regionName)}]のフライト利用が無効に設定されています`;
        } else if (transportSettings?.regions?.[colPref.regionId]?.flight === false) {
          flightDisabledReason = `[${getCleanRegionName(colPref.regionName)}]のフライト利用が無効に設定されています`;
        }

        return (
          <TravelCell
            key={key}
            fromId={rowPref.id}
            toId={colPref.id}
            fromName={rowPref.name}
            toName={colPref.name}
            isDiagonal={isDiagonal}
            isRowHovered={isRowHovered}
            isColHovered={isColHovered}
            isReciprocalHovered={isReciprocalHovered}
            isAsymmetric={isAsymmetric}
            asymmetryDetails={asymmetryDetails}
            value={cellValue}
            reciprocalValue={reciprocalValue}
            isAuditMode={isAuditMode}
            isBusActive={isBusActive}
            isFlightActive={isFlightActive}
            busDisabledReason={busDisabledReason}
            flightDisabledReason={flightDisabledReason}
            onChange={onCellChange}
            onHover={onHover}
          />
        );
      })}
    </tr>
  );
});

/**
 * Enhanced, 100% Dynamic Travel Rates Matrix (交通費設定)
 * With Bidirectional Symmetrical Pricing, Auto-Fill Mirroring, and Reconciliation
 */
export default function TravelRateMatrix({ regions = [] }) {
  const [rates, setRates] = useState(() => loadTravelRateMatrix(regions));
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState('ALL');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredCell, setHoveredCell] = useState(null);

  // Symmetrical Mode Toggle (default: ON)
  const [isSymmetric, setIsSymmetric] = useState(true);

  // Audit Matrix Toggle (default: ON)
  const [isAuditMode, setIsAuditMode] = useState(true);

  // Reconcile / Synchronize Modal State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncStrategy, setSyncStrategy] = useState('higher'); // 'higher', 'lower', 'origin', 'destination', 'average'

  // Transport Modes Management (Bus & Flight) State
  const [transportSettings, setTransportSettings] = useState(() => loadTransportModeSettings(regions));
  const [isTransportPanelOpen, setIsTransportPanelOpen] = useState(true);

  // Sync transport mode changes across window/storage
  useEffect(() => {
    const handleTransportUpdate = (e) => {
      if (e.detail) {
        setTransportSettings(e.detail);
      }
    };
    window.addEventListener('oms_transport_modes_updated', handleTransportUpdate);
    return () => {
      window.removeEventListener('oms_transport_modes_updated', handleTransportUpdate);
    };
  }, []);

  // Derive active flattened list of prefectures grouped by active region sequence
  const flattenedPrefectures = useMemo(() => {
    return flattenPrefectures(regions);
  }, [regions]);

  // Sync from backend MongoDB if available on mount
  useEffect(() => {
    let isMounted = true;
    const fetchRemoteRates = async () => {
      try {
        const res = await apiFetch('/api/expenses/travel-rates');
        if (res.ok) {
          const remoteData = await res.json();
          if (remoteData && typeof remoteData === 'object' && Object.keys(remoteData).length > 0) {
            if (isMounted) {
              setRates(prev => {
                const merged = { ...prev, ...remoteData };
                // Ensure diagonal cells have flight: ''
                for (const p of flattenedPrefectures) {
                  const diagKey = `${p.id}_${p.id}`;
                  if (merged[diagKey]) {
                    const item = merged[diagKey];
                    merged[diagKey] = {
                      bus: typeof item === 'object' ? (item.bus ?? '') : (item ?? ''),
                      flight: ''
                    };
                  }
                }
                saveTravelRateMatrix(merged);
                return merged;
              });
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch remote travel rates, using local data:', err);
      }
    };
    fetchRemoteRates();
    return () => { isMounted = false; };
  }, [flattenedPrefectures]);

  // Listen to cross-tab or cross-component travel rate updates
  useEffect(() => {
    const handleRatesUpdate = (e) => {
      if (e.detail) {
        setRates(e.detail);
      }
    };
    window.addEventListener('oms_travel_rates_updated', handleRatesUpdate);
    return () => {
      window.removeEventListener('oms_travel_rates_updated', handleRatesUpdate);
    };
  }, []);

  // Dynamic filter by region & search query
  const visiblePrefectures = useMemo(() => {
    const q = normalizeSearchString(searchQuery);
    return flattenedPrefectures.filter(pref => {
      const matchesRegion = selectedRegionFilter === 'ALL' || pref.regionId === selectedRegionFilter;
      if (!matchesRegion) return false;
      if (!q) return true;
      const prefNameNorm = normalizeSearchString(pref.name);
      const regNameNorm = normalizeSearchString(pref.regionName);
      return prefNameNorm.includes(q) || regNameNorm.includes(q) || pref.name.includes(searchQuery);
    });
  }, [flattenedPrefectures, searchQuery, selectedRegionFilter]);

  // Dynamic visible region groups for Tier 1 header
  const visibleRegions = useMemo(() => {
    const map = new Map();
    for (const pref of visiblePrefectures) {
      if (!map.has(pref.regionId)) {
        map.set(pref.regionId, {
          id: pref.regionId,
          name: pref.regionName,
          count: 0
        });
      }
      map.get(pref.regionId).count++;
    }
    return Array.from(map.values());
  }, [visiblePrefectures]);

  // Grouped rates by row for O(1) row rendering
  const ratesByFromId = useMemo(() => {
    const map = {};
    for (const key in rates) {
      const idx = key.indexOf('_');
      if (idx !== -1) {
        const fromId = key.slice(0, idx);
        const toId = key.slice(idx + 1);
        if (!map[fromId]) map[fromId] = {};
        map[fromId][toId] = rates[key];
      }
    }
    return map;
  }, [rates]);

  // Audit Matrix: Scan all pairs for asymmetric bus or flight rates
  const asymmetricPairs = useMemo(() => {
    const pairs = [];
    const len = flattenedPrefectures.length;
    for (let i = 0; i < len; i++) {
      for (let j = i + 1; j < len; j++) {
        const p1 = flattenedPrefectures[i];
        const p2 = flattenedPrefectures[j];
        const key1 = `${p1.id}_${p2.id}`;
        const key2 = `${p2.id}_${p1.id}`;

        const cell1 = rates[key1] || {};
        const cell2 = rates[key2] || {};

        const bus1 = parsePrice(typeof cell1 === 'object' ? cell1.bus : cell1);
        const bus2 = parsePrice(typeof cell2 === 'object' ? cell2.bus : cell2);
        const flight1 = parsePrice(typeof cell1 === 'object' ? cell1.flight : '');
        const flight2 = parsePrice(typeof cell2 === 'object' ? cell2.flight : '');

        const isBusMismatch = bus1 !== bus2;
        const isFlightMismatch = flight1 !== flight2;

        if (isBusMismatch || isFlightMismatch) {
          pairs.push({
            p1,
            p2,
            key1,
            key2,
            bus1,
            bus2,
            flight1,
            flight2,
            isBusMismatch,
            isFlightMismatch
          });
        }
      }
    }
    return pairs;
  }, [flattenedPrefectures, rates]);

  // Fast map of keys for quick mismatch lookup in cells
  const asymmetricKeysMap = useMemo(() => {
    const map = new Map();
    asymmetricPairs.forEach(p => {
      map.set(p.key1, { isBusMismatch: p.isBusMismatch, isFlightMismatch: p.isFlightMismatch });
      map.set(p.key2, { isBusMismatch: p.isBusMismatch, isFlightMismatch: p.isFlightMismatch });
    });
    return map;
  }, [asymmetricPairs]);

  // Transport mode management toggle handlers
  const handleToggleMaster = (type) => {
    setTransportSettings(prev => {
      // Guard: At least one transport mode must remain enabled
      if (prev.master[type] && !prev.master[type === 'bus' ? 'flight' : 'bus']) {
        toast.error('少なくとも1つの交通手段（バスまたはフライト）を有効にする必要があります');
        return prev;
      }
      const next = {
        ...prev,
        master: {
          ...prev.master,
          [type]: !prev.master[type]
        }
      };
      saveTransportModeSettings(next);
      toast.success(
        type === 'bus' 
          ? `バス利用を${next.master.bus ? '【全体有効】' : '【全体無効】'}に設定しました`
          : `フライト利用を${next.master.flight ? '【全体有効】' : '【全体無効】'}に設定しました`
      );
      return next;
    });
  };

  const handleToggleRegion = (regId, type) => {
    setTransportSettings(prev => {
      const regCurrent = prev.regions[regId] || { bus: true, flight: true };
      const nextVal = regCurrent[type] === false ? true : false;
      const next = {
        ...prev,
        regions: {
          ...prev.regions,
          [regId]: {
            ...regCurrent,
            [type]: nextVal
          }
        }
      };
      saveTransportModeSettings(next);
      return next;
    });
  };

  const handleBulkSetRegions = (type, enabled) => {
    setTransportSettings(prev => {
      const nextRegions = { ...prev.regions };
      for (const reg of regions) {
        nextRegions[reg.id] = {
          ...(nextRegions[reg.id] || { bus: true, flight: true }),
          [type]: enabled
        };
      }
      const next = {
        ...prev,
        regions: nextRegions
      };
      saveTransportModeSettings(next);
      toast.success(`全地域の${type === 'bus' ? 'バス' : 'フライト'}を【${enabled ? '有効' : '無効'}】に一括変更しました`);
      return next;
    });
  };

  const handleResetTransportSettings = () => {
    const defaults = getDefaultTransportModeSettings(regions);
    setTransportSettings(defaults);
    saveTransportModeSettings(defaults);
    toast.success('交通手段設定を標準の全有効状態にリセットしました');
  };

  // Single cell bus or flight rate update handler with real-time mirroring
  const handleCellChange = useCallback((fromId, toId, type, val) => {
    // Diagonal Guard: Flight prices do not apply to same-location routes
    if (fromId === toId && type === 'flight') return;

    // Transport availability guard
    const fromPref = flattenedPrefectures.find(p => p.id === fromId);
    const toPref = flattenedPrefectures.find(p => p.id === toId);
    if (fromPref && toPref) {
      if (type === 'bus') {
        const isBusActive = transportSettings?.master?.bus !== false &&
          transportSettings?.regions?.[fromPref.regionId]?.bus !== false &&
          transportSettings?.regions?.[toPref.regionId]?.bus !== false;
        if (!isBusActive) return;
      } else if (type === 'flight') {
        const isFlightActive = transportSettings?.master?.flight !== false &&
          transportSettings?.regions?.[fromPref.regionId]?.flight !== false &&
          transportSettings?.regions?.[toPref.regionId]?.flight !== false;
        if (!isFlightActive) return;
      }
    }

    const key = `${fromId}_${toId}`;
    setRates(prev => {
      const existing = prev[key];
      const newObj = (existing && typeof existing === 'object') 
        ? { ...existing } 
        : { bus: existing || '', flight: '' };
      
      if (fromId === toId) {
        newObj.flight = '';
      }
      newObj[type] = val;

      const next = {
        ...prev,
        [key]: newObj
      };

      // Diagonal Guard: If origin === dest, update only this cell without mirroring
      if (isSymmetric && fromId !== toId) {
        const reciprocalKey = `${toId}_${fromId}`;
        const recipExisting = prev[reciprocalKey];
        const recipNewObj = (recipExisting && typeof recipExisting === 'object')
          ? { ...recipExisting }
          : { bus: recipExisting || '', flight: '' };
        recipNewObj[type] = val;
        next[reciprocalKey] = recipNewObj;
      }

      return next;
    });
  }, [isSymmetric, flattenedPrefectures, transportSettings]);

  // Cell hover handler throttled with requestAnimationFrame for 60fps smooth rendering
  const hoverRafRef = useRef(null);
  const handleCellHover = useCallback((fromId, toId) => {
    if (hoverRafRef.current) cancelAnimationFrame(hoverRafRef.current);
    hoverRafRef.current = requestAnimationFrame(() => {
      setHoveredCell({ fromId, toId });
    });
  }, []);

  const handleMouseLeaveTable = useCallback(() => {
    if (hoverRafRef.current) cancelAnimationFrame(hoverRafRef.current);
    setHoveredCell(null);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverRafRef.current) cancelAnimationFrame(hoverRafRef.current);
    };
  }, []);

  // Bulk Reconcile Function (Synchronize All) for Bus & Flight
  const handleBulkReconcile = (strategy = syncStrategy) => {
    if (asymmetricPairs.length === 0) {
      toast.success('すべての交通費は既に対称です');
      setIsSyncModalOpen(false);
      return;
    }

    setRates(prev => {
      const next = { ...prev };

      asymmetricPairs.forEach(({ key1, key2, bus1, bus2, flight1, flight2 }) => {
        let targetBus = 0;
        let targetFlight = 0;

        if (strategy === 'higher') {
          targetBus = Math.max(bus1, bus2);
          targetFlight = Math.max(flight1, flight2);
        } else if (strategy === 'lower') {
          targetBus = Math.min(bus1, bus2);
          targetFlight = Math.min(flight1, flight2);
        } else if (strategy === 'origin') {
          targetBus = bus1;
          targetFlight = flight1;
        } else if (strategy === 'destination') {
          targetBus = bus2;
          targetFlight = flight2;
        } else if (strategy === 'average') {
          targetBus = Math.round((bus1 + bus2) / 2);
          targetFlight = Math.round((flight1 + flight2) / 2);
        } else {
          targetBus = Math.max(bus1, bus2);
          targetFlight = Math.max(flight1, flight2);
        }

        const reconciledObj = {
          bus: targetBus ? targetBus.toLocaleString() : '',
          flight: targetFlight ? targetFlight.toLocaleString() : ''
        };

        next[key1] = { ...reconciledObj };
        next[key2] = { ...reconciledObj };
      });

      saveTravelRateMatrix(next);
      return next;
    });

    toast.success(`${asymmetricPairs.length} 組の非対称な交通費を双方向対称に統一しました！`);
    setIsSyncModalOpen(false);
  };

  // Auto-fill empty cells with standard presets
  const handleAutoFillPresets = () => {
    const standardRates = generateInitialTravelRates(regions);
    setRates(prev => {
      const merged = { ...standardRates, ...prev };
      toast.success('標準交通費の初期値を未設定セルに適用しました');
      return merged;
    });
  };

  // Reset travel matrix to standard defaults
  const handleResetToDefault = async () => {
    const confirmed = await toastConfirm('交通費設定を標準の初期料金にリセットしますか？現在の編集内容は上書きされます。');
    if (!confirmed) return;
    const standardRates = generateInitialTravelRates(regions);
    setRates(standardRates);
    saveTravelRateMatrix(standardRates);
    try {
      await apiFetch('/api/expenses/travel-rates', {
        method: 'PUT',
        body: JSON.stringify(standardRates)
      });
    } catch (e) {
      console.warn('Failed to sync reset to remote server:', e);
    }
    toast.success('標準交通費に初期化しました');
  };

  // Save matrix to local storage & backend API
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Ensure all diagonal cells have flight: '' before persisting
      const sanitized = { ...rates };
      for (const pref of flattenedPrefectures) {
        const diagKey = `${pref.id}_${pref.id}`;
        if (sanitized[diagKey]) {
          const item = sanitized[diagKey];
          sanitized[diagKey] = {
            bus: typeof item === 'object' ? (item.bus ?? '') : (item ?? ''),
            flight: ''
          };
        }
      }

      // 1. Save to localStorage immediately
      saveTravelRateMatrix(sanitized);
      saveTransportModeSettings(transportSettings);

      // 2. Persist to server backend API
      try {
        await apiFetch('/api/expenses/travel-rates', {
          method: 'PUT',
          body: JSON.stringify(sanitized)
        });
      } catch (apiErr) {
        console.warn('Failed to sync travel rates to remote API, saved locally:', apiErr);
      }

      setRates(sanitized);
      toast.success('交通費の変更が保存されました！');
    } catch (err) {
      console.error('Error saving travel rate matrix:', err);
      toast.error(`変更の保存中にエラーが発生しました: ${err.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Active region groups list
  const activeRegions = useMemo(() => {
    return regions.filter(r => r.prefectures && r.prefectures.length > 0);
  }, [regions]);

  // Calculate configuration progress stats
  const configuredCount = useMemo(() => {
    let count = 0;
    const values = Object.values(rates);
    for (let i = 0; i < values.length; i++) {
      const item = values[i];
      if (item && (item.bus || item.flight)) count++;
    }
    return count;
  }, [rates]);

  const totalPossible = flattenedPrefectures.length * flattenedPrefectures.length;

  return (
    <div className={`flex flex-col flex-1 bg-white rounded-lg shadow-sm border border-gray-200 ${
      isFullscreen ? 'fixed inset-4 z-50 overflow-hidden' : ''
    }`}>
      
      {/* Top Action Bar */}
      <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-[#162D50]">
              交通費設定
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              {activeRegions.length} 地域 / {flattenedPrefectures.length} 都道府県
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
            <span>設定済み: <strong className="text-gray-700">{configuredCount}</strong> / {totalPossible} パターン</span>
            <span className="text-gray-300">•</span>
            <span>地域管理の最新構成と自動同期中</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Preset Fill Button */}
          <button
            type="button"
            onClick={handleAutoFillPresets}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium transition-colors flex items-center gap-1.5"
            title="標準交通費を未設定セルに適用"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>標準料金を自動補完</span>
          </button>

          {/* Reset to standard rates */}
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium transition-colors flex items-center gap-1.5"
            title="標準料金にリセット"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-600" />
            <span>初期値にリセット</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(prev => !prev)}
            className="p-2 border border-gray-200 hover:bg-gray-50 rounded text-gray-600 transition-colors"
            title={isFullscreen ? '通常表示に戻す' : '全画面表示'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Primary Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-[#162D50] hover:bg-[#112440] text-white rounded font-medium text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSaving ? '保存中...' : '変更を保存'}
          </button>
        </div>
      </div>

      {/* Symmetrical Pricing & Audit Status Toolbar */}
      <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          {/* Symmetrical Mode Toggle Switch */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={isSymmetric}
              onClick={() => setIsSymmetric(prev => !prev)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-[#162D50] ${
                isSymmetric ? 'bg-[#162D50]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isSymmetric ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <div 
              className="flex items-center gap-1.5 cursor-pointer select-none" 
              onClick={() => setIsSymmetric(prev => !prev)}
            >
              <ArrowLeftRight className={`w-3.5 h-3.5 ${isSymmetric ? 'text-[#162D50]' : 'text-gray-400'}`} />
              <span className="font-bold text-gray-800">
                双方向自動同期 (Symmetrical Pricing)
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                isSymmetric ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'
              }`}>
                {isSymmetric ? 'ON (連動中)' : 'OFF (個別入力)'}
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-gray-300 hidden sm:block" />

          {/* Audit Status & Toggle */}
          <button
            type="button"
            onClick={() => setIsAuditMode(prev => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors cursor-pointer ${
              isAuditMode
                ? 'bg-white border-gray-300 text-gray-700 shadow-xs'
                : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-200/50'
            }`}
            title="非対称セルの警告表示を切り替え"
          >
            {asymmetricPairs.length > 0 ? (
              <span className="flex items-center gap-1 text-amber-700 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>整合性チェック: <strong>{asymmetricPairs.length}</strong> 組の非対称</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>整合性OK (100% 対称)</span>
              </span>
            )}
            <span className="text-[10px] text-gray-400">({isAuditMode ? '強調ON' : '強調OFF'})</span>
          </button>
        </div>

        {/* Synchronize All Button */}
        <div>
          <button
            type="button"
            onClick={() => setIsSyncModalOpen(true)}
            disabled={asymmetricPairs.length === 0}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
              asymmetricPairs.length > 0
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm ring-1 ring-amber-500/50 cursor-pointer animate-pulse'
                : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
            }`}
            title={asymmetricPairs.length === 0 ? 'すべての料金は既に対称です' : `${asymmetricPairs.length}組の非対称料金を一括で統一します`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>双方向料金の一括統一 (Synchronize All)</span>
            {asymmetricPairs.length > 0 && (
              <span className="bg-amber-800 text-white px-1.5 py-0.2 rounded-full text-[10px]">
                {asymmetricPairs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Accordion Component: 交通手段の有効・無効管理 (Bus & Flight Management) */}
      <div className="mx-4 sm:mx-6 mt-4 border border-blue-200/90 rounded-xl bg-white shadow-xs overflow-hidden transition-all duration-200">
        {/* Accordion Header (Clickable full-width header) */}
        <button
          type="button"
          onClick={() => setIsTransportPanelOpen(prev => !prev)}
          className="w-full px-4 sm:px-5 py-3.5 bg-gradient-to-r from-slate-50 via-white to-blue-50/30 hover:bg-blue-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left transition-colors cursor-pointer select-none group"
          aria-expanded={isTransportPanelOpen}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#162D50] text-white rounded-lg shadow-xs group-hover:scale-105 transition-transform">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#162D50] transition-colors">
                  交通手段の有効・無効管理 (Bus & Flight Management)
                </h3>
                <span className="text-[10px] bg-blue-100 text-[#162D50] font-bold px-2 py-0.5 rounded-full">
                  アコーディオン設定
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                全体マスター一括制御および 8 地域ごとのバス・フライト利用可否（クリックで展開／折りたたみ）
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Live Status Indicators in Accordion Header */}
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold ${
                transportSettings.master.bus 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}>
                <Bus className="w-3.5 h-3.5" />
                <span>バス: {transportSettings.master.bus ? 'ON' : 'OFF'}</span>
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold ${
                transportSettings.master.flight 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}>
                <Plane className="w-3.5 h-3.5" />
                <span>フライト: {transportSettings.master.flight ? 'ON' : 'OFF'}</span>
              </span>
            </div>

            <div className="h-4 w-px bg-gray-300 hidden sm:block mx-0.5" />

            {/* Accordion toggle indicator */}
            <span className="text-xs text-gray-600 font-medium flex items-center gap-1">
              <span>{isTransportPanelOpen ? '折りたたむ' : '設定を展開'}</span>
              <ChevronDown className={`w-4 h-4 text-gray-500 group-hover:text-gray-800 transition-transform duration-200 ${
                isTransportPanelOpen ? 'rotate-180' : 'rotate-0'
              }`} />
            </span>
          </div>
        </button>

        {/* Accordion Body Content */}
        {isTransportPanelOpen && (
          <div className="p-4 sm:p-5 border-t border-blue-100 bg-gradient-to-b from-white to-slate-50/50 space-y-5 animate-in fade-in duration-200">
            {/* Panel Description & Reset Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-gray-200/80 gap-3">
              <p className="text-xs text-gray-600">
                無効化された交通手段はマトリクス入力がロック（—表示）され、新規案件やスタッフの経費精算申請でも対象外となります。
              </p>
              <button
                type="button"
                onClick={handleResetTransportSettings}
                className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer shrink-0"
                title="すべての設定を標準の全有効状態に戻す"
              >
                <RotateCcw className="w-3 h-3" />
                <span>全有効にリセット</span>
              </button>
            </div>

            {/* Section 1: Master Toggles (全体マスター一括制御) */}
            <div className="pb-4 border-b border-gray-200/80">
              <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <span>全体マスター一括制御 (System-wide Master Toggles)</span>
                <span className="text-[10px] text-gray-400 font-normal">※OFFに設定すると全地域で該当の交通手段が即座に停止されます</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Master Bus Toggle Card */}
                <div className={`p-3.5 rounded-lg border transition-all flex items-center justify-between ${
                  transportSettings.master.bus 
                    ? 'bg-white border-emerald-300 ring-1 ring-emerald-200 shadow-xs' 
                    : 'bg-gray-100 border-gray-300 opacity-80'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${
                      transportSettings.master.bus ? 'bg-emerald-500 text-white shadow-xs' : 'bg-gray-300 text-gray-600'
                    }`}>
                      <Bus className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">バス利用 (Bus)</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          transportSettings.master.bus ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                        }`}>
                          {transportSettings.master.bus ? '全体有効 (Active)' : '全体無効 (Disabled)'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {transportSettings.master.bus ? '全国の路線でバス料金入力・申請が利用可能です' : '全国ですべてのバス料金入力・申請を停止中'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={transportSettings.master.bus}
                    onClick={() => handleToggleMaster('bus')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      transportSettings.master.bus ? 'bg-emerald-600' : 'bg-gray-300'
                    }`}
                    title={`バス利用を${transportSettings.master.bus ? '無効化' : '有効化'}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        transportSettings.master.bus ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Master Flight Toggle Card */}
                <div className={`p-3.5 rounded-lg border transition-all flex items-center justify-between ${
                  transportSettings.master.flight 
                    ? 'bg-white border-blue-300 ring-1 ring-blue-200 shadow-xs' 
                    : 'bg-gray-100 border-gray-300 opacity-80'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${
                      transportSettings.master.flight ? 'bg-blue-600 text-white shadow-xs' : 'bg-gray-300 text-gray-600'
                    }`}>
                      <Plane className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">フライト利用 (Flight)</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          transportSettings.master.flight ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-700'
                        }`}>
                          {transportSettings.master.flight ? '全体有効 (Active)' : '全体無効 (Disabled)'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {transportSettings.master.flight ? '都道府県間をまたぐフライト料金入力・申請が利用可能です' : '全国ですべてのフライト料金入力・申請を停止中'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={transportSettings.master.flight}
                    onClick={() => handleToggleMaster('flight')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      transportSettings.master.flight ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    title={`フライト利用を${transportSettings.master.flight ? '無効化' : '有効化'}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        transportSettings.master.flight ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Section 2: Per-Region Toggle Controls (地域別個別制御) */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2.5">
                <div className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span>地域別個別制御 (Per-Region Controls)</span>
                  <span className="text-[10px] text-gray-400 font-normal">※地域単位でバスまたはフライトの利用可否を個別に設定できます</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleBulkSetRegions('flight', true)}
                    className="text-[11px] text-blue-700 hover:underline px-2 py-0.5 bg-blue-50 rounded border border-blue-200 cursor-pointer"
                  >
                    全地域フライトON
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkSetRegions('flight', false)}
                    className="text-[11px] text-gray-600 hover:underline px-2 py-0.5 bg-gray-100 rounded border border-gray-200 cursor-pointer"
                  >
                    全地域フライトOFF
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {activeRegions.map(reg => {
                  const regSettings = transportSettings.regions[reg.id] || { bus: true, flight: true };
                  const isBusActive = transportSettings.master.bus && regSettings.bus !== false;
                  const isFlightActive = transportSettings.master.flight && regSettings.flight !== false;

                  return (
                    <div 
                      key={reg.id}
                      className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs hover:border-gray-300 transition-colors flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                        <span className="font-bold text-xs text-gray-800">
                          {getCleanRegionName(reg.name)}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {reg.prefectures?.length || 0} 県
                        </span>
                      </div>

                      {/* Bus Switch for Region */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <Bus className={`w-3.5 h-3.5 ${isBusActive ? 'text-emerald-600' : 'text-gray-300'}`} />
                          <span className={`${isBusActive ? 'text-gray-700 font-medium' : 'text-gray-400 line-through'}`}>
                            バス
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={!transportSettings.master.bus}
                          onClick={() => handleToggleRegion(reg.id, 'bus')}
                          className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                            isBusActive ? 'bg-emerald-600' : 'bg-gray-300'
                          }`}
                          title={!transportSettings.master.bus ? '全体マスターでバスが無効です' : `${getCleanRegionName(reg.name)}のバス利用を切り替え`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                              isBusActive ? 'translate-x-3.5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Flight Switch for Region */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <Plane className={`w-3.5 h-3.5 ${isFlightActive ? 'text-blue-600' : 'text-gray-300'}`} />
                          <span className={`${isFlightActive ? 'text-gray-700 font-medium' : 'text-gray-400 line-through'}`}>
                            フライト
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={!transportSettings.master.flight}
                          onClick={() => handleToggleRegion(reg.id, 'flight')}
                          className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                            isFlightActive ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                          title={!transportSettings.master.flight ? '全体マスターでフライトが無効です' : `${getCleanRegionName(reg.name)}のフライト利用を切り替え`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                              isFlightActive ? 'translate-x-3.5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Search & Region Filter Toolbar */}
      <div className="px-4 sm:px-6 py-3 bg-gray-50/60 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="地域名・県名で絞り込み..."
            className="w-full pl-8 pr-7 py-1.5 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#162D50]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Region Filter Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-0.5">
          <button
            onClick={() => setSelectedRegionFilter('ALL')}
            className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedRegionFilter === 'ALL'
                ? 'bg-[#162D50] text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            すべて ({flattenedPrefectures.length})
          </button>
          {activeRegions.map(reg => (
            <button
              key={reg.id}
              onClick={() => setSelectedRegionFilter(reg.id)}
              className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedRegionFilter === reg.id
                  ? 'bg-[#162D50] text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {getCleanRegionName(reg.name)} ({reg.prefectures?.length || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Matrix Table Viewport */}
      <div 
        onMouseLeave={handleMouseLeaveTable}
        className="p-4 sm:p-6 flex-1 overflow-hidden flex flex-col"
      >
        <div className="overflow-x-auto overflow-y-auto max-h-[750px] border border-gray-200 rounded-lg shadow-inner flex-1">
          <table className="border-separate border-spacing-0 min-w-max text-left">
            <thead>
              {/* 
                Tier 1 (Top Header):
                Region Names spanning child prefectures 
              */}
              <tr className="h-[38px]">
                {/* Fixed Top-Left Corner Header Cell spanning 2 columns and 2 header rows */}
                <th
                  colSpan={2}
                  rowSpan={2}
                  className="sticky left-0 top-0 z-30 bg-gray-50 border-b border-r border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-700 select-none whitespace-nowrap min-w-[210px] shadow-[1px_1px_0_0_#e5e7eb]"
                >
                  出発地域 / 出発県
                </th>

                {/* Region Group Headers */}
                {visibleRegions.map((region) => {
                  const cleanName = getCleanRegionName(region.name);
                  const isTohoku = cleanName.toLowerCase() === 'tohoku';
                  const displayName = isTohoku ? 'TOHOKU' : cleanName;

                  return (
                    <th
                      key={region.id}
                      colSpan={region.count}
                      className="sticky top-0 z-20 bg-gray-50 border-b border-r border-gray-200 px-2 py-2 text-center text-xs font-bold text-gray-800 tracking-wide select-none shadow-[0_1px_0_0_#e5e7eb]"
                    >
                      {displayName}
                    </th>
                  );
                })}
              </tr>

              {/* 
                Tier 2 (Sub Header):
                Prefecture Names aligned vertically with consistent 88px column widths for bus & flight
              */}
              <tr className="h-[96px]">
                {visiblePrefectures.map((pref) => {
                  const isColHovered = hoveredCell?.toId === pref.id;

                  return (
                    <th
                      key={pref.id}
                      onMouseEnter={() => handleCellHover(null, pref.id)}
                      className={`sticky top-[38px] z-20 border-b border-r border-gray-200 py-2.5 px-0.5 text-center min-w-[88px] w-[88px] max-w-[88px] select-none shadow-[0_1px_0_0_#e5e7eb] transition-colors ${
                        isColHovered ? 'bg-blue-100/70 text-blue-900 font-bold' : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span
                        className="inline-block text-xs font-medium tracking-wider"
                        style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}
                      >
                        {pref.name}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {visiblePrefectures.length === 0 ? (
                <tr>
                  <td colSpan={100} className="p-12 text-center text-gray-400 text-sm font-medium">
                    一致する地域または都道府県が見つかりません
                  </td>
                </tr>
              ) : (
                visiblePrefectures.map((rowPref, rowIndex) => {
                  const rowRates = ratesByFromId[rowPref.id] || {};

                  return (
                    <TravelRow
                      key={rowPref.id}
                      rowPref={rowPref}
                      rowIndex={rowIndex}
                      totalRows={visiblePrefectures.length}
                      visiblePrefectures={visiblePrefectures}
                      rowRates={rowRates}
                      ratesByFromId={ratesByFromId}
                      asymmetricKeysMap={asymmetricKeysMap}
                      isAuditMode={isAuditMode}
                      hoveredCell={hoveredCell}
                      transportSettings={transportSettings}
                      onCellChange={handleCellChange}
                      onHover={handleCellHover}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Synchronize All Modal Dialog for Travel Rates */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#162D50] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-lg">
                  <ArrowLeftRight className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base">交通費の双方向一括統一</h3>
                  <p className="text-xs text-blue-200">
                    検出された {asymmetricPairs.length} 組の非対称料金を双方向対称に揃えます
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSyncModalOpen(false)}
                className="p-1 text-white/70 hover:text-white rounded-md hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                  統一ルールを選択してください (バス・フライト各々に適用)
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: 'higher',
                      title: '高額優先 (Higher Rate) 【推奨】',
                      desc: '高い方の料金を採用します（不足や収益損失を防止）',
                      example: '¥530 vs ¥4,530 → ¥4,530'
                    },
                    {
                      id: 'lower',
                      title: '低額優先 (Lower Rate)',
                      desc: '低い方の料金を採用します（顧客・従業員向けコスト抑制）',
                      example: '¥530 vs ¥4,530 → ¥530'
                    },
                    {
                      id: 'origin',
                      title: '出発地(行)優先 (Origin / Row Rate)',
                      desc: '行側（出発地）の登録料金を採用します',
                      example: '行の値に統一'
                    },
                    {
                      id: 'destination',
                      title: '到着地(列)優先 (Destination / Column Rate)',
                      desc: '列側（到着地）の登録料金を採用します',
                      example: '列の値に統一'
                    },
                    {
                      id: 'average',
                      title: '平均値 (Average Rate)',
                      desc: '両方向の平均料金を採用します',
                      example: '(¥530 + ¥4,530) / 2 = ¥2,530'
                    }
                  ].map(rule => (
                    <label
                      key={rule.id}
                      className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                        syncStrategy === rule.id
                          ? 'border-[#162D50] bg-emerald-50/50 ring-1 ring-[#162D50]'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="syncStrategy"
                        value={rule.id}
                        checked={syncStrategy === rule.id}
                        onChange={() => setSyncStrategy(rule.id)}
                        className="mt-0.5 text-[#162D50] focus:ring-[#162D50]"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-bold text-gray-800">{rule.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{rule.desc}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5 font-mono">例: {rule.example}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sample Preview List */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-gray-700 uppercase mb-2">
                  <span>対象ペアのプレビュー (上位最大5件)</span>
                  <span className="text-gray-400">全 {asymmetricPairs.length} 件</span>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 max-h-36 overflow-y-auto divide-y divide-gray-200 text-xs">
                  {asymmetricPairs.slice(0, 5).map(({ p1, p2, bus1, bus2, flight1, flight2, isBusMismatch, isFlightMismatch }) => {
                    let targetBus = 0;
                    let targetFlight = 0;
                    if (syncStrategy === 'higher') {
                      targetBus = Math.max(bus1, bus2);
                      targetFlight = Math.max(flight1, flight2);
                    } else if (syncStrategy === 'lower') {
                      targetBus = Math.min(bus1, bus2);
                      targetFlight = Math.min(flight1, flight2);
                    } else if (syncStrategy === 'origin') {
                      targetBus = bus1;
                      targetFlight = flight1;
                    } else if (syncStrategy === 'destination') {
                      targetBus = bus2;
                      targetFlight = flight2;
                    } else if (syncStrategy === 'average') {
                      targetBus = Math.round((bus1 + bus2) / 2);
                      targetFlight = Math.round((flight1 + flight2) / 2);
                    }

                    return (
                      <div key={`${p1.id}_${p2.id}`} className="py-2 space-y-1">
                        <div className="flex items-center justify-between font-semibold text-gray-800">
                          <span>{p1.name} ↔ {p2.name}</span>
                        </div>
                        {isBusMismatch && (
                          <div className="flex items-center justify-between text-[11px] font-mono text-gray-600 pl-2">
                            <span>バス: ¥{bus1.toLocaleString()} / ¥{bus2.toLocaleString()}</span>
                            <span className="text-[#162D50] font-bold">→ ¥{targetBus.toLocaleString()}</span>
                          </div>
                        )}
                        {isFlightMismatch && (
                          <div className="flex items-center justify-between text-[11px] font-mono text-gray-600 pl-2">
                            <span>フライト: ¥{flight1.toLocaleString()} / ¥{flight2.toLocaleString()}</span>
                            <span className="text-[#162D50] font-bold">→ ¥{targetFlight.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {asymmetricPairs.length > 5 && (
                    <div className="pt-1.5 text-center text-gray-400 text-[11px]">
                      他 {asymmetricPairs.length - 5} 件のペアも同様に同期されます
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsSyncModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => handleBulkReconcile(syncStrategy)}
                className="px-4 py-2 bg-[#162D50] hover:bg-[#112440] text-white rounded text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>一括同期を適用 ({asymmetricPairs.length}組)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
