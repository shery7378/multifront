//src/components/modals/AddressModal.jsx
'use client';
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CloseXButton from '@/components/UI/CloseXButton';
import ResponsiveText from "@/components/UI/ResponsiveText";
import Button from "@/components/UI/Button";
import SearchInput from "@/components/UI/SearchInput";
import IconButton from "@/components/UI/IconButton"; // New import
import { FaEdit } from "react-icons/fa";
import { ClockIcon, MapPinIcon } from "@heroicons/react/24/outline";

export default function AddressModal({ onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
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
            <div className="flex justify-between items-center mb-4">
              <ResponsiveText
                as="h2"
                minSize="1rem"
                maxSize="2.1rem"
                className="font-bold text-oxford-blue"
              >
                Addresses
              </ResponsiveText>
              <div className="absolute top-4 right-4">
                <CloseXButton onClick={handleClose} />
              </div>
            </div>

            <div>
              <SearchInput />
            </div>

            <div className="my-6">
              <h4 className="text-xl font-medium text-oxford-blue my-3">Saved Addresses</h4>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <IconButton icon={MapPinIcon} />
                  <div>
                    <h6 className="font-semibold text-oxford-blue text-sm">E12 6PH, 323</h6>
                    <h5 className="text-oxford-blue/60 font-normal">28/32 High Street North</h5>
                  </div>
                </div>
                <IconButton icon={FaEdit} iconClasses="!w-4 !h-4" />
              </div>
            </div>

            <div className="my-6">
              <h4 className="text-xl font-medium text-oxford-blue my-3">Time Preference</h4>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <IconButton icon={ClockIcon} />
                  <div>
                    <h6 className="font-semibold text-oxford-blue text-sm">Deliver Now</h6>
                  </div>
                </div>
                <Button
                  onClick={handleClose}
                  variant="primary"
                  className="px-4 py-2 rounded-full transition !w-[123px]"
                >
                  Schedule
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}