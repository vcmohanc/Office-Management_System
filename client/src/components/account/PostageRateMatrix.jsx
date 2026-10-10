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
  AlertTriangle
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
 * Numeric price parser - strips non-digit characters (¥, commas, spaces)
 */
const parsePrice = (val) => {
  if (val === null || val === undefined || val === '' || val === 'なし') return 0;
  return Number(String(val).replace(/[^0-9]/g, '')) || 0;
};

/**
 * Individual Rate Cell Component (Memoized for peak rendering performance)
 * Supports bidirectional mirroring, diagonal guard, and asymmetry warnings
 */
const PostageCell = React.memo(function PostageCell({
  fromId,
  toId,
  fromName,
  toName,
  isDiagonal,
  isRowHovered,
  isColHovered,
  isReciprocalHovered,
  isAsymmetric,
  value,
  reciprocalValue,
  isAuditMode,
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  const showWarning = isAuditMode && isAsymmetric && !isDiagonal;

  return (
    <td 
      onMouseEnter={() => onHover(fromId, toId)}
      className={`p-1 border border-gray-200 text-center transition-colors relative ${
        isDiagonal 
          ? 'bg-amber-50/20' 
          : isReciprocalHovered
            ? 'bg-indigo-50/70 ring-1 ring-indigo-400 z-10'
            : (isRowHovered || isColHovered) 
              ? 'bg-blue-50/30' 
              : showWarning
                ? 'bg-amber-50/50'
                : 'bg-white'
      } hover:bg-blue-100/40`}
      title={
        showWarning 
          ? `⚠️ 双方向不整合:\n[${fromName} → ${toName}]: ¥${displayValue || 0}\n[${toName} → ${fromName}]: ¥${reciprocalValue || 0}`
          : isReciprocalHovered && !isDiagonal
            ? `↔ 対向セル: [${toName} → ${fromName}]`
            : undefined
      }
    >
      <div className="flex items-center justify-center relative">
        <span className="text-gray-400 text-xs mr-0.5 select-none font-normal">¥</span>
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={(e) => onChange(fromId, toId, e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="0"
          className={`w-16 text-right py-1 px-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-[#162D50] focus:border-[#162D50] transition-colors ${
            showWarning
              ? 'border-amber-400 bg-amber-50/90 text-amber-900 font-semibold ring-1 ring-amber-300'
              : displayValue 
                ? 'border-gray-200 text-gray-800 font-medium bg-white' 
                : 'border-dashed border-gray-300 text-gray-400 bg-white'
          }`}
        />
        {showWarning && (
          <span 
            className="absolute -top-1 -right-1 flex h-2 w-2 pointer-events-none"
            title={`対向: ¥${reciprocalValue || 0}`}
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
 * Individual Row Component (Memoized)
 */
const PostageRow = React.memo(function PostageRow({
  rowPref,
  rowIndex,
  totalRows,
  visiblePrefectures,
  rowRates,
  ratesByFromId,
  asymmetricKeysSet,
  isAuditMode,
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
        const isReciprocalHovered = hoveredCell?.fromId === colPref.id && hoveredCell?.toId === rowPref.id;
        const cellValue = rowRates[colPref.id] ?? '';
        const reciprocalValue = ratesByFromId[colPref.id]?.[rowPref.id] ?? '';
        const isAsymmetric = !isDiagonal && asymmetricKeysSet.has(`${rowPref.id}_${colPref.id}`);

        return (
          <PostageCell
            key={`${rowPref.id}_${colPref.id}`}
            fromId={rowPref.id}
            toId={colPref.id}
            fromName={rowPref.name}
            toName={colPref.name}
            isDiagonal={isDiagonal}
            isRowHovered={isRowHovered}
            isColHovered={isColHovered}
            isReciprocalHovered={isReciprocalHovered}
            isAsymmetric={isAsymmetric}
            value={cellValue}
            reciprocalValue={reciprocalValue}
            isAuditMode={isAuditMode}
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
 * With Bidirectional Symmetrical Pricing, Auto-Fill Mirroring, and Reconciliation
 */
export default function PostageRateMatrix({ regions = [] }) {
  const [rates, setRates] = useState(() => loadPostalRateMatrix(regions));
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState('ALL');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredCell, setHoveredCell] = useState(null);

  // Requirement B: Symmetrical Mode Toggle (default: ON)
  const [isSymmetric, setIsSymmetric] = useState(true);

  // Requirement C: Audit Matrix Toggle (default: ON to visualize any existing mismatches)
  const [isAuditMode, setIsAuditMode] = useState(true);

  // Requirement C: Reconcile / Synchronize Modal State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncStrategy, setSyncStrategy] = useState('higher'); // 'higher', 'lower', 'origin', 'destination', 'average'

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

  // Grouped rates by row for O(1) cell lookup
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

  // Requirement C: Audit Matrix - Detect all asymmetric pairs (matrix[A][B] !== matrix[B][A])
  const asymmetricPairs = useMemo(() => {
    const pairs = [];
    const len = flattenedPrefectures.length;
    for (let i = 0; i < len; i++) {
      for (let j = i + 1; j < len; j++) {
        const p1 = flattenedPrefectures[i];
        const p2 = flattenedPrefectures[j];
        const key1 = `${p1.id}_${p2.id}`;
        const key2 = `${p2.id}_${p1.id}`;
        const val1 = parsePrice(rates[key1]);
        const val2 = parsePrice(rates[key2]);
        if (val1 !== val2) {
          pairs.push({
            p1,
            p2,
            val1,
            val2,
            key1,
            key2
          });
        }
      }
    }
    return pairs;
  }, [flattenedPrefectures, rates]);

  // Fast Set of keys that belong to asymmetric pairs for instant cell highlighting
  const asymmetricKeysSet = useMemo(() => {
    const set = new Set();
    asymmetricPairs.forEach(p => {
      set.add(p.key1);
      set.add(p.key2);
    });
    return set;
  }, [asymmetricPairs]);

  // Requirement A: Real-Time Bidirectional Auto-Fill (Mirroring) & Diagonal Guard
  const handleCellChange = useCallback((fromId, toId, val) => {
    setRates(prev => {
      const key = `${fromId}_${toId}`;
      const next = {
        ...prev,
        [key]: val
      };

      // Diagonal Guard: If origin === dest, update only this cell without triggering mirroring
      if (isSymmetric && fromId !== toId) {
        const reciprocalKey = `${toId}_${fromId}`;
        next[reciprocalKey] = val;
      }

      return next;
    });
  }, [isSymmetric]);

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

  // Requirement C: Bulk Reconcile Function (Synchronize All)
  const handleBulkReconcile = (strategy = syncStrategy) => {
    if (asymmetricPairs.length === 0) {
      toast.success('すべての料金は既に対称です');
      setIsSyncModalOpen(false);
      return;
    }

    setRates(prev => {
      const next = { ...prev };
      asymmetricPairs.forEach(({ p1, p2, val1, val2, key1, key2 }) => {
        let targetVal = 0;
        if (strategy === 'higher') {
          targetVal = Math.max(val1, val2);
        } else if (strategy === 'lower') {
          targetVal = Math.min(val1, val2);
        } else if (strategy === 'origin') {
          targetVal = val1;
        } else if (strategy === 'destination') {
          targetVal = val2;
        } else if (strategy === 'average') {
          targetVal = Math.round((val1 + val2) / 2);
        } else {
          targetVal = Math.max(val1, val2);
        }

        const formatted = targetVal ? targetVal.toLocaleString() : '0';
        next[key1] = formatted;
        next[key2] = formatted;
      });

      savePostalRateMatrix(next);
      return next;
    });

    toast.success(`${asymmetricPairs.length} 組の非対称料金を双方向対称に統一しました！`);
    setIsSyncModalOpen(false);
  };

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

  // Active region groups list
  const activeRegions = useMemo(() => {
    return regions.filter(r => r.prefectures && r.prefectures.length > 0);
  }, [regions]);

  // Calculate configuration progress stats
  const configuredCount = useMemo(() => {
    let count = 0;
    const values = Object.values(rates);
    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      if (v && v !== 'なし') count++;
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
            className="px-4 py-2 bg-[#162D50] hover:bg-[#112440] text-white rounded font-medium text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSaving ? '保存中...' : '変更を保存'}
          </button>
        </div>
      </div>

      {/* Requirement B & C: Symmetrical Pricing & Audit Status Toolbar */}
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
                      ratesByFromId={ratesByFromId}
                      asymmetricKeysSet={asymmetricKeysSet}
                      isAuditMode={isAuditMode}
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

      {/* Requirement C: Synchronize All Modal Dialog */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#162D50] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-lg">
                  <ArrowLeftRight className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base">双方向料金の一括統一</h3>
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
                  統一ルールを選択してください
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
                      desc: '低い方の料金を採用します（顧客向けコスト抑制）',
                      example: '¥530 vs ¥4,530 → ¥530'
                    },
                    {
                      id: 'origin',
                      title: '送信元(行)優先 (Origin / Row Rate)',
                      desc: '行側（送信元）の登録料金を採用します',
                      example: '行の値に統一'
                    },
                    {
                      id: 'destination',
                      title: '送信先(列)優先 (Destination / Column Rate)',
                      desc: '列側（送信先）の登録料金を採用します',
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
                          ? 'border-[#162D50] bg-blue-50/50 ring-1 ring-[#162D50]'
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
                  {asymmetricPairs.slice(0, 5).map(({ p1, p2, val1, val2 }) => {
                    let targetVal = 0;
                    if (syncStrategy === 'higher') targetVal = Math.max(val1, val2);
                    else if (syncStrategy === 'lower') targetVal = Math.min(val1, val2);
                    else if (syncStrategy === 'origin') targetVal = val1;
                    else if (syncStrategy === 'destination') targetVal = val2;
                    else if (syncStrategy === 'average') targetVal = Math.round((val1 + val2) / 2);

                    return (
                      <div key={`${p1.id}_${p2.id}`} className="py-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-gray-800">{p1.name}</span>
                          <span className="text-gray-400">↔</span>
                          <span className="font-medium text-gray-800">{p2.name}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-gray-500 line-through">
                            ¥{val1.toLocaleString()} / ¥{val2.toLocaleString()}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="font-bold text-[#162D50]">
                            ¥{targetVal.toLocaleString()}
                          </span>
                        </div>
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
