'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MapPinIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { FaShoppingCart } from 'react-icons/fa';
import SuggestiveSearchInput from '@/components/UI/SuggestiveSearchInput';
import Image from 'next/image';
import { LuMenu } from 'react-icons/lu';

export default function DesktopNavNew() {
  const [mode, setMode] = useState('delivery');

  return (
    <nav className="w-full bg-white border-b border-[#EAEAEA]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="h-[87px] flex items-center justify-center">
          <div className="flex items-center w-full gap-4 lg:gap-6">
            {/* Left: Hamburger + Logo */}
            <div className="flex items-center w-full gap-[15px]">

              <div className="flex items-center gap-2.5 flex-shrink-0">
                <button
                  type="button"
                  className="p-0 rounded focus:outline-none focus:ring-0 focus:ring-[#F44322]/30 flex-shrink-0"
                  aria-label="Open menu"
                >
                  <LuMenu className="w-6 h-6 text-[#F44322] relative" style={{ filter: 'drop-shadow(0 2px 6px rgba(244,67,34,0.18))' }} />
                </button>
                <Link href="/home" className="flex items-center">
                  <Image src={'/images/new-icons/new-logo.svg'} alt="logo" width={170} height={35} />
                </Link>
              </div>

              {/* Delivery / Pickup Toggle */}
              <div className="flex rounded-[50px] border border-[#EAEAEA] overflow-hidden bg-white flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setMode('delivery')}
                  className={`flex items-center justify-center rounded-[50px] h-[47px] px-[27px] py-[12px] text-base font-medium ${mode === 'delivery' ? 'bg-[#F44322] text-white' : 'text-[#092E3B]'
                    }`}
                >
                  Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setMode('pickup')}
                  className={`flex items-center justify-center rounded-[50px] h-[47px] px-[27px] py-[12px] text-base font-medium ${mode === 'pickup' ? 'bg-[#F44322] text-white' : 'text-[#092E3B]'
                    }`}
                >
                  Pickup
                </button>
              </div>

              {/* Location */}
              <button
                type="button"
                className="flex items-center gap-[7px] flex-shrink-0"
              >
                <Image src={'/images/new-icons/akar-icons_location.svg'} alt="location" width={24.50} height={24.50} className="w-6 h-6" />
                <span className="text-base font-medium text-[#092E3B] whitespace-nowrap" >
                  E126 PH
                </span>
                <ChevronDownIcon className="w-4 h-4 font-medium text-[#092E3B]" />
              </button>

              {/* Search Bar */}
              <div className="flex-1 min-w-0 max-w-[400px]">
                <SuggestiveSearchInput
                  placeholder="Search Multikonnect"
                  className="w-full"
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                />
              </div>
            </div>
            {/* Right: Cart, Become a Seller, Sign up */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center justify-center w-[47px] h-[47px] rounded-full border border-[#EAEAEA] bg-white cursor-pointer">
                <Image src={'/images/new-icons/mynaui_cart-balck.svg'} alt="cart" width={20.50} height={20.50} className="w-[20.50px] h-[20.50px]" />
              </div>
              <Link
                href="/login"
                className="text-base font-medium text-[#282828] whitespace-nowrap hidden sm:inline"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Become a Seller
              </Link>
              <Link
                href="/sign-up"
                className="flex items-center justify-center rounded-[30px] bg-[#F44322] text-white h-[47px] w-[97px] text-base font-medium whitespace-nowrap"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Sign up
              </Link>
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
}
