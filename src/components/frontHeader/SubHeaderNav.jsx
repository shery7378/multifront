'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePromotionsModal } from '@/contexts/PromotionsModalContext';

import { useState, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useGetRequest } from '@/controller/getRequests';

export default function SubHeaderNav() {
  const pathname = usePathname();
  const { openModal } = usePromotionsModal();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const { data, loading, sendGetRequest } = useGetRequest();

  useEffect(() => {
    sendGetRequest('/categories/getAllCategories');
  }, [sendGetRequest]);

  const allCategories = data?.data || [];

  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL;
  const vendorSignupUrl = dashboardUrl
    ? `${dashboardUrl.replace(/\/$/, '')}/sign-up`
    : '/sign-up';

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Browse Stores', href: '/browse-stores' },
    { label: 'Live Selling', href: '/live-selling' },
    { label: 'Categories', href: '/products' },
    { label: 'Offers / Deals', href: '/?offers=1', isOffer: true },
    { label: 'Promotions', onClick: openModal },
    { label: 'Track Order', href: '/orders' },
    { label: 'Become a Seller', href: vendorSignupUrl },
    { label: 'Help', href: '#' }
  ];

  return (
    <>
      {/* Desktop (Horizontal) Navigation Bar */}
      <div className="w-full bg-white border-b border-gray-200 hidden lg:block">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <nav className="flex items-center gap-8 h-14 relative">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href || (item.isOffer && pathname === '/' && typeof window !== 'undefined' && localStorage.getItem('offersOnly') === 'true');

              if (item.label === 'Categories') {
                return (
                  <div
                    key={index}
                    className="relative px-2 h-full flex items-center group/cat"
                    onMouseEnter={() => setCategoriesOpen(true)}
                    onMouseLeave={() => setCategoriesOpen(false)}
                  >
                    <button className="flex items-center gap-1.5 text-[16px] font-medium text-[#092E3B] hover:text-[#F44322] transition-colors py-4">
                      {item.label}
                      <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${categoriesOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {/* Categories Dropdown Panel */}
                    <div className={`absolute top-full left-0 w-64 bg-white shadow-2xl rounded-b-xl border border-gray-100 z-[110] transition-all duration-300 transform origin-top ${categoriesOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}>
                      <div className="py-3 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {loading && <div className="px-5 py-2 text-sm text-gray-400 italic">Finding categories...</div>}
                        {!loading && allCategories.map((cat) => {
                          const currentCategoryId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('category') : null;
                          const isCatActive = currentCategoryId === String(cat.id);
                          return (
                            <Link
                              key={cat.id}
                              href={`/products?category=${cat.id}`}
                              className={`block px-5 py-2.5 text-[15px] transition-colors hover:bg-gray-50 hover:text-[#F44322] ${isCatActive ? 'text-[#F44322] font-semibold' : 'text-gray-600'
                                }`}
                              onClick={() => setCategoriesOpen(false)}
                            >
                              {cat.name}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              if (item.onClick) {
                return (
                  <button
                    key={index}
                    onClick={item.onClick}
                    className="text-[16px] font-medium text-[#092E3B] hover:text-[#F44322] transition-colors"
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                  >
                    {item.label}
                  </button>
                )
              }

              return (
                <Link
                  key={index}
                  href={item.href}
                  className={`text-[16px] font-medium transition-colors ${isActive ? 'text-[#F44322] font-semibold' : 'text-[#092E3B] hover:text-[#F44322]'
                    }`}
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile (Vertical List) below the main header as shown in images */}
      <div className="lg:hidden bg-white w-full border-b border-gray-200 shadow-sm overflow-hidden">
        <nav className="flex flex-col">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href || (item.isOffer && pathname === '/' && typeof window !== 'undefined' && localStorage.getItem('offersOnly') === 'true');

            if (item.label === 'Categories') {
              return (
                <div key={index} className="flex flex-col border-b border-gray-100">
                  <button
                    onClick={() => setCategoriesOpen(!categoriesOpen)}
                    className="px-6 py-5 flex justify-between items-center text-[16px] font-medium text-[#092E3B] hover:bg-gray-50 transition-colors"
                  >
                    <span>{item.label}</span>
                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${categoriesOpen ? 'max-h-[50vh] opacity-100 py-2' : 'max-h-0 opacity-0'}`}>
                    {allCategories.map((cat) => {
                      const currentCategoryId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('category') : null;
                      const isCatActive = currentCategoryId === String(cat.id);
                      return (
                        <Link
                          key={cat.id}
                          href={`/products?category=${cat.id}`}
                          className={`block px-10 py-3 text-[15px] transition-colors hover:text-[#F44322] ${isCatActive ? 'text-[#F44322] font-bold' : 'text-gray-600'
                            }`}
                        >
                          {cat.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )
            }

            if (item.onClick) {
              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="px-6 py-5 text-left text-[16px] font-medium text-[#092E3B] border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  {item.label}
                </button>
              )
            }

            return (
              <Link
                key={index}
                href={item.href}
                className={`px-6 py-5 text-[16px] font-medium border-b border-gray-100 last:border-0 block transition-colors hover:bg-gray-50 ${isActive ? 'text-[#F44322] font-bold' : 'text-[#092E3B]'
                  }`}
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
