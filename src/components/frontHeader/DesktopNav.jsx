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
        <div className="h-20 flex items-center justify-center">
          <div className="flex items-center justify-between w-full gap-[88px]">
            {/* Left Section */}
            <div className="flex items-center gap-[15px] flex-shrink-0">
              <div className="flex items-center gap-[10px]">
                {/* Hamburger Button */}
                <button
                  onClick={() => setBurgerOpen(!burgerOpen)}
                  className="p-0  hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#f44322] active:scale-95 transition-all duration-150 flex-shrink-0 text-[#f44322] cursor-pointer"
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
                
                {/* Logo */}
                <Link href="/home" className="flex-shrink-0">
                  <span className="text-[20px] font-[400] text-[#F44322] cursor-pointer whitespace-nowrap" style={{ fontFamily: 'Bricle, sans-serif' }}>
                    MultiKonnect
                  </span>
                </Link>
              </div>
              
              {/* Delivery/Pickup Toggle */}
              <div className="flex items-center gap-[11px] border border-[#eaeaea] rounded-[50px] w-[183px] h-[47px] bg-white">
                <button
                  onClick={() => handleSwitchChange('Delivery')}
                  className={`flex items-center justify-center gap-[10px] rounded-[50px] w-[102px] h-[47px] py-3 px-[27px] text-[16px] font-[500] transition-all duration-200 ${
                    mode === 'delivery'
                      ? 'bg-[#F44322] text-white'
                      : 'text-[#092e3b]'
                  }`}
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  Delivery
                </button>
                <button
                  onClick={() => handleSwitchChange('Pickup')}
                  className={`flex items-center justify-center gap-[10px] rounded-[50px] w-[102px] h-[47px] py-3 px-[27px] text-[16px] font-[500] transition-all duration-200 ${
                    mode === 'pickup'
                      ? 'bg-[#F44322] text-white'
                      : 'text-[#092e3b]'
                  }`}
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  Pickup
                </button>
              </div>
              
              {/* Location Selector */}
              <div className="flex items-center gap-[7px] w-[119px]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-[7px]"
                >
                  <MapPinIcon className="w-6 h-6 text-gray-600" />
                  <span className="text-[16px] font-[500] text-[#092e3b] whitespace-nowrap" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    {postcode || 'E126 PH'}
                  </span>
                  <div className="w-[21px] h-[22px] relative overflow-hidden">
                    <svg className="w-[10px] h-[6px] absolute left-[6px] top-[8px] right-[6px] bottom-[8px]" xmlns="http://www.w3.org/2000/svg">
                      <path fill="rgb(9, 46, 59)" d="M 4.9553310869899985 5.928442478179932 C 4.867831086150173 5.928442478179932 4.787622750308532 5.913164699920113 4.714706084680479 5.882609140668596 C 4.641789419052427 5.8520535814170795 4.5688727482089675 5.7985813534098956 4.495956082580915 5.722192459378923 L 0.16470588454736615 1.1846921331768956 C 0.0480392132839947 1.0624698961708288 -0.00664828451095684 0.898233773731051 0.0006433824430038751 0.6919837549300427 C 0.007935049396964591 0.4857337361290345 0.0699142030631381 0.3214976136892565 0.18658087432650955 0.19927537668318968 C 0.33241420558261414 0.046497588621245534 0.4891850473745099 -0.018432972739317616 0.6568933788405709 0.0044836960163499645 C 0.8246017103066319 0.027400364772017547 0.9740808818849377 0.09996980843279042 1.1053308831446758 0.22219204543885726 L 4.9553310869899985 4.255525659016198 L 8.805331123942315 0.22219204543885726 C 8.921997795205685 0.09996980843279042 9.078768626566768 0.031219810361427083 9.275643628456375 0.01594203073566873 C 9.472518630345983 0.0006642511099103753 9.629289461707065 0.06941425737691312 9.745956132970436 0.22219204543885726 C 9.891789464226541 0.3444142824449241 9.953768634965021 0.5048309528070779 9.931893634755065 0.7034420893078764 C 9.910018634545109 0.902053225808675 9.84074780402385 1.0701087893985577 9.72408113276048 1.2076088019325633 L 5.414706091399082 5.722192459378923 C 5.341789425771029 5.7985813534098956 5.26887275492757 5.8520535814170795 5.195956089299518 5.882609140668596 C 5.123039423671465 5.913164699920113 5.042831087829824 5.928442478179932 4.9553310869899985 5.928442478179932 Z"/>
                    </svg>
                  </div>
                </button>
              </div>
              
              {/* Search Bar */}
              <SuggestiveSearchInput
                placeholder="Search Multikonnect"
                className="w-[298px]"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              />
            </div>
            
            {/* Right Section */}
            <div className="flex items-end gap-[17px] flex-shrink-0">
              {/* Cart */}
              <div className="flex items-center justify-center gap-[9px] border border-[#eaeaea] rounded-[24px] w-[47px] h-[47px] py-[11px] px-[12px]">
                <span
                  onClick={() => (cartCount === 0 ? setIsCartModalOpen(true) : setIsCheckOutModalOpen(true))}
                  className="relative cursor-pointer flex items-center justify-center"
                >
                  <FaShoppingCart className="w-[21px] h-[21px] text-gray-700" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#F44322] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </span>
              </div>

              {/* Login/Signup */}
              <div className="flex items-center gap-[3px] w-[178px]">
                {isLoggedIn ? (
                  <button onClick={handleLogout} className="text-[16px] font-[400] text-[#282828] cursor-pointer transition-all duration-200 whitespace-nowrap" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Logout
                  </button>
                ) : (
                  <>
                    <div className="flex items-start gap-[15px] w-[67px]">
                      <div className="flex items-center justify-center gap-[9px] w-[61px]">
                        <div className="flex items-center justify-center gap-[32px] rounded-[30px] py-3 px-[26px]">
                          <Link href="/login" className="text-[16px] font-[400] text-[#282828] cursor-pointer transition-all duration-200 whitespace-nowrap" style={{ fontFamily: 'Manrope, sans-serif' }}>
                            Log in
                          </Link>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-[15px]">
                      <div className="flex items-center justify-center gap-[9px]">
                        <div className="flex items-center justify-center gap-[32px] rounded-[30px] bg-[#F44322] py-3 px-[26px]">
                          <Link
                            href="/sign-up"
                            className="text-[16px] font-[500] text-white cursor-pointer transition-all duration-200 whitespace-nowrap flex items-center justify-center"
                            style={{ fontFamily: 'Manrope, sans-serif' }}
                          >
                            Sign up
                          </Link>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}