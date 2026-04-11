// src/components/frontHeader/BurgerMenu.jsx
'use client';

import Link from 'next/link';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usePromotionsModal } from '@/contexts/PromotionsModalContext';
import { useGetRequest } from '@/controller/getRequests';

export default function BurgerMenu({ burgerOpen, setBurgerOpen }) {
  const { openModal } = usePromotionsModal();
  const pathname = usePathname();
  const router = useRouter();
  const { data, error, loading, sendGetRequest } = useGetRequest();

  // Auto-expand categories if user is in a subcategory
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [expandedParents, setExpandedParents] = useState({});

  useEffect(() => {
    if (pathname.startsWith('/categories')) {
      setCategoriesOpen(true);
    }
  }, [pathname]);

  // Toggle parent category expansion
  const toggleParent = (parentId) => {
    setExpandedParents(prev => ({
      ...prev,
      [parentId]: !prev[parentId]
    }));
  };

  const handleCategoryClick = (category) => {
    const hasChildren = category.children && Array.isArray(category.children) && category.children.length > 0;

    if (hasChildren) {
      const childrenIds = category.children.map((c) => String(c.id));
      const childrenNames = category.children.map((c) => c.name || '').filter(Boolean);
      localStorage.setItem('selectedCategoryId', childrenIds.join(','));
      localStorage.setItem('selectedCategoryName', childrenNames.join(','));
      localStorage.setItem('selectedParentCategoryId', String(category.id));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('categorySelected', { 
            detail: { ids: childrenIds, names: childrenNames, parentId: category.id, parentName: category.name } 
        }));
      }
    } else {
      localStorage.setItem('selectedCategoryId', String(category.id));
      localStorage.setItem('selectedCategoryName', category.name || '');
      localStorage.removeItem('selectedParentCategoryId');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('categorySelected', { 
            detail: { id: String(category.id), name: category.name } 
        }));
      }
    }

    setBurgerOpen(false);
    router.push('/products');
  };

  // Fetch categories from API
  useEffect(() => {
    sendGetRequest('/categories/getAllCategories');
  }, [sendGetRequest]);

  // Process categories - keep hierarchical structure (parent with children)
  const allCategories = data?.data || [];

  // Classes
  const linkClasses = (path) =>
    `px-6 py-4 block border-b border-gray-200 hover:bg-gray-100 transition ${pathname === path ? 'text-vivid-red font-semibold border-l-4 border-vivid-red' : ''
    }`;

  const subLinkClasses = (path) =>
    `pl-10 pr-6 py-3 block border-b border-gray-200 hover:bg-gray-100 transition ${pathname === path ? 'text-vivid-red font-semibold border-l-4 border-vivid-red' : ''
    }`;

  return (
    <>
      {/* Backdrop for click-away */}
      {burgerOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[45]" 
          onClick={() => setBurgerOpen(false)}
        />
      )}
      
      <div
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
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
              href="/"
              className={linkClasses('/')}
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

          {/* Live Selling */}
          <li>
            <Link
              href="/live-selling"
              className={linkClasses('/live-selling')}
              onClick={() => setBurgerOpen(false)}
            >
              Live Selling
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
              className={`overflow-hidden transition-all duration-300 ease-out ${categoriesOpen ? 'max-h-[60vh] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0'
                }`}
            >
              {loading && (
                <li className="pl-10 pr-6 py-3 border-b border-gray-200">
                  <span className="text-gray-500 text-sm">Loading categories...</span>
                </li>
              )}
              {error && (
                <li className="pl-10 pr-6 py-3 border-b border-gray-200">
                  <span className="text-red-500 text-sm">Error loading categories</span>
                </li>
              )}
              {!loading && !error && allCategories.length === 0 && (
                <li className="pl-10 pr-6 py-3 border-b border-gray-200">
                  <span className="text-gray-500 text-sm">No categories found</span>
                </li>
              )}
              {!loading && !error && allCategories.map((parentCategory) => {
                const hasChildren = parentCategory.children && parentCategory.children.length > 0;
                const isExpanded = expandedParents[parentCategory.id];

                return (
                  <li key={parentCategory.id}>
                    {/* Parent Category */}
                    {hasChildren ? (
                      <button
                        className="pl-10 pr-6 py-3 w-full flex justify-between items-center border-b border-gray-200 hover:bg-gray-100 transition text-left"
                        onClick={() => toggleParent(parentCategory.id)}
                      >
                        <span className="font-medium">{parentCategory.name}</span>
                        <ChevronDownIcon
                          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                    ) : (
                      <button
                        className={subLinkClasses('#') + ' w-full text-left'}
                        onClick={() => handleCategoryClick(parentCategory)}
                      >
                        {parentCategory.name}
                      </button>
                    )}
                    {/* Children Categories - Only show when expanded */}
                    {hasChildren && isExpanded && (
                      <ul>
                        {parentCategory.children.map((childCategory) => (
                          <li key={childCategory.id}>
                            <button
                                onClick={() => handleCategoryClick(childCategory)}
                                className={`pl-16 pr-6 py-2 block border-b border-gray-200 hover:bg-gray-100 transition text-sm w-full text-left ${
                                    localStorage.getItem('selectedCategoryId') === String(childCategory.id) ? 'text-vivid-red font-semibold border-l-4 border-vivid-red' : ''
                                }`}
                            >
                              {childCategory.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>

          {/* Offers */}
          <li>
            <Link
              href="/?offers=1"
              className={linkClasses('/')}
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
            {(() => {
              const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL;
              const vendorSignupUrl = dashboardUrl 
                ? `${dashboardUrl.replace(/\/$/, '')}/sign-up`
                : '/sign-up'; // Fallback to relative path if env var is missing
              
              // Check if it's an external URL (starts with http:// or https://)
              const isExternal = vendorSignupUrl.startsWith('http://') || vendorSignupUrl.startsWith('https://');
              
              if (isExternal) {
                return (
                  <a
                    href={vendorSignupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold rounded-full px-3 py-1 bg-vivid-red text-white inline-block"
                    onClick={() => setBurgerOpen(false)}
                  >
                    Become a Vendor
                  </a>
                );
              }
              
              return (
                <Link
                  href={vendorSignupUrl}
                  className="font-semibold rounded-full px-3 py-1 bg-vivid-red text-white"
                  onClick={() => setBurgerOpen(false)}
                >
                  Become a Vendor
                </Link>
              );
            })()}
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
    </>
  );
}
