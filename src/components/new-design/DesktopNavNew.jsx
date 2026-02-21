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

export default function DesktopNavNew() {
  const dispatch = useDispatch();
  const mode = useSelector((state) => state.delivery.mode);
  const cartCount = useSelector((state) =>
    state.cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0)
  );

  // Cart modals
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [emptyCartOpen, setEmptyCartOpen] = useState(false);

  // Burger menu
  const [burgerOpen, setBurgerOpen] = useState(false);

  const handleCartClick = () => {
    if (cartCount > 0) {
      setCartModalOpen(true);
    } else {
      setEmptyCartOpen(true);
    }
  };

  // Dynamic location label from localStorage
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
    readLocation();           // re-read fresh value saved by the modal
    setLocationModalOpen(false);
  };

  return (
    <>
      <nav className="w-full bg-white border-b border-[#EAEAEA]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="h-[87px] flex items-center justify-center">
            <div className="flex items-center w-full gap-4 lg:gap-6">
              {/* Left: Hamburger + Logo */}
              <div className="flex items-center w-full gap-[15px]">

                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setBurgerOpen(prev => !prev)}
                    className="p-0 rounded focus:outline-none focus:ring-0 flex-shrink-0"
                    aria-label="Open menu"
                    aria-expanded={burgerOpen}
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

                {/* Location — opens LocationAllowModal */}
                <button
                  type="button"
                  onClick={() => setLocationModalOpen(true)}
                  className="flex items-center gap-[7px] flex-shrink-0"
                >
                  <Image src={'/images/new-icons/akar-icons_location.svg'} alt="location" width={24.50} height={24.50} className="w-6 h-6" />
                  <span className={`text-base font-medium whitespace-nowrap ${
                    locationLabel === 'Set location' ? 'text-[#F44322]' : 'text-[#092E3B]'
                  }`}>
                    {locationLabel}
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
                <div className="relative flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleCartClick}
                    className="flex items-center justify-center w-[47px] h-[47px] rounded-full border border-[#EAEAEA] bg-white hover:bg-gray-50 transition-colors"
                    aria-label="View cart"
                  >
                    <Image src={'/images/new-icons/mynaui_cart-balck.svg'} alt="cart" width={20.50} height={20.50} className="w-[20.50px] h-[20.50px]" />
                  </button>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#F44322] text-white text-[10px] font-bold leading-none pointer-events-none">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </div>
                <a
                  href={process.env.NEXT_PUBLIC_DASHBOARD_URL || '/login'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-medium text-[#282828] whitespace-nowrap hidden sm:inline"
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  Become a Seller
                </a>
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

      {/* Burger menu dropdown */}
      <BurgerMenu burgerOpen={burgerOpen} setBurgerOpen={setBurgerOpen} />

      {/* Location modal */}
      <LocationAllowModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onSave={handleSaveLocation}
      />

      {/* Cart modal — shows items when cart has products */}
      <CheckOutModal
        isOpen={cartModalOpen}
        onClose={() => setCartModalOpen(false)}
        onSwitchToEmptyCart={() => {
          setCartModalOpen(false);
          setEmptyCartOpen(true);
        }}
      />

      {/* Empty cart modal — shown when cart is empty */}
      <EmptyCartModal
        isOpen={emptyCartOpen}
        onClose={() => setEmptyCartOpen(false)}
      />
    </>
  );
}
