//src/components/modals/PriceModal.jsx
'use client';
import { useState, useEffect } from "react";

import { motion, AnimatePresence } from "framer-motion";
import CloseXButton from '@/components/UI/CloseXButton';
import ResponsiveText from "../UI/ResponsiveText";
import Button from "../UI/Button";
import { useCurrency } from '@/contexts/CurrencyContext';

export default function PriceModal({ onClose }) {
  const { formatPrice, getCurrencySymbol } = useCurrency();
  const [price, setPrice] = useState(1); // Preset price tier (1-6)
  const [useCustom, setUseCustom] = useState(false); // Toggle between preset and custom
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Load stored price filter (could be preset or custom)
    const storedPrice = localStorage.getItem("selectedPrice");
    const storedMinPrice = localStorage.getItem("selectedMinPrice");
    const storedMaxPrice = localStorage.getItem("selectedMaxPrice");
    
    if (storedMinPrice || storedMaxPrice) {
      // Custom price range is set
      setUseCustom(true);
      setMinPrice(storedMinPrice || '');
      setMaxPrice(storedMaxPrice || '');
    } else if (storedPrice) {
      setPrice(Number(storedPrice));
      setUseCustom(false);
    }
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (!useCustom) {
      localStorage.setItem("selectedPrice", price.toString());
      localStorage.removeItem("selectedMinPrice");
      localStorage.removeItem("selectedMaxPrice");
    }
  }, [price, useCustom]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleReset = () => {
    // Reset to 'Any' tier (6) so price filter is effectively cleared
    setUseCustom(false);
    setMinPrice('');
    setMaxPrice('');
    const next = 6;
    setPrice(next);
    localStorage.setItem("selectedPrice", String(next));
    localStorage.removeItem("selectedMinPrice");
    localStorage.removeItem("selectedMaxPrice");
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent("priceFilterApplied", { 
        detail: { price: next, minPrice: null, maxPrice: null } 
      }));
    }
    handleClose();
  };
  
  const handleApply = () => {
    if (useCustom) {
      // Store custom min/max prices
      localStorage.setItem("selectedMinPrice", minPrice || '');
      localStorage.setItem("selectedMaxPrice", maxPrice || '');
      localStorage.removeItem("selectedPrice");
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent("priceFilterApplied", { 
          detail: { 
            price: null, 
            minPrice: minPrice ? Number(minPrice) : null, 
            maxPrice: maxPrice ? Number(maxPrice) : null 
          } 
        }));
      }
    } else {
      // Store preset price
      localStorage.setItem("selectedPrice", price.toString());
      localStorage.removeItem("selectedMinPrice");
      localStorage.removeItem("selectedMaxPrice");
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent("priceFilterApplied", { 
          detail: { price, minPrice: null, maxPrice: null } 
        }));
      }
    }
    handleClose();
  };

  const percent = ((price - 1) / 5) * 100; // 1..6 -> 0..100
  // Price values: 10, 20, 30, 40, 50
  // For filter thresholds, we show values with currency symbol but without conversion
  const priceValues = [10, 20, 30, 40, 50];
  const currencySymbol = getCurrencySymbol();
  const priceLabels = priceValues.map(val => {
    // Format as whole numbers with currency symbol (no decimals, no conversion)
    return `${currencySymbol}${val}`;
  }).concat(["Any"]); 
  
  const subtitle = useCustom 
    ? `Custom Range: ${minPrice ? `${currencySymbol}${minPrice}` : 'Min'} - ${maxPrice ? `${currencySymbol}${maxPrice}` : 'Max'}`
    : `Set Price: ${priceLabels[price - 1] || "Any"}`;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50"

          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="bg-white rounded-2xl p-6 w-full max-w-sm relative ring-4 ring-gray-800/40 shadow"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <ResponsiveText
                as="h2"
                minSize="1rem"
                maxSize="2.1rem"
                className="font-bold text-slate-900"
              >
                Price
              </ResponsiveText>
              <div className="absolute top-4 right-4">
                <CloseXButton onClick={handleClose} />
              </div>
            </div>

            <ResponsiveText
              as="h5"
              minSize="0.8rem"
              maxSize="1rem"
              className="font-medium text-slate-700 mb-4"
            >
              {subtitle}
            </ResponsiveText>

            {/* Toggle between preset and custom */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setUseCustom(false)}
                className={`px-4 py-2 rounded-lg transition ${
                  !useCustom 
                    ? 'bg-[#F24E2E] text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Preset
              </button>
              <button
                onClick={() => setUseCustom(true)}
                className={`px-4 py-2 rounded-lg transition ${
                  useCustom 
                    ? 'bg-[#F24E2E] text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Custom
              </button>
            </div>

            {useCustom ? (
              /* Custom Price Inputs */
              <div className="my-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Price ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F24E2E] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Price ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="No limit"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F24E2E] focus:border-transparent"
                  />
                </div>
              </div>
            ) : (
              /* Preset Price Slider */
              <div className="my-6">
              {/* Labels */}
              <div className="relative mb-6">
                <div className="flex justify-between px-2">
                  {priceLabels.map((label, index) => {
                    const isActive = price === index + 1; // Updated to price
                    return (
                      <button
                        key={index}
                        onClick={() => setPrice(index + 1)} // Updated to setPrice
                        className="relative flex flex-col items-center w-[1px] focus:outline-none"
                      >
                        <span
                          className={`mb-1 text-xl cursor-pointer ${price === index + 1
                            ? "text-[#F24E2E] font-bold"
                            : "text-slate-900 font-semibold"
                            }`}
                        >
                          {label}
                        </span>

                        {price === index + 1 && (
                          <div
                            className="absolute top-8 flex justify-center w-full pointer-events-none"
                            style={{ filter: "drop-shadow(0 0 8px #ef4444)" }}
                          >
                            <motion.div
                              className="w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-[#F24E2E]"
                              animate={{ y: [0, -5, 0] }}
                              transition={{ repeat: Infinity, repeatType: "loop", duration: 1 }}
                            />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Range Slider with animated background */}
              <motion.div
                className="relative w-full h-2 rounded-full"
                animate={{
                  background: `linear-gradient(to right, #F24E2E ${(price - 1) * 20}%, #e5e7eb ${(price - 1) * 20}%)`
                }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                {/* Indicator dot */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-[#F24E2E] rounded-full shadow"
                  style={{ left: `${percent}%`, transform: "translate(-50%, -50%)" }}
                />
                <input
                  type="range"
                  min="1"
                  max="6"
                  step="1"
                  value={price} // Updated to price
                  onChange={(e) => setPrice(Number(e.target.value))} // Updated to setPrice
                  className="w-full h-2 appearance-none bg-transparent bottom-[0.6rem] relative z-10 focus:outline-none transition-all duration-300 ease-in-out
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-0
                    [&::-webkit-slider-thumb]:h-0
                    [&::-webkit-slider-thumb]:bg-transparent
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:appearance-none
                    [&::-moz-range-thumb]:w-0
                    [&::-moz-range-thumb]:h-0
                    [&::-moz-range-thumb]:bg-transparent
                    [&::-moz-range-thumb]:cursor-pointer"
                />
              </motion.div>
            </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                onClick={handleReset}
                variant="simple"
                className="px-4 py-2 rounded-lg text-slate-600 hover:text-[#F24E2E] transition"
              >
                Reset
              </Button>

              <Button
                onClick={handleApply}
                variant="primary"
                className="px-4 py-2 rounded-lg bg-[#F24E2E] hover:brightness-110 text-white transition"
              >
                Apply
              </Button>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}