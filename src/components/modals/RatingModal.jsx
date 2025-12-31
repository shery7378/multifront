//src/components/modals/RatingModal.jsx
'use client';
// RatingModal.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CloseXButton from '@/components/UI/CloseXButton';
import ResponsiveText from "../UI/ResponsiveText";
import Button from "../UI/Button";

export default function RatingModal({ onClose }) {
  const [rating, setRating] = useState(null); // current selected value
  const [isVisible, setIsVisible] = useState(false);
  const [bucketCounts, setBucketCounts] = useState({
    3: null,
    4: null,
    5: null,
  });
  const [loadingBuckets, setLoadingBuckets] = useState(false);

  useEffect(() => {
    const storedRating = localStorage.getItem("selectedRating");
    if (storedRating) setRating(Number(storedRating));
    setIsVisible(true);

    // Fetch dynamic rating bucket counts from API
    async function loadBuckets() {
      try {
        setLoadingBuckets(true);
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
        if (!apiBase) {
          setLoadingBuckets(false);
          return;
        }
        const res = await fetch(`${apiBase}/api/products/rating-buckets`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) {
          setLoadingBuckets(false);
          return;
        }
        const json = await res.json();
        const buckets = json?.data?.buckets || {};
        setBucketCounts({
          3: buckets["3"] ?? 0,
          4: buckets["4"] ?? 0,
          5: buckets["5"] ?? 0,
        });
      } catch {
        // ignore errors; keep defaults
      } finally {
        setLoadingBuckets(false);
      }
    }

    loadBuckets();
  }, []);

  // REMOVED: Auto-save to localStorage on rating change
  // Only save when user clicks Apply

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleReset = () => {
    setRating(null);
    localStorage.removeItem('selectedRating');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ratingFilterApplied', { detail: { rating: null } }));
    }
    handleClose();
  }; // Reset to no selection
  const handleApply = () => {
    console.log("Applied rating:", rating);
    // Always dispatch event, even if rating is null (to clear filter)
    if (rating !== null && rating !== undefined) {
      localStorage.setItem("selectedRating", rating.toString());
    } else {
      localStorage.removeItem("selectedRating");
    }
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent("ratingFilterApplied", { detail: { rating: rating || null } }));
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
                Rating
              </ResponsiveText>
              <div className="absolute top-4 right-4">
                <CloseXButton onClick={handleClose} />
              </div>
            </div>

            <div className="my-6">
              {/* Rating Options */}
              <div className="space-y-3">
              {[
                  { value: 3 },
                  { value: 4 },
                  { value: 5 },
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="rating"
                      value={option.value}
                      checked={rating === option.value}
                      onChange={() => setRating(option.value)}
                      className="appearance-none w-4 h-4 border-2 border-gray-300 rounded-full relative
                        checked:border-[#F24E2E]
                        checked:after:content-[''] checked:after:absolute checked:after:inset-0 checked:after:m-auto checked:after:w-2.5 checked:after:h-2.5 checked:after:bg-[#F24E2E] checked:after:rounded-full"
                    />
                    <span className="flex items-baseline gap-1 select-none">
                      <span className="font-bold text-base text-slate-900">{option.value}</span>
                      <span className="text-[#F24E2E] font-semibold">+</span>
                      <span className="font-semibold text-slate-500 text-xs">
                        {loadingBuckets
                          ? '...'
                          : `(${bucketCounts[option.value] ?? 0})`}
                      </span>
                    </span>
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