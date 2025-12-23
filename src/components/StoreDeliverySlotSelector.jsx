// src/components/StoreDeliverySlotSelector.jsx
'use client';
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setStoreDeliverySlot } from "@/store/slices/deliverySlice";
import ResponsiveText from "./UI/ResponsiveText";

export default function StoreDeliverySlotSelector({ storeId, storeName }) {
  const dispatch = useDispatch();
  const { deliverySlots } = useSelector((state) => state.delivery);
  
  const currentSlot = deliverySlots[storeId] || { date: "", time: "" };
  const [selectedDate, setSelectedDate] = useState(currentSlot.date || "");
  const [selectedTime, setSelectedTime] = useState(currentSlot.time || "");

  useEffect(() => {
    if (!selectedDate) {
      const today = new Date();
      const formattedToday = formatDate(today);
      setSelectedDate(formattedToday);
    }
    
    if (!selectedTime) {
      const today = new Date();
      const firstAvailableSlot = generateTimeSlots(today).find(slot => {
        const [startTime] = slot.split(" - ");
        return isTimeSlotAvailable(startTime, today);
      });
      if (firstAvailableSlot) {
        setSelectedTime(firstAvailableSlot);
      }
    }
  }, []);

  // Update Redux when selections change
  useEffect(() => {
    if (selectedDate && selectedTime) {
      dispatch(setStoreDeliverySlot({
        storeId,
        date: selectedDate,
        time: selectedTime,
      }));
    }
  }, [selectedDate, selectedTime, storeId, dispatch]);

  const handleDateChange = (dateLabel) => {
    setSelectedDate(dateLabel);
    // Reset time when date changes
    const dateObj = new Date();
    const dates = generateDates();
    const dateIndex = dates.findIndex(d => d.label === dateLabel);
    if (dateIndex >= 0) {
      dateObj.setDate(dateObj.getDate() + dateIndex);
      const firstAvailableSlot = generateTimeSlots(dateObj).find(slot => {
        const [startTime] = slot.split(" - ");
        return isTimeSlotAvailable(startTime, dateObj);
      });
      setSelectedTime(firstAvailableSlot || "");
    }
  };

  const handleTimeChange = (time) => {
    setSelectedTime(time);
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
        dateObj: date,
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
  const selectedDateObj = dates.find(d => d.label === selectedDate)?.dateObj || new Date();
  const timeSlots = generateTimeSlots(selectedDateObj);

  return (
    <div className="space-y-4">
      <div>
        <ResponsiveText as="h3" minSize="0.875rem" maxSize="1rem" className="font-medium text-oxford-blue mb-2">
          Delivery Slot for {storeName}
        </ResponsiveText>
        
        {/* Date Selection */}
        <div className="flex gap-2 mb-4">
          {dates.map((date) => (
            <button
              key={date.label}
              onClick={() => handleDateChange(date.label)}
              className={`px-3 py-2 rounded-md text-sm border transition-colors ${
                selectedDate === date.label
                  ? "bg-vivid-red text-white border-vivid-red"
                  : "bg-white text-oxford-blue border-gray-300 hover:border-vivid-red"
              }`}
            >
              {date.label}
            </button>
          ))}
        </div>

        {/* Time Slots */}
        <div className="space-y-2">
          {timeSlots.map((time) => {
            const [startTime] = time.split(" - ");
            const isAvailable = isTimeSlotAvailable(startTime, selectedDateObj);
            return (
              <label
                key={time}
                className={`flex items-center space-x-2 cursor-pointer ${
                  !isAvailable ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <input
                  type="radio"
                  name={`delivery-slot-${storeId}`}
                  value={time}
                  checked={selectedTime === time}
                  onChange={() => handleTimeChange(time)}
                  disabled={!isAvailable}
                  className="appearance-none w-4 h-4 border-2 border-gray-200 rounded-full checked:border-vivid-red checked:bg-vivid-red focus:ring-vivid-red relative
                    checked:after:content-[''] checked:after:absolute checked:after:inset-0 checked:after:m-auto checked:after:w-3 checked:after:h-3 checked:after:border-2 checked:after:border-white checked:after:bg-vivid-red checked:after:rounded-full"
                />
                <span className="text-sm text-oxford-blue">{time}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}


