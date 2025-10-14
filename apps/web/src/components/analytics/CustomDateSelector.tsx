'use client';

import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

interface CustomDateSelectorProps {
  onDateRangeChange: (range: DateRange) => void;
  initialRange?: DateRange;
}

export default function CustomDateSelector({ onDateRangeChange, initialRange }: CustomDateSelectorProps) {
  const [selectedRange, setSelectedRange] = useState<DateRange>(
    initialRange || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
      label: 'Last 30 Days'
    }
  );
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [tempStart, setTempStart] = useState<Date>(selectedRange.start);
  const [tempEnd, setTempEnd] = useState<Date>(selectedRange.end);

  const predefinedRanges = [
    {
      label: 'Today',
      start: new Date(),
      end: new Date()
    },
    {
      label: 'Yesterday',
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date(Date.now() - 24 * 60 * 60 * 1000)
    },
    {
      label: 'Last 7 Days',
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date()
    },
    {
      label: 'Last 30 Days',
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    },
    {
      label: 'Last 90 Days',
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      end: new Date()
    },
    {
      label: 'This Month',
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      end: new Date()
    },
    {
      label: 'Last Month',
      start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
      end: new Date(new Date().getFullYear(), new Date().getMonth(), 0)
    },
    {
      label: 'This Year',
      start: new Date(new Date().getFullYear(), 0, 1),
      end: new Date()
    },
    {
      label: 'Last Year',
      start: new Date(new Date().getFullYear() - 1, 0, 1),
      end: new Date(new Date().getFullYear() - 1, 11, 31)
    }
  ];

  const handlePredefinedRange = (range: { label: string; start: Date; end: Date }) => {
    const newRange: DateRange = {
      start: range.start,
      end: range.end,
      label: range.label
    };
    setSelectedRange(newRange);
    onDateRangeChange(newRange);
    setShowCustomPicker(false);
  };

  const handleCustomRange = () => {
    if (tempStart && tempEnd && tempStart <= tempEnd) {
      const newRange: DateRange = {
        start: tempStart,
        end: tempEnd,
        label: `Custom (${tempStart.toLocaleDateString()} - ${tempEnd.toLocaleDateString()})`
      };
      setSelectedRange(newRange);
      onDateRangeChange(newRange);
      setShowCustomPicker(false);
    }
  };

  const handleCancelCustom = () => {
    setTempStart(selectedRange.start);
    setTempEnd(selectedRange.end);
    setShowCustomPicker(false);
  };

  const formatDateRange = (start: Date, end: Date) => {
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    if (start.getTime() === end.getTime()) {
      return startStr;
    }
    
    return `${startStr} - ${endStr}`;
  };

  const getDaysDifference = (start: Date, end: Date) => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="relative">
      {/* Date Range Display */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowCustomPicker(!showCustomPicker)}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <span className="text-sm font-medium text-gray-700">
            {formatDateRange(selectedRange.start, selectedRange.end)}
          </span>
          <span className="text-xs text-gray-500">
            ({getDaysDifference(selectedRange.start, selectedRange.end)} days)
          </span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {/* Date Range Picker Dropdown */}
      {showCustomPicker && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            {/* Predefined Ranges */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Quick Select</h3>
              <div className="grid grid-cols-2 gap-2">
                {predefinedRanges.map((range, index) => (
                  <button
                    key={index}
                    onClick={() => handlePredefinedRange(range)}
                    className="text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Range */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Custom Range</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                  <DatePicker
                    selected={tempStart}
                    onChange={(date: Date) => setTempStart(date)}
                    selectsStart
                    startDate={tempStart}
                    endDate={tempEnd}
                    maxDate={new Date()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    dateFormat="MMM dd, yyyy"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                  <DatePicker
                    selected={tempEnd}
                    onChange={(date: Date) => setTempEnd(date)}
                    selectsEnd
                    startDate={tempStart}
                    endDate={tempEnd}
                    minDate={tempStart}
                    maxDate={new Date()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    dateFormat="MMM dd, yyyy"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleCancelCustom}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomRange}
                disabled={!tempStart || !tempEnd || tempStart > tempEnd}
                className="px-3 py-1 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close picker */}
      {showCustomPicker && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowCustomPicker(false)}
        />
      )}
    </div>
  );
}
