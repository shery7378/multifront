//src/components/modals/SelectAnotherStoreModal.jsx
'use client';
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CloseXButton from '@/components/UI/CloseXButton';
import ResponsiveText from "@/components/UI/ResponsiveText";
import Button from "@/components/UI/Button";

export default function SelectAnotherStoreModal({ onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleFindAnotherStore = () => {
    console.log("Finding another store...");
    handleClose();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="bg-white rounded-lg p-6 w-full max-w-sm relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center my-4">
              <ResponsiveText
                as="h2"
                minSize="1rem"
                maxSize="1.4rem"
                className="font-bold text-oxford-blue"
              >
                Please Select Another Store
              </ResponsiveText>
              <div className="absolute top-4 right-4">
                <CloseXButton onClick={handleClose} />
              </div>
            </div>

            {/* Message */}
            <p className="text-oxford-blue mb-6 font-medium">
              Sorry, this restaurant does not support scheduled orders.
            </p>

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleFindAnotherStore}
                variant="primary"
                className="w-full px-4 py-2 font-medium rounded-lg bg-vivid-red text-white hover:bg-red-600 transition"
              >
                Find Another Store
              </Button>
              <Button
                onClick={handleClose}
                variant="simple"
                className="w-full px-4 py-2 font-medium text-vivid-red rounded-lg bg-bright-gray hover:bg-gray-300 transition"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}