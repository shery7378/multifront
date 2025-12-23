// src/components/frontHeader/MobileNav.jsx
'use client';

import Link from 'next/link';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { FaShoppingCart } from 'react-icons/fa';
import SuggestiveSearchInput from '@/components/UI/SuggestiveSearchInput';
import NotificationBell from '@/components/NotificationBell';
import ThemeToggleButton from '@/components/Theme/ThemeToggleButton';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import CurrencySwitcher from '@/components/CurrencySwitcher';
import { useSelector } from 'react-redux';

export default function MobileNav({
  postcode,
  burgerOpen,
  setBurgerOpen,
  handleSwitchChange,
  setIsModalOpen,
  setIsCartModalOpen,
  isLoggedIn,
}) {
  return (
    <div className="xl:hidden px-4 py-3 space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBurgerOpen(!burgerOpen)}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle burger menu"
          >
            <div
              className="w-6 h-0.5 bg-gray-700 dark:bg-gray-300 mb-1 transition-transform duration-300"
              style={{ transform: burgerOpen ? 'rotate(45deg) translateY(7px)' : 'none' }}
            />
            <div
              className={`w-6 h-0.5 bg-gray-700 dark:bg-gray-300 mb-1 transition-opacity duration-300 ${burgerOpen ? 'opacity-0' : 'opacity-100'}`}
            />
            <div
              className="w-6 h-0.5 bg-gray-700 dark:bg-gray-300 transition-transform duration-300"
              style={{ transform: burgerOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }}
            />
          </button>
          <Link href="/">
            <span className="text-lg font-bold font-[bricle] text-vivid-red">
              MultiKonnect
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggleButton />
          <LanguageSwitcher className="hidden sm:block" />
          <CurrencySwitcher className="hidden sm:block" />
          {isLoggedIn && <NotificationBell />}
          <span
            onClick={() => setIsCartModalOpen(true)}
            className="w-10 h-10 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center hover:border-vivid-red hover:shadow-[0_0_10px_#ef4444] transition-all cursor-pointer"
          >
            <FaShoppingCart className="text-lg text-black dark:text-gray-200" />
          </span>
        </div>
      </div>
      <div className="flex justify-between items-center text-oxford-blue dark:text-gray-200">
        <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setIsModalOpen(true)}>
          <MapPinIcon className="w-5 h-5 mr-2" />
          <span className="text-sm font-medium truncate">{postcode || ''}</span>
        </div>
        <select
          className="text-sm border border-gray-200 dark:border-slate-700 rounded-full px-2 py-1 bg-vivid-red hover:bg-red-600 text-white transition-colors cursor-pointer"
          onChange={(e) => handleSwitchChange(e.target.value)}
        >
          <option value="Delivery">Delivery</option>
          <option value="Pickup">Pickup</option>
        </select>
      </div>
      <div className="flex justify-center">
        <SuggestiveSearchInput placeholder="Search Multikonnect" />
      </div>
      {/* Mobile Currency and Language Switchers */}
      <div className="flex items-center justify-center gap-3 sm:hidden pt-2 pb-1">
        <LanguageSwitcher />
        <CurrencySwitcher />
      </div>
    </div>
  );
}