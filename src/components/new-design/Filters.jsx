'use client';

import { useState, useRef, useEffect } from 'react';

const CHEVRON_DOWN = (
  <svg className="w-4 h-4 shrink-0 text-[#6B6B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const DEFAULT_FILTERS = {
  Distance: ['Any', 'Within 1km', 'Within 5km', 'Within 10km', 'Within 25km'],
  'Ready In': ['Any', '15 min', '30 min', '1 hour', '2 hours'],
  Brand: ['All brands', 'Apple', 'Samsung', 'Google', 'Other'],
  Storage: ['Any', '64GB', '128GB', '256GB', '512GB'],
  Colour: ['Any', 'Black', 'White', 'Silver', 'Gold', 'Blue', 'Orange', 'Other'],
  Condition: ['Any', 'New', 'Like new', 'Good', 'Fair'],
  Price: ['Any', 'Under £100', '£100–£500', '£500–£1000', 'Over £1000'],
  Sort: ['Relevance', 'Lowest price', 'Highest price', 'Distance', 'Ready soon'],
};

/**
 * Filter bar: "Same day" toggle (pill, active = orange) + label-based dropdowns (Distance, Ready In, Brand, etc.) with chevron.
 * Buttons are pill-shaped; dropdowns show options on click.
 */
export default function Filters({
  sameDayActive = false,
  onSameDayChange,
  filterOptions = DEFAULT_FILTERS,
  onFilterChange,
  onClearFilters,
  className = '',
}) {
  const [openKey, setOpenKey] = useState(null);
  const [selected, setSelected] = useState(() =>
    Object.fromEntries(
      Object.entries(filterOptions).map(([key, opts]) => [key, opts[0]])
    )
  );
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenKey(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (key, value) => {
    setSelected((prev) => ({ ...prev, [key]: value }));
    setOpenKey(null);
    onFilterChange?.(key, value);
  };

  const handleClear = () => {
    const reset = Object.fromEntries(
      Object.entries(filterOptions).map(([key, opts]) => [key, opts[0]])
    );
    setSelected(reset);
    setOpenKey(null);
    onClearFilters?.();
  };

  // Show Clear button only when something non-default is selected or same day is on
  const isFiltered = sameDayActive || Object.entries(selected).some(
    ([key, val]) => val !== (filterOptions[key]?.[0])
  );

  const filterLabels = Object.keys(filterOptions);

  return (
    <>
      <div className="container mx-auto px-4 md:px-8 lg:px-12">
        <div
          ref={containerRef}
          className={`flex flex-wrap items-center gap-2 ${className}`}
        >
          {/* Same day — toggle only, no dropdown */}
          <button
            type="button"
            onClick={() => onSameDayChange?.(!sameDayActive)}
            className={`
          inline-flex items-center justify-center px-4 py-2.5 rounded-[40px]
          font-medium text-sm transition-colors
          ${sameDayActive
                ? 'bg-[#F44322] text-white hover:bg-[#e03d1e]'
                : 'bg-white text-[#2E3333] border border-[#E0E0E0] hover:bg-[#F9F9F9]'
              }
        `}
          >
            Same day
          </button>

          {/* Dropdown filters — label + chevron */}
          {filterLabels.map((label) => {
            const isOpen = openKey === label;
            const options = filterOptions[label] || [];
            const currentValue = selected[label] ?? options[0];

            const isFilterActive = currentValue !== options[0];

            return (
              <div key={label} className="relative">
                <button
                  type="button"
                  onClick={() => setOpenKey(isOpen ? null : label)}
                  className={`
                inline-flex items-center justify-center gap-1.5 px-4 py-2.5
                rounded-[40px] font-medium text-sm transition-colors
                ${isFilterActive 
                  ? 'bg-[#FFF5F3] border-[#F44322] text-[#F44322]' 
                  : 'bg-white border-[#E0E0E0] text-[#2E3333] hover:bg-[#F9F9F9]'}
              `}
                >
                  {label}
                  <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    {CHEVRON_DOWN}
                  </span>
                </button>

                {isOpen && (
                  <div
                    className="
                  absolute left-0 top-full mt-1 z-50 min-w-[180px]
                  bg-white border border-[#E0E0E0] rounded-[8px]
                  shadow-[0_4px_12px_rgba(0,0,0,0.1)]
                  py-1 max-h-[280px] overflow-y-auto
                "
                  >
                    {options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleSelect(label, option)}
                        className={`
                      w-full text-left px-4 py-2.5 text-sm
                      hover:bg-[#F5F5F5] transition-colors
                      ${currentValue === option ? 'text-[#F44322] font-medium bg-[#FFF5F3]' : 'text-[#2E3333]'}
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
          {/* Clear filters — only visible when something is active */}
          {isFiltered && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[40px] font-medium text-sm text-[#F44322] border border-[#F44322] hover:bg-[#fff5f3] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear filters
            </button>
          )}
        </div>
        <hr className="my-6 border-t border-gray-200" />

      </div>
    </>
  );
}
