'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useGetRequest } from '@/controller/getRequests';
import { usePromotionsModal } from '@/contexts/PromotionsModalContext';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

function getCategoryImageUrl(category) {
  const raw = category.image_url || category.image;
  if (!raw) return null;
  if (raw.startsWith('http')) {
    try {
      const url = new URL(raw);
      let { pathname } = url;

      // Normalize absolute URLs like
      // http://127.0.0.1:8000/categories/xyz.png → /storage/categories/xyz.png
      if (pathname.startsWith('/categories/') && !pathname.startsWith('/storage/categories/')) {
        pathname = `/storage${pathname}`;
        return `${url.origin}${pathname}`;
      }

      return raw;
    } catch {
      return raw;
    }
  }
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return `${API_BASE}${path}`;
}

export default function NewBurgerMenu({ burgerOpen, setBurgerOpen }) {
  const { openModal } = usePromotionsModal();
  const pathname = usePathname();
  const router = useRouter();
  const { data, loading, sendGetRequest } = useGetRequest();
  const [showAllCategories, setShowAllCategories] = useState(false);

  useEffect(() => {
    if (burgerOpen) sendGetRequest('/categories/getAllCategories');
  }, [burgerOpen, sendGetRequest]);

  const categories = data?.data || [];
  const visibleCategories = showAllCategories ? categories : categories.slice(0, 12);

  const handleCategoryClick = (category) => {
    const hasChildren = category.children?.length > 0;
    if (hasChildren) {
      const childrenIds = category.children.map((c) => String(c.id));
      const childrenNames = category.children.map((c) => c.name || '').filter(Boolean);
      localStorage.setItem('selectedCategoryId', childrenIds.join(','));
      localStorage.setItem('selectedCategoryName', childrenNames.join(','));
      localStorage.setItem('selectedParentCategoryId', String(category.id));
    } else {
      localStorage.setItem('selectedCategoryId', String(category.id));
      localStorage.setItem('selectedCategoryName', category.name || '');
      localStorage.removeItem('selectedParentCategoryId');
    }
    router.push('/products');
    setBurgerOpen(false);
  };

  const linkCls = (path) =>
    `px-6 py-3.5 flex items-center gap-3 border-b border-[#F3F3F3] hover:bg-[#FFF5F3] transition-colors text-[#092E3B] font-medium text-sm ${
      pathname === path ? 'text-[#F44322] border-l-4 border-[#F44322] bg-[#FFF5F3]' : ''
    }`;

  return (
    <>
      {/* Backdrop */}
      {burgerOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setBurgerOpen(false)}
        />
      )}

      {/* Slide-down panel */}
      <div
        className={`fixed top-[87px] left-0 w-full bg-white shadow-xl z-50 overflow-y-auto max-h-[80vh]
          transition-all duration-300 ease-in-out origin-top
          ${burgerOpen
            ? 'opacity-100 scale-y-100 pointer-events-auto'
            : 'opacity-0 scale-y-95 pointer-events-none -translate-y-2'
          }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6">

          {/* Close button */}
          <div className="flex justify-between items-center mb-5">
            <span className="text-[#092E3B] font-bold text-lg">Menu</span>
            <button
              type="button"
              onClick={() => setBurgerOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <XMarkIcon className="w-5 h-5 text-[#092E3B]" />
            </button>
          </div>

          {/* Quick nav links */}
          <div className="rounded-xl overflow-hidden border border-[#EAEAEA] mb-6">
            <Link href="/home" className={linkCls('/home')} onClick={() => setBurgerOpen(false)}>
              🏠 Home
            </Link>
            <Link href="/browse-stores" className={linkCls('/browse-stores')} onClick={() => setBurgerOpen(false)}>
              🏪 Browse Stores
            </Link>
            <Link href="/live-selling" className={linkCls('/live-selling')} onClick={() => setBurgerOpen(false)}>
              🎥 Live Selling
            </Link>
            <button
              onClick={() => { openModal(); setBurgerOpen(false); }}
              className={linkCls('#') + ' w-full text-left'}
            >
              🎁 Promotions
            </button>
            <Link href="/orders" className={linkCls('/orders')} onClick={() => setBurgerOpen(false)}>
              📦 Track Order
            </Link>
            <a
              href={process.env.NEXT_PUBLIC_DASHBOARD_URL || '/login'}
              target="_blank"
              rel="noopener noreferrer"
              className={linkCls('#')}
            >
              🛒 Become a Seller
            </a>
          </div>

          {/* Categories — matching new design icon style */}
          <div className="mb-2">
            <h3 className="text-[#092E3B] font-bold text-base mb-4">Shop by Category</h3>

            {loading ? (
              <div className="flex flex-wrap gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
                    <div className="w-[70px] h-[70px] rounded-full bg-gray-200" />
                    <div className="h-3 w-14 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : categories.length === 0 ? (
              <p className="text-sm text-gray-400">No categories found</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-4 sm:gap-6">
                  {visibleCategories.map((category) => {
                    const imageUrl = getCategoryImageUrl(category);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleCategoryClick(category)}
                        className="flex flex-col items-center gap-2 group cursor-pointer"
                      >
                        <div className="w-[70px] h-[70px] rounded-full bg-[#F4F4F4] flex items-center justify-center group-hover:bg-[#FFEAE5] transition-colors">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={category.name}
                              className="w-9 h-9 object-contain"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/images/category/laptop.png';
                              }}
                            />
                          ) : (
                            <span className="text-[#F44322] font-bold text-xl">
                              {category.name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          )}
                        </div>
                        <span className="text-[#092E3B] text-xs font-medium text-center max-w-[70px] leading-tight">
                          {category.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {categories.length > 12 && (
                  <button
                    type="button"
                    onClick={() => setShowAllCategories(prev => !prev)}
                    className="mt-4 flex items-center gap-1 text-[#F44322] text-sm font-semibold"
                  >
                    {showAllCategories ? 'Show less' : `Show all ${categories.length} categories`}
                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${showAllCategories ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
