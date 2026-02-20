'use client';

import { useState, useRef, useEffect } from 'react';

const DEFAULT_DROPDOWN_OPTIONS = {
  Distance: ['Any', 'Within 1km', 'Within 5km', 'Within 10km', 'Within 25km'],
  'Ready In': ['Any', '15 min', '30 min', '1 hour', '2 hours'],
  Brand: ['All brands', 'Apple', 'Samsung', 'Google', 'Other'],
  Storage: ['Any', '64GB', '128GB', '256GB', '512GB'],
  Colour: ['Any', 'Black', 'White', 'Silver', 'Gold', 'Other'],
  Condition: ['Any', 'New', 'Like new', 'Good', 'Fair'],
  Price: ['Any', 'Under £100', '£100–£500', '£500–£1000', 'Over £1000'],
  Sort: ['Relevance', 'Lowest price', 'Highest price', 'Distance', 'Ready soon'],
};

export default function FilterBar({
  sameDayActive = false,
  onSameDayChange,
  dropdownOptions = DEFAULT_DROPDOWN_OPTIONS,
  onFilterChange,
  className = '',
}) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedValues, setSelectedValues] = useState(
    Object.fromEntries(
      Object.keys(dropdownOptions).map((key) => [key, dropdownOptions[key][0]])
    )
  );
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (filterKey, value) => {
    setSelectedValues((prev) => ({ ...prev, [filterKey]: value }));
    setActiveDropdown(null);
    onFilterChange?.(filterKey, value);
  };

  const filterKeys = Object.keys(dropdownOptions);

  return (
    <div
      ref={dropdownRef}
      className={`flex flex-wrap items-center gap-2 ${className}`}
    >
      {/* Same day toggle */}
      <button
        type="button"
        onClick={() => onSameDayChange?.(!sameDayActive)}
        className={`
          inline-flex items-center justify-center px-4 h-[46px] rounded-[54px] font-medium text-sm
           transition-colors
          ${sameDayActive
            ? 'bg-[#F44322] text-white hover:bg-[#e03d1e]'
            : 'bg-white text-[#092E3B] border border-[#E6EAED]'
          }
        `}
      >
        Same day
      </button>

      {/* Dropdown filters */}
      {filterKeys.map((key) => {
        const isOpen = activeDropdown === key;
        const options = dropdownOptions[key] || [];
        const currentValue = selectedValues[key] ?? options[0];

        return (
          <div key={key} className="relative">
            <button
              type="button"
              onClick={() => setActiveDropdown(isOpen ? null : key)}
              className="
                inline-flex items-center justify-center gap-1.5 p-4
                rounded-[6px] font-medium text-sm text-[#4A4A4A]
                bg-white border border-[#E0E0E0]
                 transition-colors
              "
            >
              {currentValue}
              <svg
                className={`w-4 h-4 text-[#6B6B6B] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isOpen && (
              <div
                className="
                  absolute left-0 top-full mt-1 z-50 min-w-[160px]
                  bg-white border border-[#E0E0E0] rounded-[6px]
                   py-1 max-h-[280px] overflow-y-auto
                "
              >
                {options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelect(key, option)}
                    className={`
                      w-full text-left px-4 py-2.5 text-sm
                      hover:bg-[#F5F5F5] transition-colors
                      ${currentValue === option ? 'text-[#F44322] font-medium' : 'text-[#4A4A4A]'}
                    `}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
