//src/components/modals/ScheduleDeliveryModal.jsx
'use client';
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CloseXButton from '@/components/UI/CloseXButton';
import ResponsiveText from "@/components/UI/ResponsiveText";
import Button from "@/components/UI/Button";

export default function ScheduleDeliveryModal({ onClose }) {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  useEffect(() => {
    setIsVisible(true);
    // Set default date to today
    const today = new Date();
    const formattedToday = formatDate(today);
    setSelectedDate(formattedToday);
    // Set default time to the first available slot after the current time
    const firstAvailableSlot = generateTimeSlots(today).find(slot => {
      const [startTime] = slot.split(" - ");
      return isTimeSlotAvailable(startTime, today);
    });
    setSelectedTime(firstAvailableSlot || "");
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleSchedule = () => {
    console.log("Scheduled delivery:", { date: selectedDate, time: selectedTime });
    handleClose();
  };

  // Helper to format dates as "Day (MMM DD)"
  const formatDate = (date) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dayName = days[date.getDay()];
    const month = months[date.getMonth()];
    const day = date.getDate();
    return `${dayName} (${month} ${day})`;
  };

  // Helper to generate the next 3 days
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        label: i === 0 ? `Today (${formatDate(date).split("(")[1]}` : formatDate(date),
        disabled: false,
      });
    }
    return dates;
  };

  // Helper to generate time slots for the selected date
  const generateTimeSlots = (date) => {
    const slots = [];
    const startHour = 9; // Start at 9:00 AM
    const endHour = 13; // End at 1:00 PM (13:00)
    for (let hour = startHour; hour <= endHour; hour++) {
      const start = `${hour % 12 === 0 ? 12 : hour % 12}:00${hour < 12 ? "AM" : "PM"}`;
      const end = `${hour % 12 === 0 ? 12 : hour % 12}:30${hour < 12 ? "PM" : "PM"}`;
      slots.push(`${start} - ${end}`);
    }
    return slots;
  };

  // Helper to check if a time slot is available (not in the past)
  const isTimeSlotAvailable = (time, date) => {
    const now = new Date();
    const [hour, minutePeriod] = time.split(":");
    const [minute, period] = minutePeriod.split(/(AM|PM)/);
    let slotHour = parseInt(hour);
    if (period === "PM" && slotHour !== 12) slotHour += 12;
    if (period === "AM" && slotHour === 12) slotHour = 0;
    const slotDate = new Date(date);
    slotDate.setHours(slotHour, parseInt(minute), 0, 0);
    return slotDate > now;
  };

  const dates = generateDates();
  const selectedDateObj = new Date();
  const dateIndex = dates.findIndex(date => date.label === selectedDate);
  selectedDateObj.setDate(selectedDateObj.getDate() + dateIndex);
  const timeSlots = generateTimeSlots(selectedDateObj);

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
                Schedule Delivery
              </ResponsiveText>
              <div className="absolute top-4 right-4">
                <CloseXButton onClick={handleClose} />
              </div>
            </div>

            {/* Date Selection */}
            <div className="flex justify-between gap-2 mb-4 overflow-auto scrollbar-thin max-w-[90%] mx-auto">
              {dates.map((date) => (
                <Button
                  key={date.label}
                  onClick={() => {
                    setSelectedDate(date.label);
                    // Reset time slot if date changes
                    const dateObj = new Date();
                    dateObj.setDate(dateObj.getDate() + dates.findIndex(d => d.label === date.label));
                    const firstAvailableSlot = generateTimeSlots(dateObj).find(slot => isTimeSlotAvailable(slot.split(" - ")[0], dateObj));
                    setSelectedTime(firstAvailableSlot || "");
                  }}
                  variant={selectedDate === date.label ? "primary" : "simple"}
                  className={`px-3 py-1 rounded-full w-auto whitespace-nowrap transition ${selectedDate === date.label ? "bg-vivid-red text-white" : "bg-bright-gray text-oxford-blue"}`}
                  disabled={date.disabled}
                >
                  {date.label}
                </Button>
              ))}
            </div>

            {/* Time Slots */}
            <div className="my-6 space-y-2">
              {timeSlots.map((time) => {
                const isAvailable = isTimeSlotAvailable(time.split(" - ")[0], selectedDateObj);
                return (
                  <label
                    key={time}
                    className={`flex items-center space-x-2 ${isAvailable ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                  >
                    <input
                      type="radio"
                      name="timeSlot"
                      value={time}
                      checked={selectedTime === time}
                      onChange={() => setSelectedTime(time)}
                      disabled={!isAvailable}
                      className="appearance-none w-4 h-4 border-2 border-gray-200 rounded-full checked:border-vivid-red checked:bg-vivid-red focus:ring-vivid-red relative
                        checked:after:content-[''] checked:after:absolute checked:after:inset-0 checked:after:m-auto checked:after:w-3 checked:after:h-3 checked:after:border-2 checked:after:border-white checked:after:bg-vivid-red checked:after:rounded-full"
                    />
                    <span className="text-oxford-blue">
                      {time}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleSchedule}
                variant="primary"
                disabled={!selectedTime}
                className={`w-full px-4 py-2 rounded-lg transition ${selectedTime ? "bg-vivid-red text-white hover:bg-red-600" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
              >
                Schedule
              </Button>
              <Button
                onClick={handleClose}
                variant="simple"
                className="w-full px-4 py-2 rounded-lg bg-bright-gray text-oxford-blue transition"
              >
                Deliver now
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}