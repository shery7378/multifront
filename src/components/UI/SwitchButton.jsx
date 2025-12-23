// src/components/UI/SwitchButton.jsx
'use client';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setDeliveryMode, setRightDrawerOpen } from '@/store/slices/deliverySlice';
import { useTheme } from '@/contexts/ThemeContext';
import ResponsiveText from './ResponsiveText';

export default function SwitchButton({
  leftLabel = 'Delivery',
  rightLabel = 'Pickup',
}) {
  const dispatch = useDispatch();
  const mode = useSelector((state) => state.delivery.mode);
  const { isDark } = useTheme();

  const [active, setActive] = useState(
    mode === 'pickup' ? rightLabel : leftLabel
  );

  // Keep button state in sync with Redux mode
  useEffect(() => {
    setActive(mode === 'pickup' ? rightLabel : leftLabel);
  }, [mode, leftLabel, rightLabel]);

  const handleToggle = (value) => {
    const newMode = value === rightLabel ? 'pickup' : 'delivery';

    // 1️⃣ Update Redux + localStorage
    dispatch(setDeliveryMode(newMode));

    // 2️⃣ Open right drawer when switching to pickup
    if (newMode === 'pickup') {
      dispatch(setRightDrawerOpen(true));
    } else {
      dispatch(setRightDrawerOpen(false));
    }
  };

  return (
    <div
      className={`relative flex items-center rounded-full border px-1 w-[143px] h-[32px] sm:w-[160px] sm:h-[44px] md:w-[183px] md:h-[47px] transition duration-300 hover:border-red-500 hover:shadow-[0_0_10px_#ef4444] ${
        isDark 
          ? 'border-slate-700 bg-slate-800' 
          : 'border-gray-200 bg-white'
      }`}
      style={{ gap: '11px' }}
    >
      {/* Sliding active background */}
      <div
        className={`
          absolute top-0 left-0 h-full rounded-full z-0 transition-all duration-300
          ${active === leftLabel ? 'translate-x-0 bg-vivid-red' : 'translate-x-full bg-vivid-red'}
        `}
        style={{
          width: 'calc(54% - 6px)',
          margin: '0px',
        }}
      />

      {/* Delivery */}
      <button
        onClick={() => handleToggle(leftLabel)}
        className={`cursor-pointer z-10 flex-1 text-sm font-medium transition-all duration-300 active:scale-[0.98] ${
          active === leftLabel 
            ? 'text-white' 
            : isDark 
              ? 'text-gray-200 hover:text-vivid-red' 
              : 'text-oxford-blue hover:text-vivid-red'
        }`}
      >
        {leftLabel}
      </button>

      {/* Pickup */}
      <button
        onClick={() => handleToggle(rightLabel)}
        className={`cursor-pointer z-10 flex-1 text-sm font-medium transition-all duration-300 active:scale-[0.98] ${
          active === rightLabel 
            ? 'text-white' 
            : isDark 
              ? 'text-gray-200 hover:text-vivid-red' 
              : 'text-gray-700 hover:text-vivid-red'
        }`}
      >
        {rightLabel}
      </button>
    </div>
  );
}
