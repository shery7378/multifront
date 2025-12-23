// src/components/frontHeader/BurgerMenu.jsx
'use client';

import Link from 'next/link';
import { usePromotionsModal } from '@/contexts/PromotionsModalContext';

export default function BurgerMenu({
  burgerOpen,
  setBurgerOpen,
  setIsEstimatedArrivalOpen,
  setIsStoreAddReviewOpen,
  setIsOrderReceivedOpen,
}) {
  const { openModal } = usePromotionsModal();
  return (
    <div
      className={`fixed top-[50px] lg:top-[80px] left-0 w-screen bg-white shadow-lg overflow-hidden z-50
        transform origin-top transition-all duration-300 ease-in-out
        ${burgerOpen
          ? 'opacity-100 scale-y-100 translate-y-0 max-h-[90vh] pointer-events-auto'
          : 'opacity-0 scale-y-75 -translate-y-5 max-h-0 pointer-events-none'
        }`}
      style={{ transitionProperty: 'opacity, transform, max-height' }}
    >
      <nav className="flex flex-col">
        <div
          onClick={() => {
            setIsEstimatedArrivalOpen(true);
            setBurgerOpen(false);
          }}
          className="px-6 py-4 hover:bg-gray-100 border-b border-gray-200 block cursor-pointer"
        >
          Estimated Arrival
        </div>
        <div
          onClick={() => {
            openModal();
            setBurgerOpen(false);
          }}
          className="px-6 py-4 hover:bg-gray-100 border-b border-gray-200 block cursor-pointer"
        >
          Promotions
        </div>
        <div
          onClick={() => {
            setIsStoreAddReviewOpen(true);
            setBurgerOpen(false);
          }}
          className="px-6 py-4 hover:bg-gray-100 border-b border-gray-200 block cursor-pointer"
        >
          Store Add Review
        </div>
        <div
          onClick={() => {
            setIsOrderReceivedOpen(true);
            setBurgerOpen(false);
          }}
          className="px-6 py-4 hover:bg-gray-100 border-b border-gray-200 block cursor-pointer"
        >
          Order Receive
        </div>
        <Link
          href="/menu2"
          className="px-6 py-4 hover:bg-gray-100 border-b border-gray-200 block"
          onClick={() => setBurgerOpen(false)}
        >
          Menu Item 2
        </Link>
        <Link
          href="/menu3"
          className="px-6 py-4 hover:bg-gray-100 block"
          onClick={() => setBurgerOpen(false)}
        >
          Menu Item 3
        </Link>
      </nav>
    </div>
  );
}