//src/components/modals/DeliveryFeeModal.jsx
'use client';
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CloseXButton from '@/components/UI/CloseXButton';
import ResponsiveText from "../UI/ResponsiveText";
import Button from "../UI/Button";

export default function DeliveryFeeModal({ onClose }) {
  const [fee, setFee] = useState(1);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const storedFee = localStorage.getItem("deliveryFee");
    if (storedFee) setFee(Number(storedFee));
    console.log(storedFee, 'storedFee');
    setIsVisible(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("deliveryFee", fee.toString());
    console.log("Selected fee:", fee);
  }, [fee]);

  // <-- Add this effect to log selected fee on every change
  // useEffect(() => {
  // console.log("Selected fee:", fee);

  // }, [fee]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleReset = () => {
    const next = 6; // '$6+' acts as 'Any' in our active check
    setFee(next);
    localStorage.setItem('deliveryFee', String(next));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('deliveryFeeApplied', { detail: { fee: next } }));
    }
    handleClose();
  };
  const handleApply = () => {
    console.log("Applied fee:", fee);
    localStorage.setItem("deliveryFee", fee.toString());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent("deliveryFeeApplied", { detail: { fee } }));
    }
    handleClose();
  };

  // percentage position for slider indicator
  const percent = ((fee - 1) / 5) * 100; // fee 1..6 -> 0..100
  const subtitle = fee === 6 ? "Under $6+ Delivery" : `Under $${fee} Delivery`;

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
                Delivery Fee
              </ResponsiveText>
              <div className="absolute top-4 right-4">
                <CloseXButton onClick={handleClose} />
              </div>
            </div>

            <ResponsiveText
              as="h5"
              minSize="0.8rem"
              maxSize="1rem"
              className="font-medium text-slate-700"
            >
              {subtitle}
            </ResponsiveText>

            <div className="my-6">
              {/* Labels */}
              <div className="relative mb-6">
                <div className="flex justify-between px-2">
                  {["$1", "$2", "$3", "$4", "$5", "$6+"].map((label, index) => {
                    const isActive = fee === index + 1;
                    return (
                      <button
                        key={index}
                        onClick={() => setFee(index + 1)}
                        className="relative flex flex-col items-center w-[1px] focus:outline-none"
                      >
                        <span
                          className={`mb-1 text-xl cursor-pointer ${fee === index + 1
                            ? "text-[#F24E2E] font-bold"
                            : "text-slate-900 font-semibold"
                            }`}
                        >
                          {label}
                        </span>

                        {fee === index + 1 && (
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
                  background: `linear-gradient(to right, #F24E2E ${(fee - 1) * 20
                    }%, #e5e7eb ${(fee - 1) * 20}%)`
                }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                {/* Indicator dot positioned by percentage */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-[#F24E2E] rounded-full shadow"
                  style={{ left: `${percent}%`, transform: "translate(-50%, -50%)" }}
                />
                <input
                  type="range"
                  min="1"
                  max="6"
                  step="1"
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
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

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <Button onClick={handleReset}
                variant="simple"
                className="px-4 py-2 rounded-lg text-slate-600 hover:text-red-500 transition"
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
