import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export default function MultiDatePicker({ selectedDates = [], onChange }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const toggleDate = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    let newDates = [...selectedDates];
    
    // Check if date already selected
    if (newDates.includes(dateStr)) {
      newDates = newDates.filter(d => d !== dateStr);
    } else {
      newDates.push(dateStr);
    }
    
    // Sort dates chronologically
    newDates.sort((a, b) => new Date(a) - new Date(b));
    onChange(newDates);
  };

  const isSelected = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return selectedDates.includes(dateStr);
  };

  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === currentDate.getMonth() && 
           today.getFullYear() === currentDate.getFullYear();
  };

  return (
    <div className="w-full max-w-sm bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#F8F9FA] border-b border-gray-200">
        <button type="button" onClick={prevMonth} className="p-1 hover:bg-gray-200 rounded-full text-gray-600 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="font-bold text-[#162D50] flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" />
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </div>
        <button type="button" onClick={nextMonth} className="p-1 hover:bg-gray-200 rounded-full text-gray-600 transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-bold text-gray-500 uppercase">
          <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {/* Empty slots before first day */}
          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div key={`empty-${index}`} className="p-2"></div>
          ))}
          
          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const selected = isSelected(day);
            const today = isToday(day);
            
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDate(day)}
                className={`
                  h-8 w-8 mx-auto rounded-full flex items-center justify-center transition-all duration-200
                  ${selected 
                    ? 'bg-[#162D50] text-white font-bold shadow-md transform scale-105' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                  ${today && !selected ? 'border border-[#162D50] text-[#162D50] font-bold' : ''}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Footer / Selected Dates summary */}
      {selectedDates.length > 0 && (
        <div className="bg-gray-50 p-3 border-t border-gray-200 text-xs text-gray-600">
          <span className="font-semibold text-[#162D50]">{selectedDates.length}</span> days selected
        </div>
      )}
    </div>
  );
}
