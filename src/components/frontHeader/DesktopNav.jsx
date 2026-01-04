// src/components/frontHeader/DesktopNav.jsx
'use client';

import Link from 'next/link';
import { MapPinIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { FaShoppingCart } from 'react-icons/fa';
import SwitchButton from '@/components/UI/SwitchButton';
import SuggestiveSearchInput from '@/components/UI/SuggestiveSearchInput';
import { useSelector } from 'react-redux';
import { usePathname } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import NotificationBell from '@/components/NotificationBell';
import ThemeToggleButton from '@/components/Theme/ThemeToggleButton';
import { useI18n } from '@/contexts/I18nContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function DesktopNav({
  postcode,
  burgerOpen,
  setBurgerOpen,
  handleSwitchChange,
  mode,
  setIsModalOpen,
  setIsCartModalOpen,
  setIsCheckOutModalOpen,
  isLoggedIn,
  handleLogout
}) {
  // Calculate cartCount from Redux store
  const cartItems = useSelector((state) => state.cart.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const pathname = usePathname();
  const { t } = useI18n();
  const { isDark } = useTheme();

  const linkClasses = (path) =>
    `hover:text-vivid-red transition ${pathname === path ? 'text-vivid-red border-b-2 border-vivid-red' : ''
    }`;
  console.log(cartItems, 'cartItems');
  return (
    <nav className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="h-20 hidden xl:flex items-center justify-between gap-4 lg:gap-6">
        {/* Left Section */}
        <div className="flex items-center gap-3 lg:gap-4 flex-shrink-0">
          <button
            onClick={() => setBurgerOpen(!burgerOpen)}
            aria-label="Toggle burger menu"
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none transition-colors flex-shrink-0"
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
          <Link href="/home" className="flex-shrink-0">
            <span className="text-xl font-bold font-[bricle] text-vivid-red cursor-pointer whitespace-nowrap">
              {t('header.multiKonnect')}
            </span>
          </Link>
          <div className="flex-shrink-0">
            <SwitchButton
              leftLabel={t('nav.delivery')}
              rightLabel={t('nav.pickup')}
              defaultValue={mode === 'pickup' ? t('nav.pickup') : t('nav.delivery')}
              onChange={handleSwitchChange}
            />
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={`flex items-center px-3 py-2 rounded-full border shadow-sm hover:border-vivid-red hover:shadow-[0_0_6px_#ef4444] transition-all ${
              isDark 
                ? 'border-slate-700 bg-slate-800 text-gray-200' 
                : 'border-gray-200 bg-white text-oxford-blue'
            }`}
          >
            <MapPinIcon className={`w-5 h-5 mr-2 flex-shrink-0 ${isDark ? 'text-gray-200' : 'text-oxford-blue'}`} />
            <span className="text-sm font-medium whitespace-nowrap">{postcode || t('header.enterDeliveryAddress')}</span>
            <ChevronDownIcon className={`w-4 h-4 ml-2 flex-shrink-0 ${isDark ? 'text-gray-200' : 'text-oxford-blue'}`} />
          </button>
        </div>
        
        {/* Center Section - Search */}
        <div className="flex-1 flex justify-center items-center min-w-0 px-4 lg:px-6">
          <div className="w-full max-w-[600px]">
            <SuggestiveSearchInput placeholder={t('landing.searchPlaceholder')} />
          </div>
        </div>
        
        {/* Right Section */}
        <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
          <ThemeToggleButton />
          <LanguageSwitcher />
          
          {isLoggedIn && <NotificationBell />}
          
          <span
            onClick={() => (cartCount === 0 ? setIsCartModalOpen(true) : setIsCheckOutModalOpen(true))}
            className={`relative w-12 h-12 rounded-full border flex items-center justify-center hover:border-vivid-red hover:shadow-[0_0_10px_#ef4444] transition-all cursor-pointer flex-shrink-0 ${
              isDark 
                ? 'border-slate-700 bg-slate-800' 
                : 'border-gray-200 bg-white'
            }`}
          >
            <FaShoppingCart className={`text-xl ${isDark ? 'text-gray-200' : 'text-black'}`} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-vivid-red text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </span>

          {isLoggedIn ? (
            <button onClick={handleLogout} className="text-sm text-baltic-black dark:text-gray-200 font-medium hover:underline cursor-pointer transition-colors whitespace-nowrap">
              {t('nav.logout')}
            </button>
          ) : (
            <>
              <Link href="/login" className="text-sm text-baltic-black dark:text-gray-200 font-medium hover:underline cursor-pointer transition-colors whitespace-nowrap">
                {t('nav.login')}
              </Link>
              <Link
                href="/sign-up"
                className="bg-vivid-red hover:bg-red-600 grid justify-center items-center text-white text-sm font-medium rounded-full h-[40px] px-4 lg:px-5 transition-colors shadow-sm hover:shadow-md whitespace-nowrap flex-shrink-0"
              >
                {t('nav.signUp')}
              </Link>
            </>
          )}
        </div>
      </div>

      

    </nav>
  );
}