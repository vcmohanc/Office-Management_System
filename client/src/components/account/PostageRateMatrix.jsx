import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Save, 
  CheckCircle2, 
  Sparkles,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { toastConfirm } from '../../utils/toastConfirm.jsx';
import { apiFetch } from '../../utils/apiFetch.js';
import { 
  flattenPrefectures, 
  loadPostalRateMatrix, 
  savePostalRateMatrix, 
  generateInitialPostalRates,
  getCleanRegionName,
  normalizeSearchString 
} from '../../utils/regionHelper.js';

/**
 * Individual Rate Cell Component (Memoized for peak rendering performance)
 */
const PostageCell = React.memo(function PostageCell({
  fromId,
  toId,
  isDiagonal,
  isRowHovered,
  isColHovered,
  value,
  onChange,
  onHover
}) {
  const displayValue = value === 'なし' ? '' : (value ?? '');

  const handleBlur = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    if (raw) {
      const formatted = Number(raw).toLocaleString();
      if (formatted !== displayValue) {
        onChange(fromId, toId, formatted);
      }
    } else if (displayValue !== '') {
      onChange(fromId, toId, '');
    }
  };

  return (
    <td 
      onMouseEnter={() => onHover(fromId, toId)}
      className={`p-1 border border-gray-200 text-center transition-colors ${
        isDiagonal 
          ? 'bg-amber-50/20' 
          : (isRowHovered || isColHovered) 
            ? 'bg-blue-50/30' 
            : 'bg-white'
      } hover:bg-blue-100/40`}
    >
      <div className="flex items-center justify-center">
        <span className="text-gray-400 text-xs mr-0.5 select-none font-normal">¥</span>
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={(e) => onChange(fromId, toId, e.target.value)}
          onBlur={handleBlur}
          placeholder="0"
          className={`w-16 text-right py-1 px-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-[#162D50] focus:border-[#162D50] bg-white transition-colors ${
            displayValue 
              ? 'border-gray-200 text-gray-800 font-medium' 
              : 'border-dashed border-gray-300 text-gray-400'
          }`}
        />
      </div>
    </td>
  );
});

/**
 * Individual Row Component (Memoized)
 */
const PostageRow = React.memo(function PostageRow({
  rowPref,
  rowIndex,
  totalRows,
  visiblePrefectures,
  rowRates,
  hoveredCell,
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
          着信地域 / 着信県
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

      {/* Dynamic Rate Cells across all destination prefectures */}
      {visiblePrefectures.map((colPref) => {
        const isDiagonal = rowPref.id === colPref.id;
        const isColHovered = hoveredCell?.toId === colPref.id;
        const cellValue = rowRates[colPref.id] ?? '';

        return (
          <PostageCell
            key={`${rowPref.id}_${colPref.id}`}
            fromId={rowPref.id}
            toId={colPref.id}
            isDiagonal={isDiagonal}
            isRowHovered={isRowHovered}
            isColHovered={isColHovered}
            value={cellValue}
            onChange={onCellChange}
            onHover={onHover}
          />
        );
      })}
    </tr>
  );
});

/**
 * Enhanced, 100% Dynamic Postage Rates Matrix (郵便料金設定)
 */
export default function PostageRateMatrix({ regions = [] }) {
  const [rates, setRates] = useState(() => loadPostalRateMatrix(regions));
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState('ALL');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredCell, setHoveredCell] = useState(null);

  // Derive active flattened list of prefectures grouped by active region sequence
  const flattenedPrefectures = useMemo(() => {
    return flattenPrefectures(regions);
  }, [regions]);

  // Sync from backend MongoDB if available on mount
  useEffect(() => {
    let isMounted = true;
    const fetchRemoteRates = async () => {
      try {
        const res = await apiFetch('/api/expenses/postal-rates');
        if (res.ok) {
          const remoteData = await res.json();
          if (remoteData && typeof remoteData === 'object' && Object.keys(remoteData).length > 0) {
            if (isMounted) {
              setRates(prev => {
                const merged = { ...prev, ...remoteData };
                savePostalRateMatrix(merged);
                return merged;
              });
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch remote postal rates, using local data:', err);
      }
    };
    fetchRemoteRates();
    return () => { isMounted = false; };
  }, []);

  // Listen to cross-tab or cross-component postal rate updates
  useEffect(() => {
    const handleRatesUpdate = (e) => {
      if (e.detail) {
        setRates(e.detail);
      }
    };
    window.addEventListener('oms_postal_rates_updated', handleRatesUpdate);
    return () => {
      window.removeEventListener('oms_postal_rates_updated', handleRatesUpdate);
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

  // Single cell update handler
  const handleCellChange = useCallback((fromId, toId, val) => {
    const key = `${fromId}_${toId}`;
    setRates(prev => ({
      ...prev,
      [key]: val
    }));
  }, []);

  // Cell hover handler for crosshair highlights
  const handleCellHover = useCallback((fromId, toId) => {
    setHoveredCell({ fromId, toId });
  }, []);

  // Auto-fill empty cells with standard presets
  const handleAutoFillPresets = () => {
    const standardRates = generateInitialPostalRates(regions);
    setRates(prev => {
      const merged = { ...standardRates, ...prev };
      toast.success('標準料金の初期値を未設定セルに適用しました');
      return merged;
    });
  };

  // Reset matrix to standard defaults
  const handleResetToDefault = async () => {
    const confirmed = await toastConfirm('郵便料金設定を標準の初期料金にリセットしますか？現在の編集内容は上書きされます。');
    if (!confirmed) return;
    const standardRates = generateInitialPostalRates(regions);
    setRates(standardRates);
    savePostalRateMatrix(standardRates);
    try {
      await apiFetch('/api/expenses/postal-rates', {
        method: 'PUT',
        body: JSON.stringify(standardRates)
      });
    } catch (e) {
      console.warn('Failed to sync reset to remote server:', e);
    }
    toast.success('標準料金に初期化しました');
  };

  // Save matrix to local storage & backend API
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Save to localStorage immediately
      savePostalRateMatrix(rates);

      // 2. Persist to server backend API
      try {
        await apiFetch('/api/expenses/postal-rates', {
          method: 'PUT',
          body: JSON.stringify(rates)
        });
      } catch (apiErr) {
        console.warn('Failed to sync to remote API, saved locally:', apiErr);
      }

      toast.success('郵便料金の変更が保存されました！');
    } catch (err) {
      console.error('Error saving postage rate matrix:', err);
      toast.error(`変更の保存中にエラーが発生しました: ${err.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Grouped rates by row for memoized row rendering
  const ratesByFromId = useMemo(() => {
    const map = {};
    for (const [key, value] of Object.entries(rates)) {
      const parts = key.split('_');
      if (parts.length === 2) {
        const [fromId, toId] = parts;
        if (!map[fromId]) map[fromId] = {};
        map[fromId][toId] = value;
      }
    }
    return map;
  }, [rates]);

  // Active region groups list
  const activeRegions = useMemo(() => {
    return regions.filter(r => r.prefectures && r.prefectures.length > 0);
  }, [regions]);

  // Calculate configuration progress stats
  const configuredCount = useMemo(() => {
    let count = 0;
    for (const fromPref of flattenedPrefectures) {
      for (const toPref of flattenedPrefectures) {
        const key = `${fromPref.id}_${toPref.id}`;
        if (rates[key] && rates[key] !== 'なし') count++;
      }
    }
    return count;
  }, [flattenedPrefectures, rates]);

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
              郵便料金設定
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
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
            title="標準料金を未設定セルに適用"
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
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded font-medium text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            {isSaving ? '保存中...' : '変更を保存'}
          </button>
        </div>
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
            className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
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
              className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
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
        onMouseLeave={() => setHoveredCell(null)}
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
                  className="sticky left-0 top-0 z-30 bg-gray-50 border-b border-r border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-700 select-none whitespace-nowrap min-w-[196px] shadow-[1px_1px_0_0_#e5e7eb]"
                >
                  送信地域 / 送信県
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
                Prefecture Names aligned vertically with consistent 56px column widths 
              */}
              <tr className="h-[96px]">
                {visiblePrefectures.map((pref) => {
                  const isColHovered = hoveredCell?.toId === pref.id;

                  return (
                    <th
                      key={pref.id}
                      onMouseEnter={() => handleCellHover(null, pref.id)}
                      className={`sticky top-[38px] z-20 border-b border-r border-gray-200 py-2.5 px-0.5 text-center min-w-[56px] w-[56px] max-w-[56px] select-none shadow-[0_1px_0_0_#e5e7eb] transition-colors ${
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
                    <PostageRow
                      key={rowPref.id}
                      rowPref={rowPref}
                      rowIndex={rowIndex}
                      totalRows={visiblePrefectures.length}
                      visiblePrefectures={visiblePrefectures}
                      rowRates={rowRates}
                      hoveredCell={hoveredCell}
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
    </div>
  );
}
