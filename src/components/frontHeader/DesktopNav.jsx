'use client';

import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { setDeliveryMode } from '@/store/slices/deliverySlice';
import { useEffect, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { FaShoppingCart } from 'react-icons/fa';
import SuggestiveSearchInput from '@/components/UI/SuggestiveSearchInput';
import Image from 'next/image';
import { LuMenu } from 'react-icons/lu';
import LocationAllowModal from '@/components/LocationAllowModal';
import CheckOutModal from '@/components/modals/CheckOutModal';
import EmptyCartModal from '@/components/modals/EmptyCartModal';
import BurgerMenu from '@/components/frontHeader/BurgerMenu';
import { useLogout } from '@/controller/logoutController';

export default function DesktopNav({ burgerOpen, setBurgerOpen }) {
  const dispatch = useDispatch();
  const mode = useSelector((state) => state.delivery.mode);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { handleLogout } = useLogout();

  const cartCount = useSelector((state) =>
    state.cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0)
  );

  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL;
  const vendorSignupUrl = dashboardUrl
    ? `${dashboardUrl.replace(/\/$/, '')}/sign-up`
    : '/sign-up';
  const isExternalVendorUrl =
    vendorSignupUrl.startsWith('http://') || vendorSignupUrl.startsWith('https://');

  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [emptyCartOpen, setEmptyCartOpen] = useState(false);

  const handleCartClick = () => {
    if (cartCount > 0) {
      setCartModalOpen(true);
    } else {
      setEmptyCartOpen(true);
    }
  };

  const [locationLabel, setLocationLabel] = useState('Set location');
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const readLocation = () => {
    const postcode = localStorage.getItem('postcode');
    const city = localStorage.getItem('city');
    setLocationLabel(postcode || city || 'Set location');
  };

  useEffect(() => {
    readLocation();
    window.addEventListener('storage', readLocation);
    return () => window.removeEventListener('storage', readLocation);
  }, []);

  const handleSaveLocation = () => {
    readLocation();
    setLocationModalOpen(false);
  };

  const VendorLink = ({ className }) =>
    isExternalVendorUrl ? (
      <a
        href={vendorSignupUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={{ fontFamily: 'Manrope, sans-serif' }}
      >
        Become a Seller
      </a>
    ) : (
      <Link href={vendorSignupUrl} className={className} style={{ fontFamily: 'Manrope, sans-serif' }}>
        Become a Seller
      </Link>
    );

  return (
    <>
      <nav className="w-full bg-white border-b border-[#EAEAEA]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">

          {/* ── MOBILE (< md): two rows ── */}
          <div className="flex flex-col gap-2.5 py-3 md:hidden">

            {/* Row 1: Hamburger · Logo · Cart · Sign‑up / Sign‑out */}
            <div className="flex items-center justify-between gap-2">
              {/* Left cluster */}
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setBurgerOpen((prev) => !prev)}
                  className="p-0 rounded focus:outline-none flex-shrink-0"
                  aria-label="Open menu"
                  aria-expanded={burgerOpen}
                >
                  <LuMenu
                    className="w-6 h-6 text-[#F44322]"
                    style={{ filter: 'drop-shadow(0 2px 6px rgba(244,67,34,0.18))' }}
                  />
                </button>

                <Link href="/" className="flex items-center flex-shrink-0">
                  <Image src="/images/new-icons/new-logo.svg" alt="logo" width={130} height={28} />
                </Link>
              </div>

              {/* Right cluster */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Cart */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleCartClick}
                    className="flex items-center justify-center w-[40px] h-[40px] rounded-full border border-[#EAEAEA] bg-white"
                    aria-label="View cart"
                  >
                    <Image
                      src="/images/new-icons/mynaui_cart-balck.svg"
                      alt="cart"
                      width={18}
                      height={18}
                    />
                  </button>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-0.5 rounded-full bg-[#F44322] text-white text-[9px] font-bold leading-none pointer-events-none">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </div>

                {/* Auth actions */}
                {isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center rounded-[30px] bg-[#F44322] text-white h-[40px] px-4 text-sm font-medium whitespace-nowrap"
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                  >
                    Sign out
                  </button>
                ) : (
                  <Link
                    href="/sign-up"
                    className="flex items-center justify-center rounded-[30px] bg-[#F44322] text-white h-[40px] px-4 text-sm font-medium whitespace-nowrap"
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                  >
                    Sign up
                  </Link>
                )}
              </div>
            </div>

            {/* Row 2: Toggle + Location */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Delivery / Pickup toggle */}
              <div className="flex rounded-[50px] border border-[#EAEAEA] overflow-hidden bg-white flex-shrink-0">
                <button
                  type="button"
                  onClick={() => dispatch(setDeliveryMode('delivery'))}
                  className={`flex items-center justify-center rounded-[50px] h-[38px] px-4 text-sm font-medium transition-colors ${
                    mode === 'delivery' ? 'bg-[#F44322] text-white' : 'text-[#092E3B]'
                  }`}
                >
                  Delivery
                </button>
                <button
                  type="button"
                  onClick={() => dispatch(setDeliveryMode('pickup'))}
                  className={`flex items-center justify-center rounded-[50px] h-[38px] px-4 text-sm font-medium transition-colors ${
                    mode === 'pickup' ? 'bg-[#F44322] text-white' : 'text-[#092E3B]'
                  }`}
                >
                  Pickup
                </button>
              </div>

              {/* Location */}
              <button
                type="button"
                onClick={() => setLocationModalOpen(true)}
                className="flex items-center gap-1.5 flex-shrink-0"
              >
                <Image
                  src="/images/new-icons/akar-icons_location.svg"
                  alt="location"
                  width={20}
                  height={20}
                />
                <span
                  className={`text-sm font-medium truncate max-w-[130px] ${
                    locationLabel === 'Set location' ? 'text-[#F44322]' : 'text-[#092E3B]'
                  }`}
                >
                  {locationLabel}
                </span>
                <ChevronDownIcon className="w-3.5 h-3.5 text-[#092E3B] flex-shrink-0" />
              </button>
            </div>

            {/* Row 3: Search */}
            <SuggestiveSearchInput
              placeholder="Search Multikonnect"
              className="w-full"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            />
          </div>

          {/* ── TABLET (md – lg): two rows ── */}
          <div className="hidden md:flex lg:hidden flex-col gap-2.5 py-3">

            {/* Row 1: Hamburger · Logo · Toggle · Location · Cart · Auth */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setBurgerOpen((prev) => !prev)}
                  className="p-0 rounded focus:outline-none flex-shrink-0"
                  aria-label="Open menu"
                  aria-expanded={burgerOpen}
                >
                  <LuMenu
                    className="w-6 h-6 text-[#F44322]"
                    style={{ filter: 'drop-shadow(0 2px 6px rgba(244,67,34,0.18))' }}
                  />
                </button>

                <Link href="/" className="flex items-center flex-shrink-0">
                  <Image src="/images/new-icons/new-logo.svg" alt="logo" width={150} height={32} />
                </Link>

                {/* Delivery / Pickup toggle */}
                <div className="flex rounded-[50px] border border-[#EAEAEA] overflow-hidden bg-white flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => dispatch(setDeliveryMode('delivery'))}
                    className={`flex items-center justify-center rounded-[50px] h-[42px] px-5 text-sm font-medium transition-colors ${
                      mode === 'delivery' ? 'bg-[#F44322] text-white' : 'text-[#092E3B]'
                    }`}
                  >
                    Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch(setDeliveryMode('pickup'))}
                    className={`flex items-center justify-center rounded-[50px] h-[42px] px-5 text-sm font-medium transition-colors ${
                      mode === 'pickup' ? 'bg-[#F44322] text-white' : 'text-[#092E3B]'
                    }`}
                  >
                    Pickup
                  </button>
                </div>

                {/* Location */}
                <button
                  type="button"
                  onClick={() => setLocationModalOpen(true)}
                  className="flex items-center gap-1.5 flex-shrink-0"
                >
                  <Image
                    src="/images/new-icons/akar-icons_location.svg"
                    alt="location"
                    width={22}
                    height={22}
                  />
                  <span
                    className={`text-sm font-medium truncate max-w-[120px] ${
                      locationLabel === 'Set location' ? 'text-[#F44322]' : 'text-[#092E3B]'
                    }`}
                  >
                    {locationLabel}
                  </span>
                  <ChevronDownIcon className="w-3.5 h-3.5 text-[#092E3B] flex-shrink-0" />
                </button>
              </div>

              {/* Right: Cart + Auth */}
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleCartClick}
                    className="flex items-center justify-center w-[42px] h-[42px] rounded-full border border-[#EAEAEA] bg-white"
                    aria-label="View cart"
                  >
                    <Image
                      src="/images/new-icons/mynaui_cart-balck.svg"
                      alt="cart"
                      width={19}
                      height={19}
                    />
                  </button>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[17px] h-[17px] px-0.5 rounded-full bg-[#F44322] text-white text-[9px] font-bold leading-none pointer-events-none">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </div>

                {isAuthenticated ? (
                  <>
                    <VendorLink className="text-sm font-medium text-[#282828] whitespace-nowrap hover:text-[#F44322] transition-colors" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center rounded-[30px] bg-[#F44322] text-white h-[42px] px-5 text-sm font-medium whitespace-nowrap hover:bg-[#D33516] transition-colors"
                      style={{ fontFamily: 'Manrope, sans-serif' }}
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <VendorLink className="text-sm font-medium text-[#282828] whitespace-nowrap hover:text-[#F44322] transition-colors" />
                    <Link
                      href="/login"
                      className="text-sm font-medium text-[#282828] whitespace-nowrap hover:text-[#F44322] transition-colors"
                      style={{ fontFamily: 'Manrope, sans-serif' }}
                    >
                      Login
                    </Link>
                    <Link
                      href="/sign-up"
                      className="flex items-center justify-center rounded-[30px] bg-[#F44322] text-white h-[42px] px-5 text-sm font-medium whitespace-nowrap hover:bg-[#D33516] transition-colors"
                      style={{ fontFamily: 'Manrope, sans-serif' }}
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Row 2: Search */}
            <SuggestiveSearchInput
              placeholder="Search Multikonnect"
              className="w-full"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            />
          </div>

          {/* ── DESKTOP (≥ lg): original single row ── */}
          <div className="hidden lg:flex items-center h-[87px] w-full gap-4 xl:gap-6">

            {/* Left cluster */}
            <div className="flex items-center gap-[15px] flex-shrink-0">
              <button
                type="button"
                onClick={() => setBurgerOpen((prev) => !prev)}
                className="p-0 rounded focus:outline-none flex-shrink-0"
                aria-label="Open menu"
                aria-expanded={burgerOpen}
              >
                <LuMenu
                  className="w-6 h-6 text-[#F44322]"
                  style={{ filter: 'drop-shadow(0 2px 6px rgba(244,67,34,0.18))' }}
                />
              </button>

              <Link href="/" className="flex items-center">
                <Image src="/images/new-icons/new-logo.svg" alt="logo" width={170} height={35} />
              </Link>

              {/* Toggle */}
              <div className="flex rounded-[50px] border border-[#EAEAEA] overflow-hidden bg-white flex-shrink-0">
                <button
                  type="button"
                  onClick={() => dispatch(setDeliveryMode('delivery'))}
                  className={`flex items-center justify-center rounded-[50px] h-[47px] px-[27px] py-[12px] text-base font-medium transition-colors ${
                    mode === 'delivery' ? 'bg-[#F44322] text-white' : 'text-[#092E3B]'
                  }`}
                >
                  Delivery
                </button>
                <button
                  type="button"
                  onClick={() => dispatch(setDeliveryMode('pickup'))}
                  className={`flex items-center justify-center rounded-[50px] h-[47px] px-[27px] py-[12px] text-base font-medium transition-colors ${
                    mode === 'pickup' ? 'bg-[#F44322] text-white' : 'text-[#092E3B]'
                  }`}
                >
                  Pickup
                </button>
              </div>

              {/* Location */}
              <button
                type="button"
                onClick={() => setLocationModalOpen(true)}
                className="flex items-center gap-[7px] flex-shrink-0"
              >
                <Image
                  src="/images/new-icons/akar-icons_location.svg"
                  alt="location"
                  width={24.5}
                  height={24.5}
                  className="w-6 h-6"
                />
                <span
                  className={`text-base font-medium whitespace-nowrap ${
                    locationLabel === 'Set location' ? 'text-[#F44322]' : 'text-[#092E3B]'
                  }`}
                >
                  {locationLabel}
                </span>
                <ChevronDownIcon className="w-4 h-4 text-[#092E3B]" />
              </button>
            </div>

            {/* Search — grows to fill middle */}
            <div className="flex-1 max-w-[400px]">
              <SuggestiveSearchInput
                placeholder="Search Multikonnect"
                className="w-full"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              />
            </div>

            {/* Right cluster */}
            <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
              <div className="relative">
                <button
                  type="button"
                  onClick={handleCartClick}
                  className="flex items-center justify-center w-[47px] h-[47px] rounded-full border border-[#EAEAEA] bg-white hover:bg-gray-50 transition-colors"
                  aria-label="View cart"
                >
                  <Image
                    src="/images/new-icons/mynaui_cart-balck.svg"
                    alt="cart"
                    width={20.5}
                    height={20.5}
                    className="w-[20.5px] h-[20.5px]"
                  />
                </button>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#F44322] text-white text-[10px] font-bold leading-none pointer-events-none">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </div>

              {isAuthenticated ? (
                <>
                  <VendorLink className="text-base font-medium text-[#282828] whitespace-nowrap hover:text-[#F44322] transition-colors" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center rounded-[30px] bg-[#F44322] text-white h-[47px] px-6 text-base font-medium whitespace-nowrap hover:bg-[#D33516] transition-colors"
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <VendorLink className="text-base font-medium text-[#282828] whitespace-nowrap hover:text-[#F44322] transition-colors" />
                  <Link
                    href="/login"
                    className="text-base font-medium text-[#282828] whitespace-nowrap hover:text-[#F44322] transition-colors"
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                  >
                    Login
                  </Link>
                  <Link
                    href="/sign-up"
                    className="flex items-center justify-center rounded-[30px] bg-[#F44322] text-white h-[47px] w-[97px] text-base font-medium whitespace-nowrap hover:bg-[#D33516] transition-colors"
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>

        </div>
      </nav>

      {/* Modals */}
      <LocationAllowModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onSave={handleSaveLocation}
      />
      <CheckOutModal
        isOpen={cartModalOpen}
        onClose={() => setCartModalOpen(false)}
        onSwitchToEmptyCart={() => {
          setCartModalOpen(false);
          setEmptyCartOpen(true);
        }}
      />
      <EmptyCartModal
        isOpen={emptyCartOpen}
        onClose={() => setEmptyCartOpen(false)}
      />
    </>
  );
}