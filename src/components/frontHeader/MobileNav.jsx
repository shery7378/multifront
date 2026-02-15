// src/components/frontHeader/MobileNav.jsx
'use client';

import Link from 'next/link';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { FaShoppingCart } from 'react-icons/fa';
import SuggestiveSearchInput from '@/components/UI/SuggestiveSearchInput';
import NotificationBell from '@/components/NotificationBell';
import ThemeToggleButton from '@/components/Theme/ThemeToggleButton';
import BackButton from '@/components/BackButton';
import { useSelector } from 'react-redux';
import { getStorageUrl } from '@/utils/urlHelpers';

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
    <div className="lg:hidden px-2 sm:px-3 py-2 space-y-2 overflow-hidden">
      <div className="flex justify-between items-center gap-1">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <BackButton className="scale-75 sm:scale-90 flex-shrink-0" />
          <button
            onClick={() => setBurgerOpen(!burgerOpen)}
            className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
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
          <Link href="/" className="min-w-0">
            <img src={getStorageUrl('/storage/images/logo/MultiKonnect.png')} alt="MultiKonnect" className="h-6 sm:h-7 w-auto object-contain dark:hidden" />
            <img src={getStorageUrl('/storage/images/logo/MultiKonnect.png')} alt="MultiKonnect" className="h-6 sm:h-7 w-auto object-contain hidden dark:block brightness-0 invert" />
          </Link>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <ThemeToggleButton className="scale-75 sm:scale-90" />
          {isLoggedIn && <NotificationBell className="scale-75 sm:scale-90" />}
          <span
            onClick={() => setIsCartModalOpen(true)}
            className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center hover:border-vivid-red transition-all cursor-pointer flex-shrink-0"
          >
            <FaShoppingCart className="text-xs sm:text-sm text-black dark:text-gray-200" />
          </span>
        </div>
      </div>
      <div className="flex justify-between items-center gap-1.5 text-oxford-blue dark:text-gray-200">
        <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity min-w-0 flex-1" onClick={() => setIsModalOpen(true)}>
          <MapPinIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
          <span className="text-xs font-medium truncate">{postcode || 'Select location'}</span>
        </div>
        <select
          className="text-xs border border-gray-200 dark:border-slate-700 rounded-full px-2 py-1 bg-vivid-red hover:bg-red-600 text-white transition-colors cursor-pointer flex-shrink-0 min-w-0"
          onChange={(e) => handleSwitchChange(e.target.value)}
        >
          <option value="Delivery">Delivery</option>
          <option value="Pickup">Pickup</option>
        </select>
      </div>
      <div className="flex justify-center px-1">
        <div className="w-full">
          <SuggestiveSearchInput placeholder="Search" />
        </div>
      </div>
    </div>
  );
}