//src/components/modals/SetPickUpTimeModal.jsx
'use client';
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CloseXButton from '@/components/UI/CloseXButton';
import ResponsiveText from "@/components/UI/ResponsiveText";
import Button from "@/components/UI/Button";

export default function SetPickUpTimeModal({ onClose }) {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [minTime, setMinTime] = useState("00:00");

  useEffect(() => {
    setIsVisible(true);
    // Set default date to today
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // "2025-06-03"
    setSelectedDate(todayStr);

    // Set minimum time based on current time if today
    const currentHours = today.getHours();
    const currentMinutes = today.getMinutes();
    const roundedMinutes = Math.ceil((currentMinutes + 1) / 30) * 30; // Round up to next 30-minute slot
    let defaultHours = currentHours;
    let defaultMinutes = roundedMinutes % 60;
    if (roundedMinutes >= 60) {
      defaultHours += 1;
    }
    const defaultTime = `${String(defaultHours).padStart(2, '0')}:${String(defaultMinutes).padStart(2, '0')}`;
    setSelectedTime(defaultTime);
    setMinTime(defaultTime);
  }, []);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);

    // Adjust minimum time based on selected date
    const today = new Date().toISOString().split('T')[0];
    if (newDate === today) {
      // If today, restrict time to after current time
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const roundedMinutes = Math.ceil((currentMinutes + 1) / 30) * 30;
      let minHours = currentHours;
      let minMinutes = roundedMinutes % 60;
      if (roundedMinutes >= 60) {
        minHours += 1;
      }
      const newMinTime = `${String(minHours).padStart(2, '0')}:${String(minMinutes).padStart(2, '0')}`;
      setMinTime(newMinTime);

      // If selected time is now invalid, set to minimum time
      if (selectedTime < newMinTime) {
        setSelectedTime(newMinTime);
      }
    } else {
      // For future dates, no time restriction
      setMinTime("00:00");
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleSchedule = () => {
    console.log("Scheduled pick-up:", { date: selectedDate, time: selectedTime });
    handleClose();
  };

  const handlePickUpNow = () => {
    console.log("Picking up now...");
    handleClose();
  };

  const today = new Date().toISOString().split('T')[0]; // "2025-06-03"

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
                Pick a Time
              </ResponsiveText>
              <div className="absolute top-4 right-4">
                <CloseXButton onClick={handleClose} />
              </div>
            </div>

            {/* Date Selection */}
            <div className="mb-4">
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                min={today}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-oxford-blue bg-white focus:outline-none focus:ring-2 focus:ring-vivid-red"
              />
            </div>

            {/* Time Selection */}
            <div className="mb-6">
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                min={minTime}
                step="1800" // 30-minute intervals
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-oxford-blue bg-white focus:outline-none focus:ring-2 focus:ring-vivid-red"
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleSchedule}
                variant="primary"
                className="w-full px-4 py-2 font-medium rounded-md"
              >
                Schedule
              </Button>
              <Button
                onClick={handlePickUpNow}
                variant="simple"
                className="w-full px-4 py-2 font-medium text-oxford-blue rounded-md bg-bright-gray hover:bg-gray-300 transition"
              >
                Pick up Now
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}