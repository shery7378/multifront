//src/components/LandingPageHeader.jsx
'use client';
import Link from 'next/link';
import { useState } from 'react';
import { 
  MapPinIcon, 
  ChevronDownIcon, 
  Bars3Icon, 
  MagnifyingGlassIcon, 
  ShoppingCartIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import { SunIcon as SunIconSolid } from '@heroicons/react/24/solid';
import { useI18n } from '@/contexts/I18nContext';
import { useTheme } from '@/contexts/ThemeContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function LandingPageHeader({ postcode, onOpenModal }) {
  const { t } = useI18n();
  const { isDark, toggleTheme } = useTheme();
  const [orderType, setOrderType] = useState('delivery'); // 'delivery' or 'pickup'

  return (
    <header className="bg-white border-b border-gray-100 py-3">
      <div className="container mx-auto px-4 flex items-center justify-center gap-8">
        
        {/* Left Section: Menu & Logo */}
        <div className="flex items-center gap-4 shrink-0">
          <button className="p-1 text-gray-300 hover:text-gray-500 transition-colors">
            <Bars3Icon className="w-6 h-6" />
          </button>
          <Link href="/home">
            <img src="/images/logo/MultiKonnect.png" alt="MultiKonnect" className="h-8 w-auto" />
          </Link>
        </div>

        {/* Middle Section: Delivery Toggle & Location */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {/* Delivery/Pickup Toggle */}
          <div className="flex bg-white border border-gray-200 items-center rounded-full p-1 gap-1 shadow-sm">
            <button
              onClick={() => setOrderType('delivery')}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
                orderType === 'delivery'
                  ? 'bg-vivid-red text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('header.delivery') || 'Delivery'}
            </button>
            <button
              onClick={() => setOrderType('pickup')}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
                orderType === 'pickup'
                  ? 'bg-vivid-red text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('header.pickup') || 'Pickup'}
            </button>
          </div>

          {/* Location Selector */}
          <button 
            onClick={onOpenModal}
            className="flex items-center gap-2 bg-white border border-gray-200 rounded-full py-2 px-4 shadow-sm hover:border-gray-300 transition-all text-sm"
          >
            <MapPinIcon className="w-5 h-5 text-gray-700" />
            <span className="font-medium text-gray-700">
              {postcode || 'SW10'}
            </span>
            <ChevronDownIcon className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Search Bar (Reduced Width) */}
        <div className="hidden md:flex w-[300px] px-2">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-vivid-red" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-full bg-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-vivid-red focus:border-vivid-red shadow-sm transition-all"
              placeholder="Search what you want"
            />
          </div>
        </div>

        {/* Right Section: Theme, Language, Cart, Auth */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
          
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="w-12 h-6 bg-gray-200 rounded-full relative transition-colors focus:outline-none"
          >
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform flex items-center justify-center ${
              isDark ? 'translate-x-6' : 'translate-x-0'
            }`}>
              {isDark ? (
                <MoonIcon className="w-3 h-3 text-gray-700" />
              ) : (
                <SunIconSolid className="w-3.5 h-3.5 text-yellow-400" />
              )}
            </div>
          </button>

          {/* Language Switcher */}
          <LanguageSwitcher className="bg-white border-gray-200 shadow-sm" />

          {/* Cart */}
          <button className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 shadow-sm transition-colors">
            <ShoppingCartIcon className="w-5 h-5 text-black" />
          </button>
          
          {/* Auth */}
          <Link 
            href="/login"
            className="text-gray-400 font-medium hover:text-gray-600 transition-colors whitespace-nowrap text-sm"
          >
            Login
          </Link>
          
          <Link
            href="/sign-up"
            className="bg-vivid-red hover:bg-red-600 text-white font-medium px-6 py-2 rounded-full transition-colors whitespace-nowrap text-sm shadow-sm"
          >
            Sign Up
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-3">
             <button className="p-1">
                <MagnifyingGlassIcon className="w-6 h-6 text-gray-700" />
             </button>
        </div>
      </div>
    </header>
  );
}

