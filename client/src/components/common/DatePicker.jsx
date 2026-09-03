import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react';

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Generate array of years from 1950 to 2050
const YEARS = Array.from({ length: 101 }, (_, i) => new Date().getFullYear() - 50 + i);

const formatDateString = (date) => {
  if (!date) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function DatePicker({
  value,            // ISO string YYYY-MM-DD or array of two strings if range
  onChange,         // (val: string | string[]) => void
  mode = 'single',  // 'single' or 'range'
  minDate,          // ISO string
  maxDate,
  disabledDates = [],
  placeholder = "Select Date",
  className = "",
  disabled = false,
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  
  // State for currently viewed month/year in the calendar
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const initStr = Array.isArray(value) ? value[0] : value;
      if (initStr) return new Date(initStr);
    }
    return new Date();
  });

  // Derived Selection State
  const selectedStart = mode === 'range' ? (Array.isArray(value) ? value[0] : null) : (value && !Array.isArray(value) ? value : null);
  const selectedEnd = mode === 'range' ? (Array.isArray(value) ? value[1] : null) : null;
  const [hoverDate, setHoverDate] = useState(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle Keyboard Nav within the popup
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const handleMonthChange = (e) => setViewDate(new Date(viewDate.getFullYear(), parseInt(e.target.value), 1));
  const handleYearChange = (e) => setViewDate(new Date(parseInt(e.target.value), viewDate.getMonth(), 1));

  const isDateDisabled = useCallback((dateStr) => {
    if (disabledDates.includes(dateStr)) return true;
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  }, [minDate, maxDate, disabledDates]);

  const handleDateClick = (day) => {
    const dateStr = formatDateString(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
    if (isDateDisabled(dateStr)) return;

    if (mode === 'single') {
      onChange(dateStr);
      setIsOpen(false);
    } else {
      // Range mode
      if (!selectedStart || (selectedStart && selectedEnd)) {
        onChange([dateStr, null]);
      } else {
        if (dateStr < selectedStart) {
          onChange([dateStr, selectedStart]);
        } else {
          onChange([selectedStart, dateStr]);
        }
        setIsOpen(false);
      }
    }
  };

  // Render presets
  const applyPreset = (preset) => {
    const today = new Date();
    if (preset === 'today') {
      const todayStr = formatDateString(today);
      if (mode === 'single') onChange(todayStr);
      else onChange([todayStr, todayStr]);
    } else if (preset === 'last7') {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      if (mode === 'range') onChange([formatDateString(weekAgo), formatDateString(today)]);
    } else if (preset === 'thisMonth') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      if (mode === 'range') onChange([formatDateString(start), formatDateString(end)]);
    }
    setIsOpen(false);
  };

  const displayValue = () => {
    if (!value) return '';
    if (mode === 'single') return value;
    if (mode === 'range' && Array.isArray(value)) {
      if (value[0] && value[1]) return `${value[0]} to ${value[1]}`;
      if (value[0]) return `${value[0]} to ...`;
    }
    return '';
  };

  const isSelected = (dateStr) => {
    if (mode === 'single') return dateStr === selectedStart;
    return dateStr === selectedStart || dateStr === selectedEnd;
  };

  const isInRange = (dateStr) => {
    if (mode !== 'range' || !selectedStart) return false;
    if (selectedStart && selectedEnd) {
      return dateStr > selectedStart && dateStr < selectedEnd;
    }
    if (selectedStart && hoverDate && !selectedEnd) {
      const min = selectedStart < hoverDate ? selectedStart : hoverDate;
      const max = selectedStart > hoverDate ? selectedStart : hoverDate;
      return dateStr > min && dateStr < max;
    }
    return false;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div 
        className={`flex items-center justify-between w-full px-4 py-2 bg-white border ${isOpen ? 'border-[#162D50] ring-1 ring-[#162D50]' : 'border-gray-300'} rounded-md text-sm focus-within:outline-none focus-within:ring-1 focus-within:ring-[#162D50] cursor-pointer transition-colors ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        role="combobox"
        aria-expanded={isOpen}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) setIsOpen(!isOpen);
          }
        }}
      >
        <span className={displayValue() ? 'text-gray-900' : 'text-gray-400'}>
          {displayValue() || placeholder}
        </span>
        <div className="flex items-center gap-2">
          {value && (
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              onClick={(e) => { e.stopPropagation(); onChange(mode === 'range' ? [] : ''); }}
              aria-label="Clear Date"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <CalendarIcon className="w-4 h-4 text-gray-500" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl w-80 sm:w-[22rem] p-4">
          
          {/* Top Controls */}
          <div className="flex items-center justify-between mb-4 gap-2">
            <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-md text-gray-600" aria-label="Previous Month">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-2 font-semibold text-[#162D50]">
              <select 
                value={viewDate.getMonth()} 
                onChange={handleMonthChange}
                className="bg-transparent appearance-none cursor-pointer focus:outline-none border-b border-transparent hover:border-gray-300 px-1"
                aria-label="Select Month"
              >
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select 
                value={viewDate.getFullYear()} 
                onChange={handleYearChange}
                className="bg-transparent appearance-none cursor-pointer focus:outline-none border-b border-transparent hover:border-gray-300 px-1"
                aria-label="Select Year"
              >
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-md text-gray-600" aria-label="Next Month">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-400 uppercase mb-2">
            <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-sm" role="grid" aria-label="Calendar Grid">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8"></div>
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = formatDateString(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
              const selected = isSelected(dateStr);
              const inRange = isInRange(dateStr);
              const disabled = isDateDisabled(dateStr);
              const today = dateStr === formatDateString(new Date());

              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  aria-label={dateStr}
                  aria-selected={selected}
                  onMouseEnter={() => setHoverDate(dateStr)}
                  onClick={() => handleDateClick(day)}
                  className={`
                    h-8 w-full flex items-center justify-center transition-colors relative outline-none focus-visible:ring-2 focus-visible:ring-[#162D50] z-10
                    ${disabled ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer'}
                    ${selected ? 'bg-[#162D50] text-white font-bold rounded-md z-20' : ''}
                    ${inRange && !selected ? 'bg-[#eef2f6] text-[#162D50]' : ''}
                    ${!selected && !inRange && !disabled ? 'text-gray-700 hover:bg-gray-100 hover:rounded-md' : ''}
                    ${today && !selected ? 'font-bold text-[#162D50] underline decoration-2 underline-offset-4' : ''}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick Presets */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2 justify-center">
            <button type="button" onClick={() => applyPreset('today')} className="px-3 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors">
              Today
            </button>
            {mode === 'range' && (
              <>
                <button type="button" onClick={() => applyPreset('last7')} className="px-3 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors">
                  Last 7 Days
                </button>
                <button type="button" onClick={() => applyPreset('thisMonth')} className="px-3 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors">
                  This Month
                </button>
              </>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
