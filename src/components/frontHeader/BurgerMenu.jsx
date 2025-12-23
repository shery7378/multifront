// src/components/frontHeader/BurgerMenu.jsx
'use client';

import Link from 'next/link';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { usePromotionsModal } from '@/contexts/PromotionsModalContext';

export default function BurgerMenu({ burgerOpen, setBurgerOpen }) {
  const { openModal } = usePromotionsModal();
  const pathname = usePathname();

  // Auto-expand categories if user is in a subcategory
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  useEffect(() => {
    if (pathname.startsWith('/categories')) {
      setCategoriesOpen(true);
    }
  }, [pathname]);

  // Classes
  const linkClasses = (path) =>
    `px-6 py-4 block border-b border-gray-200 hover:bg-gray-100 transition ${pathname === path ? 'text-vivid-red font-semibold border-l-4 border-vivid-red' : ''
    }`;

  const subLinkClasses = (path) =>
    `pl-10 pr-6 py-3 block border-b border-gray-200 hover:bg-gray-100 transition ${pathname === path ? 'text-vivid-red font-semibold border-l-4 border-vivid-red' : ''
    }`;

  return (
    <div
      className={`absolute top-[50px] lg:top-[80px] left-0 w-screen bg-white shadow-lg overflow-hidden z-50
        transform origin-top transition-all duration-300 ease-in-out
        ${burgerOpen
          ? 'opacity-100 scale-y-100 translate-y-0 max-h-[90vh] pointer-events-auto'
          : 'opacity-0 scale-y-75 -translate-y-5 max-h-0 pointer-events-none'
        }`}
      style={{ transitionProperty: 'opacity, transform, max-height' }}
    >
      <nav className="flex flex-col text-baltic-black">
        <ul className="flex flex-col">
          {/* Home */}
          <li>
            <Link
              href="/home"
              className={linkClasses('/home')}
              onClick={() => setBurgerOpen(false)}
            >
              Home
            </Link>
          </li>

          {/* Browse Stores */}
          <li>
            <Link
              href="/browse-stores"
              className={linkClasses('/browse-stores')}
              onClick={() => setBurgerOpen(false)}
            >
              Browse Stores
            </Link>
          </li>

          {/* Categories Accordion */}
          <li>
            <button
              className="px-6 py-4 flex justify-between items-center hover:bg-gray-100 border-b border-gray-200 w-full text-left"
              onClick={() => setCategoriesOpen(!categoriesOpen)}
            >
              <span
                className={
                  pathname.startsWith('/categories')
                    ? 'text-vivid-red font-semibold'
                    : ''
                }
              >
                Categories
              </span>
              <ChevronDownIcon
                className={`w-5 h-5 transition-transform ${categoriesOpen ? 'rotate-180' : ''
                  }`}
              />
            </button>

            {/* Animated Submenu */}
            <ul
              className={`overflow-hidden transition-all duration-300 ease-out ${categoriesOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
              <li>
                <Link
                  href="#"
                  className={subLinkClasses('/categories/food')}
                  onClick={() => setBurgerOpen(false)}
                >
                  Food
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className={subLinkClasses('/categories/groceries')}
                  onClick={() => setBurgerOpen(false)}
                >
                  Groceries
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className={subLinkClasses('/categories/electronics')}
                  onClick={() => setBurgerOpen(false)}
                >
                  Electronics
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className={subLinkClasses('/categories/fashion')}
                  onClick={() => setBurgerOpen(false)}
                >
                  Fashion
                </Link>
              </li>
            </ul>
          </li>

          {/* Offers */}
          <li>
            <Link
              href="/home?offers=1"
              className={linkClasses('/home')}
              onClick={() => {
                try {
                  localStorage.setItem('offersOnly', 'true');
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('offersToggled', { detail: { offersOnly: true } }));
                  }
                } catch {}
                setBurgerOpen(false);
              }}
            >
              Offers / Deals
            </Link>
          </li>

          {/* Promotions */}
          <li>
            <button
              onClick={() => {
                openModal();
                setBurgerOpen(false);
              }}
              className={linkClasses('#') + ' w-full text-left'}
            >
              Promotions
            </button>
          </li>

          {/* Track Order */}
          <li>
            <Link
              href="/orders"
              className={linkClasses('/orders')}
              onClick={() => setBurgerOpen(false)}
            >
              Track Order
            </Link>
          </li>

          {/* Become a Vendor */}
          <li className="ps-3">
            <Link
              href={`${process.env.NEXT_PUBLIC_DASHBOARD_URL}/sign-up`}
              className="font-semibold rounded-full px-3 py-1 bg-vivid-red text-white"
            >
              Become a Vendor
            </Link>
          </li>

          {/* Help */}
          <li>
            <Link
              href="#"
              className={linkClasses('/help')}
              onClick={() => setBurgerOpen(false)}
            >
              Help
            </Link>
          </li>
        </ul>
      </nav>

    </div>
  );
}
