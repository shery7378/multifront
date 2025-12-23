//src/components/modals/SortModal.jsx
'use client';
// SortModal.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CloseXButton from '@/components/UI/CloseXButton';
import ResponsiveText from "../UI/ResponsiveText";
import Button from "../UI/Button";
import RadioButton from "../UI/RadioButton";

export default function SortModal({ onClose }) {
  const [sortOption, setSortOption] = useState(null); // null until we check storage
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const storedSortOption = localStorage.getItem("selectedSortOption");
    if (storedSortOption) {
      setSortOption(storedSortOption);
    } else {
      setSortOption('Recommended'); // default as in mock
    }
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (sortOption !== null) {
      localStorage.setItem("selectedSortOption", sortOption.toString()); // Renamed from selectedRating
      console.log("Selected sort option:", sortOption); // Updated log message
    }
  }, [sortOption]); // Updated dependency

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleReset = () => setSortOption(null); // Updated to setSortOption
  const handleApply = () => {
    console.log("Applied sort option:", sortOption); // Updated log message
    if (sortOption) {
      localStorage.setItem("selectedSortOption", sortOption);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent("sortApplied", { detail: { sort: sortOption } }));
      }
    }
    handleClose();
  };

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
                Sort
              </ResponsiveText>
              <div className="absolute top-4 right-4">
                <CloseXButton onClick={handleClose} />
              </div>
            </div>

            <div className="my-6">
              {/* Sort Options */}
              <div className="space-y-3">
                {['Recommended', 'Rating', 'Earliest arrival'].map((label) => (
                  <label key={label} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="sortOption"
                      value={label}
                      checked={sortOption === label}
                      onChange={() => setSortOption(label)}
                      className="appearance-none w-4 h-4 border-2 border-gray-300 rounded-full relative
                        checked:border-[#F24E2E]
                        checked:after:content-[''] checked:after:absolute checked:after:inset-0 checked:after:m-auto checked:after:w-2.5 checked:after:h-2.5 checked:after:bg-[#F24E2E] checked:after:rounded-full"
                    />
                    <span className="font-semibold text-slate-900">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <hr className="mb-4 border-t border-gray-200" />
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
                className="px-4 py-2 rounded-lg bg-[#F24E2E] hover:brightness-110 text-white transition !w-[95px]"
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