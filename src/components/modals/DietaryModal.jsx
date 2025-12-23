//src/components/modals/DietaryModal.jsx
'use client';
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CloseXButton from '@/components/UI/CloseXButton';
import ResponsiveText from "../UI/ResponsiveText";
import Button from "../UI/Button";

export default function DietaryModal({ onClose }) {
  const [selectedDietary, setSelectedDietary] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  // Common dietary options
  const dietaryOptions = [
    'Vegetarian',
    'Vegan',
    'Gluten-Free',
    'Dairy-Free',
    'Nut-Free',
    'Halal',
    'Kosher',
    'Organic',
    'Sugar-Free',
    'Low-Carb',
    'Keto',
    'Paleo'
  ];

  useEffect(() => {
    const storedDietary = localStorage.getItem("selectedDietary");
    if (storedDietary) {
      try {
        const parsed = JSON.parse(storedDietary);
        if (Array.isArray(parsed)) {
          setSelectedDietary(parsed);
        }
      } catch (e) {
        console.error('Error parsing dietary from localStorage:', e);
      }
    }
    setIsVisible(true);
  }, []);

  const handleToggle = (option) => {
    setSelectedDietary(prev => {
      if (prev.includes(option)) {
        return prev.filter(item => item !== option);
      } else {
        return [...prev, option];
      }
    });
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleReset = () => {
    setSelectedDietary([]);
    localStorage.removeItem('selectedDietary');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dietaryFilterApplied', { detail: { dietary: [] } }));
    }
    handleClose();
  };

  const handleApply = () => {
    console.log("Applied dietary:", selectedDietary);
    localStorage.setItem("selectedDietary", JSON.stringify(selectedDietary));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent("dietaryFilterApplied", { detail: { dietary: selectedDietary } }));
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
            className="bg-white rounded-2xl p-6 w-full max-w-sm relative ring-4 ring-gray-800/40 shadow max-h-[90vh] overflow-y-auto"
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
                Dietary Requirements
              </ResponsiveText>
              <div className="absolute top-4 right-4">
                <CloseXButton onClick={handleClose} />
              </div>
            </div>

            <div className="my-6">
              {/* Dietary Options */}
              <div className="space-y-3">
                {dietaryOptions.map((option) => {
                  const isSelected = selectedDietary.includes(option);
                  return (
                    <label key={option} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggle(option)}
                        className="appearance-none w-5 h-5 border-2 border-gray-300 rounded relative
                          checked:border-[#F24E2E] checked:bg-[#F24E2E]
                          checked:after:content-['✓'] checked:after:absolute checked:after:inset-0 
                          checked:after:flex checked:after:items-center checked:after:justify-center 
                          checked:after:text-white checked:after:text-xs checked:after:font-bold"
                      />
                      <span className="font-semibold text-slate-900">{option}</span>
                    </label>
                  );
                })}
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

