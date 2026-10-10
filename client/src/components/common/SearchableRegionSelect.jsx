import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, ChevronDown, X, Check, Search } from 'lucide-react';
import { flattenPrefectures, loadRegions, normalizeSearchString } from '../../utils/regionHelper.js';

/**
 * Dynamic Searchable Combobox/Select for Regions & Prefectures
 * Populated dynamically from MongoDB database tables:
 * 1. Region collection (/api/regions)
 * 2. Japanese Regions & 47 Prefectures (/api/expenses/japanese-regions)
 */
export default function SearchableRegionSelect({
  value = '',
  onChange,
  placeholder = '選択または入力',
  regions = [],
  japaneseRegions = [],
  nameField = 'name1', // 'name1' for sender/departure, 'name2' for recipient/destination
  disabled = false,
  className = '',
  id
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Sync internal input value when external value changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        // If closed without explicit pick, commit what was typed if different
        if (inputValue !== value && onChange) {
          onChange(inputValue);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputValue, value, onChange]);

  // Extract DB region items from MongoDB Region collection
  const dbRegionOptions = useMemo(() => {
    if (!Array.isArray(regions) || regions.length === 0) return [];
    const seen = new Set();
    const list = [];
    regions.forEach((r) => {
      const val = (nameField === 'name2' ? r.name2 : r.name1) || r.name1 || r.name2;
      if (val && !seen.has(val)) {
        seen.add(val);
        list.push({
          id: r._id || val,
          label: val,
          value: val,
          type: 'region',
          sub: '地域マスタ (DB)'
        });
      }
    });
    return list;
  }, [regions, nameField]);

  // Extract prefecture items from Japanese Regions table
  const prefectureOptions = useMemo(() => {
    const activeRegions = Array.isArray(japaneseRegions) && japaneseRegions.length > 0 
      ? japaneseRegions 
      : loadRegions();
    const flattened = flattenPrefectures(activeRegions);
    const seen = new Set();
    const list = [];
    flattened.forEach((p) => {
      if (p.name && !seen.has(p.name)) {
        seen.add(p.name);
        list.push({
          id: p.id || p.name,
          label: p.name,
          value: p.name,
          type: 'prefecture',
          sub: p.regionName || '都道府県'
        });
      }
    });
    return list;
  }, [japaneseRegions]);

  // Filtered options based on user typing
  const filteredOptions = useMemo(() => {
    const q = inputValue ? inputValue.trim() : '';
    const norm = normalizeSearchString(q);

    if (!q) {
      return {
        regions: dbRegionOptions,
        prefectures: prefectureOptions,
        total: dbRegionOptions.length + prefectureOptions.length
      };
    }

    const matchedRegions = dbRegionOptions.filter((opt) => {
      return (
        opt.label.toLowerCase().includes(q.toLowerCase()) ||
        normalizeSearchString(opt.label).includes(norm) ||
        normalizeSearchString(opt.sub).includes(norm)
      );
    });

    const matchedPrefectures = prefectureOptions.filter((opt) => {
      return (
        opt.label.includes(q) ||
        normalizeSearchString(opt.label).includes(norm) ||
        normalizeSearchString(opt.sub).includes(norm)
      );
    });

    return {
      regions: matchedRegions,
      prefectures: matchedPrefectures,
      total: matchedRegions.length + matchedPrefectures.length
    };
  }, [dbRegionOptions, prefectureOptions, inputValue]);

  const handleSelectOption = (opt) => {
    setInputValue(opt.value);
    setIsOpen(false);
    if (onChange) {
      onChange(opt.value);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setInputValue('');
    if (onChange) {
      onChange('');
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsOpen(false);
      if (onChange) {
        onChange(inputValue);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Combobox Input Container */}
      <div 
        className={`flex items-center w-full px-3 sm:px-4 py-2 border rounded-md transition-all duration-150 bg-white ${
          disabled 
            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
            : isOpen
              ? 'border-[#162D50] ring-1 ring-[#162D50]'
              : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <MapPin className={`w-4 h-4 mr-2 shrink-0 ${value ? 'text-[#162D50]' : 'text-gray-400'}`} />
        
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => {
            const nextVal = e.target.value;
            setInputValue(nextVal);
            if (!isOpen) setIsOpen(true);
            if (onChange) onChange(nextVal);
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
        />

        {/* Clear Button */}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 mr-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            title="クリア"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Dropdown Chevron */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setIsOpen((prev) => !prev);
              inputRef.current?.focus();
            }
          }}
          className="text-gray-400 hover:text-gray-600 focus:outline-none"
          tabIndex={-1}
        >
          <ChevronDown 
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#162D50]' : ''}`} 
          />
        </button>
      </div>

      {/* Floating Dropdown Menu */}
      {isOpen && !disabled && (
        <div 
          ref={listRef}
          className="absolute z-50 left-0 right-0 mt-1.5 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-100"
        >
          {filteredOptions.total === 0 ? (
            <div className="p-3 text-center text-xs text-gray-500">
              <p className="font-medium">一致する地域・都道府県がありません</p>
              {inputValue && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    if (onChange) onChange(inputValue);
                  }}
                  className="mt-2 text-xs text-[#162D50] hover:underline font-bold"
                >
                  「{inputValue}」を直接使用する
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Group 1: MongoDB Regions Collection */}
              {filteredOptions.regions.length > 0 && (
                <div className="py-1">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/80 flex items-center justify-between">
                    <span>地域マスタ (Database)</span>
                    <span className="text-[10px] text-gray-400">{filteredOptions.regions.length}件</span>
                  </div>
                  {filteredOptions.regions.map((opt) => {
                    const isSelected = value === opt.value;
                    return (
                      <button
                        key={`reg-${opt.id}`}
                        type="button"
                        onClick={() => handleSelectOption(opt)}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-blue-50/80 transition-colors cursor-pointer ${
                          isSelected ? 'bg-blue-50 font-bold text-[#162D50]' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center min-w-0">
                          <span className="truncate">{opt.label}</span>
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-100/70 text-blue-800 shrink-0 font-medium">
                            地域
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#162D50] shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Group 2: Japanese Prefectures */}
              {filteredOptions.prefectures.length > 0 && (
                <div className="py-1">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/80 flex items-center justify-between">
                    <span>都道府県マスタ (47 Prefectures)</span>
                    <span className="text-[10px] text-gray-400">{filteredOptions.prefectures.length}件</span>
                  </div>
                  {filteredOptions.prefectures.map((opt) => {
                    const isSelected = value === opt.value;
                    return (
                      <button
                        key={`pref-${opt.id}`}
                        type="button"
                        onClick={() => handleSelectOption(opt)}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-blue-50/80 transition-colors cursor-pointer ${
                          isSelected ? 'bg-blue-50 font-bold text-[#162D50]' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center min-w-0">
                          <span className="truncate">{opt.label}</span>
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 shrink-0 font-normal">
                            {opt.sub}
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#162D50] shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
