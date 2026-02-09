//src/components/FilterNav.jsx
"use client";

import React, { useEffect, useState } from 'react';
import { BookmarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { FaMedal } from 'react-icons/fa';
import DeliveryFeeModal from './modals/DeliveryFeeModal';
import PriceModal from './modals/PriceModal';
import RatingModal from './modals/RatingModal';
import SortModal from './modals/SortModal';
import AddressModal from './modals/AddressModal';
import ScheduleDeliveryModal from './modals/ScheduleDeliveryModal';
import SelectAnotherStoreModal from './modals/SelectAnotherStoreModal';
import SetPickUpTimeModal from './modals/SetPickUpTimeModal';
import DropoffOptionsModal from './modals/DropoffOptionsModal';
import AddressInfoModal from './modals/AddressInfoModal';
import { useI18n } from '@/contexts/I18nContext';

export default function FilterNav() {
  const { t } = useI18n();
  const [activeFilter, setActiveFilter] = useState('');
  const [flags, setFlags] = useState({
    offersOnly: false,
    deliveryFee: null,
    rating: null,
    price: null,
    maxEtaMinutes: null,
    sort: null,
  });

  // Initialize from localStorage and subscribe to filter events
  useEffect(() => {
    const readFlags = () => {
      // Check for custom price range first, then preset price
      const customMinPrice = localStorage.getItem('selectedMinPrice');
      const customMaxPrice = localStorage.getItem('selectedMaxPrice');
      const presetPrice = localStorage.getItem('selectedPrice');
      
      // Check if custom price range is actually set (not empty strings)
      const hasCustomMin = customMinPrice && customMinPrice.trim() !== '';
      const hasCustomMax = customMaxPrice && customMaxPrice.trim() !== '';
      const hasCustomPrice = hasCustomMin || hasCustomMax;
      
      // If custom price range is set, mark price as active
      // Otherwise use preset price
      const priceFlag = hasCustomPrice ? 'custom' : presetPrice;
      
      setFlags({
        offersOnly: localStorage.getItem('offersOnly') === 'true',
        deliveryFee: localStorage.getItem('deliveryFee'),
        rating: localStorage.getItem('selectedRating'),
        price: priceFlag,
        maxEtaMinutes: localStorage.getItem('maxEtaMinutes'),
        sort: localStorage.getItem('selectedSortOption'),
      });
    };
    readFlags();
    const onAny = () => readFlags();
    window.addEventListener('priceFilterApplied', onAny);
    window.addEventListener('deliveryFeeApplied', onAny);
    window.addEventListener('ratingFilterApplied', onAny);
    window.addEventListener('sortApplied', onAny);
    window.addEventListener('offersToggled', onAny);
    window.addEventListener('timeFilterApplied', onAny);
    return () => {
      window.removeEventListener('priceFilterApplied', onAny);
      window.removeEventListener('deliveryFeeApplied', onAny);
      window.removeEventListener('ratingFilterApplied', onAny);
      window.removeEventListener('sortApplied', onAny);
      window.removeEventListener('offersToggled', onAny);
      window.removeEventListener('timeFilterApplied', onAny);
    };
  }, []);
  const [modalType, setModalType] = useState(null);

  const filters = [
    { name: t('filters.offers'), key: 'Offers', hasDropdown: false, icon: <BookmarkIcon className="w-4 h-4" /> },
    { name: t('filters.deliveryFee'), key: 'Delivery Fee', hasDropdown: true, modal: 'deliveryFee' },
    { name: t('filters.under20Min'), key: 'Under 20 Min', hasDropdown: false },
    { name: t('filters.highestRated'), key: 'Highest Rated', hasDropdown: false, icon: <FaMedal className="w-4 h-4" /> },
    { name: t('filters.rating'), key: 'Rating', hasDropdown: true, modal: 'rating', icon: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z' },
    { name: t('filters.price'), key: 'Price', hasDropdown: true, modal: 'price' },
    { name: t('filters.sort'), key: 'Sort', hasDropdown: true, modal: 'sort' },
  ];

  const modalComponents = {
    deliveryFee: DeliveryFeeModal,
    price: PriceModal,
    rating: RatingModal,
    sort: SortModal,
    address: AddressModal,
    scheduleDelivery: ScheduleDeliveryModal,
    selectAnotherStore: SelectAnotherStoreModal,
    setPickUpTime: SetPickUpTimeModal,
    dropoffOptionsModal: DropoffOptionsModal,
    addressInfoModal: AddressInfoModal,
  };

  const handleFilterClick = (filter) => {
    setActiveFilter(filter.key);
    setModalType(filter.modal || null); // Sets the modal type when clicked
    console.log('Modal Type:', filter.modal);

    // Dispatch events for non-modal toggles
    if (!filter.modal) {
      if (filter.key === 'Offers') {
        const current = localStorage.getItem('offersOnly') === 'true';
        const next = !current;
        localStorage.setItem('offersOnly', String(next));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('offersToggled', { detail: { offersOnly: next } }));
        }
      }
      if (filter.key === 'Under 20 Min') {
        const current = localStorage.getItem('maxEtaMinutes');
        const next = current === '20' ? null : '20';
        if (next === null) {
          localStorage.removeItem('maxEtaMinutes');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('timeFilterApplied', { detail: { maxMinutes: null } }));
          }
        } else {
          localStorage.setItem('maxEtaMinutes', next);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('timeFilterApplied', { detail: { maxMinutes: Number(next) } }));
          }
        }
      }
      if (filter.key === 'Highest Rated') {
        localStorage.setItem('selectedSortOption', 'Rating');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sortApplied', { detail: { sort: 'Rating' } }));
        }
      }
    }
  };

  // Decide if a filter button should appear active (based on applied filters)
  const isActive = (filter) => {
    switch (filter.key) {
      case 'Offers':
        return !!flags.offersOnly;
      case 'Delivery Fee':
        return !!flags.deliveryFee && flags.deliveryFee !== '6';
      case 'Under 20 Min':
        return flags.maxEtaMinutes === '20';
      case 'Highest Rated':
        return (flags.sort === 'Rating');
      case 'Rating':
        return flags.rating !== null && flags.rating !== undefined;
      case 'Price':
        // Price is active if preset price is set (and not '6' or null) OR custom price range is set
        if (flags.price === 'custom') {
          // Check if custom prices actually exist
          const customMinPrice = localStorage.getItem('selectedMinPrice');
          const customMaxPrice = localStorage.getItem('selectedMaxPrice');
          const hasCustomMin = customMinPrice && customMinPrice.trim() !== '';
          const hasCustomMax = customMaxPrice && customMaxPrice.trim() !== '';
          return hasCustomMin || hasCustomMax;
        }
        return (!!flags.price && flags.price !== '6' && flags.price !== null && flags.price !== '');
      case 'Sort':
        return !!flags.sort && flags.sort !== 'Recommended';
      default:
        return activeFilter === filter.name;
    }
  };

  const closeModal = () => {
    setModalType(null); // Closes the modal by resetting modalType
  };

  const ActiveModal = modalType ? modalComponents[modalType] : null;

  return (
    <>
      <div className="flex overflow-x-auto scrollbar-hide min-h-[44px] gap-1.5 sm:gap-2 lg:gap-3 -mx-2 sm:-mx-4 lg:-mx-6 px-2 sm:px-4 lg:px-6 border-b-0 shadow-none" style={{borderBottom: 'none', boxShadow: 'none'}}>
        {filters.map((filter, index) => (
          <button
            key={index}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleFilterClick(filter);
            }}
            className={`
              flex items-center space-x-0.5 sm:space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full border text-xs font-medium shadow-sm
              transition-colors duration-200 cursor-pointer whitespace-nowrap flex-shrink-0 touch-manipulation min-w-0
              ${isActive(filter) ? 'bg-vivid-red text-white border-vivid-red' : 'bg-[#F3F3F3] text-oxford-blue border-gray-200 hover:border-vivid-red hover:shadow-[0_0_6px_#ef4444]'}
            `}
          >
            {filter.icon && (
              React.isValidElement(filter.icon) ? (
                React.cloneElement(filter.icon, {
                  className: `w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${isActive(filter) ? 'text-white' : 'text-oxford-blue'}`,
                })
              ) : (
                <svg
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 flex-shrink-0 ${isActive(filter) ? 'text-white' : 'text-oxford-blue'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={filter.icon} />
                </svg>
              )
            )}
            <span className="font-medium whitespace-nowrap text-xs sm:text-xs">{filter.name}</span>
            {filter.hasDropdown && (
              <ChevronDownIcon
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${activeFilter === filter.key ? 'text-white' : 'text-oxford-blue'}`}
              />
            )}
          </button>
        ))}
        {/* Clear All button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Clear storage
            localStorage.removeItem('offersOnly');
            localStorage.removeItem('deliveryFee');
            localStorage.removeItem('selectedRating');
            localStorage.setItem('selectedPrice', '6');
            localStorage.removeItem('maxEtaMinutes');
            localStorage.setItem('selectedSortOption', 'Recommended');
            localStorage.removeItem('selectedDietary');
            localStorage.removeItem('selectedCategoryId');
            localStorage.removeItem('selectedCategoryName');
            localStorage.removeItem('selectedMinPrice');
            localStorage.removeItem('selectedMaxPrice');

            // Dispatch individual events to update listeners
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('offersToggled', { detail: { offersOnly: false } }));
              window.dispatchEvent(new CustomEvent('deliveryFeeApplied', { detail: { fee: 6 } }));
              window.dispatchEvent(new CustomEvent('ratingFilterApplied', { detail: { rating: null } }));
              window.dispatchEvent(new CustomEvent('priceFilterApplied', { detail: { price: 6 } }));
              window.dispatchEvent(new CustomEvent('timeFilterApplied', { detail: { maxMinutes: null } }));
              window.dispatchEvent(new CustomEvent('sortApplied', { detail: { sort: 'Recommended' } }));
              window.dispatchEvent(new CustomEvent('filtersCleared'));
            }
            // Update local state flags immediately
            setFlags({ offersOnly: false, deliveryFee: null, rating: null, price: '6', maxEtaMinutes: null, sort: 'Recommended' });
          }}
          className={`flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-full border text-xs font-medium shadow-sm whitespace-nowrap flex-shrink-0 touch-manipulation min-w-0 bg-[#F3F3F3] text-oxford-blue border-gray-200 hover:border-red-300 hover:shadow-[0_0_6px_#ef4444]`}
        >
          {t('filters.clearAll')}
        </button>
      </div>

      {ActiveModal && <ActiveModal isOpen={!!modalType} onClose={closeModal} />}
    </>
  );
}