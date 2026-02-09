// src/components/frontHeader/DesktopNav.jsx
'use client';

import Link from 'next/link';
import { MapPinIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { FaShoppingCart } from 'react-icons/fa';
import SuggestiveSearchInput from '@/components/UI/SuggestiveSearchInput';
import { useSelector } from 'react-redux';
import { useI18n } from '@/contexts/I18nContext';

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

  const { t } = useI18n();

  console.log(cartItems, 'cartItems');
  return (
    <nav className="hidden lg:block w-full bg-white border-b border-gray-200">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="h-16 sm:h-20 flex items-center justify-center">
          <div className="flex items-center justify-between w-full gap-4">
            {/* Left Section */}
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-shrink-0">
              <button
                onClick={() => setBurgerOpen(!burgerOpen)}
                className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#f44322] active:scale-95 transition-all duration-150 flex-shrink-0 text-[#f44322] cursor-pointer"
              >
                <div
                  className="w-6 h-0.5 bg-[#f44322] mb-1 transition-transform duration-300"
                  style={{ transform: burgerOpen ? 'rotate(45deg) translateY(7px)' : 'none' }}
                />
                <div
                  className={`w-6 h-0.5 bg-[#f44322] mb-1 transition-opacity duration-300 ${burgerOpen ? 'opacity-0' : 'opacity-100'}`}
                />
                <div
                  className="w-6 h-0.5 bg-[#f44322] transition-transform duration-300"
                  style={{ transform: burgerOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }}
                />
              </button>
              
              <Link href="/home" className="flex-shrink-0">
                <span className="text-2xl font-bold text-[#F44322] cursor-pointer whitespace-nowrap">
                  MultiKonnect
                </span>
              </Link>
              
              {/* Delivery/Pickup Toggle - Hidden on smaller screens */}
              <div className="hidden sm:flex bg-gray-100 border border-gray-300 items-center rounded-full p-1 gap-0">
                <button
                onClick={() => handleSwitchChange('Delivery')}
                className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                    mode === 'delivery'
                      ? 'bg-[#F44322] text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 hover:shadow-md'
                  }`}
                style={{
                  '--tw-hover-scale': '1.05',
                  '--tw-hover-bg-color': mode === 'delivery' ? '#F44322' : '#f3f4f6',
                  '--tw-hover-shadow': mode === 'delivery' ? '0 1px 2px 0 rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.backgroundColor = mode === 'delivery' ? '#F44322' : '#f3f4f6';
                  e.currentTarget.style.boxShadow = mode === 'delivery' ? '0 1px 2px 0 rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.backgroundColor = '';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                  Delivery
                </button>
                <button
                  onClick={() => handleSwitchChange('Pickup')}
                  className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                    mode === 'pickup'
                      ? 'bg-[#F44322] text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 hover:shadow-md'
                  }`}
                style={{
                  '--tw-hover-scale': '1.05',
                  '--tw-hover-bg-color': mode === 'pickup' ? '#F44322' : '#f3f4f6',
                  '--tw-hover-shadow': mode === 'pickup' ? '0 1px 2px 0 rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.backgroundColor = mode === 'pickup' ? '#F44322' : '#f3f4f6';
                  e.currentTarget.style.boxShadow = mode === 'pickup' ? '0 1px 2px 0 rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.backgroundColor = '';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                  Pickup
                </button>
              </div>
              
              {/* Location Selector - Hidden on smallest screens */}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="hidden md:flex items-center px-3 lg:px-4 py-2 rounded-full border border-gray-300 bg-white shadow-sm hover:border-gray-400 hover:bg-gray-50 hover:shadow-md transition-all duration-200 transform hover:scale-105"
              >
                <MapPinIcon className="w-4 h-4 lg:w-5 lg:h-5 mr-1 lg:mr-2 text-gray-600 transition-colors duration-200 hover:text-[#f44322] hover:scale-110" />
                <span className="text-xs lg:text-sm font-medium text-gray-800 whitespace-nowrap">{postcode || 'E126 PH'}</span>
                <ChevronDownIcon className="w-3 h-3 lg:w-4 lg:h-4 ml-1 lg:ml-2 text-gray-500 transition-colors duration-200 hover:text-[#f44322] hover:scale-110" />
              </button>
              
              {/* Search Bar - Responsive width */}
              <div className="w-32 sm:w-48 md:w-56 lg:w-64 flex-shrink-0">
                <SuggestiveSearchInput placeholder="Search Multikonnect" />
              </div>
            </div>
            
            {/* Right Section */}
            <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
              {/* Cart */}
              <span
                onClick={() => (cartCount === 0 ? setIsCartModalOpen(true) : setIsCheckOutModalOpen(true))}
                className="relative p-2 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 hover:shadow-md transition-all duration-200 transform hover:scale-105 cursor-pointer flex-shrink-0"
              >
                <FaShoppingCart className="text-lg text-gray-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#F44322] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </span>

              {/* Login/Signup - Responsive text */}
              {isLoggedIn ? (
                <button onClick={handleLogout} className="text-xs sm:text-sm text-gray-600 font-medium hover:text-gray-800 hover:bg-gray-100 cursor-pointer transition-all duration-200 px-2 sm:px-3 py-1 rounded-md whitespace-nowrap">
                  Logout
                </button>
              ) : (
                <>
                  <Link href="/login" className="text-xs sm:text-sm text-gray-600 font-medium hover:text-gray-800 hover:bg-gray-100 cursor-pointer transition-all duration-200 px-2 sm:px-3 py-1 rounded-md whitespace-nowrap">
                    Log in
                  </Link>
                  <Link
                    href="/sign-up"
                    className="bg-[#F44322] hover:bg-orange-600 hover:shadow-lg text-white text-xs sm:text-sm font-medium rounded-full h-8 sm:h-10 px-3 sm:px-6 transition-all duration-200 transform hover:scale-105 whitespace-nowrap flex-shrink-0 flex items-center justify-center"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}