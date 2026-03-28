// src/components/new-design/ShopCategory.jsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useGetRequest } from '@/controller/getRequests';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// ─── DEBUG ───────────────────────────────────────────────────────────────────
const DEBUG = true; // set to false to silence logs in production
function dbg(...args) {
  if (DEBUG) console.log('[ShopCategory]', ...args);
}


// ─────────────────────────────────────────────────────────────────────────────

function getCategoryImageUrl(category) {
  const raw = category.image_url || category.image;
  if (!raw) return null;
  if (raw.startsWith('http')) {
    try {
      const url = new URL(raw);
      let { pathname } = url;

      // If the API returned an absolute URL like
      // http://127.0.0.1:8000/categories/xyz.png, normalize it to
      // http://127.0.0.1:8000/storage/categories/xyz.png
      if (pathname.startsWith('/categories/') && !pathname.startsWith('/storage/categories/')) {
        pathname = `/storage${pathname}`;
        return `${url.origin}${pathname}`;
      }

      return raw;
    } catch {
      return raw;
    }
  }

  const base = API_BASE.replace(/\/$/, '');
  let path = raw.startsWith('/') ? raw : `/${raw}`;

  // Laravel stores files in public/storage — normalize all paths to include /storage/
  if (!path.startsWith('/storage/')) {
    path = `/storage${path}`;
  }

  return `${base}${path}`;
}

function CategorySkeleton() {
  return (
    <>
      {/* Mobile skeleton: horizontal slider */}
      <div className="sm:hidden overflow-x-auto scrollbar-hide -mx-4">
        <div className="flex pb-2 px-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 shrink-0 w-[25vw] animate-pulse">
              <div className="w-[60px] h-[60px] rounded-full bg-gray-200" />
              <div className="h-3 w-12 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Tablet+ skeleton: wrap grid */}
      <div className="hidden sm:flex flex-wrap items-center justify-start gap-6 sm:gap-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-3 animate-pulse">
            <div className="lg:w-[101px] lg:h-[101px] w-[80px] h-[80px] rounded-full bg-gray-200" />
            <div className="h-4 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </>
  );
}

function CategoryItem({ category, onClick, mobile = false, isActive = false }) {
  const imageUrl = getCategoryImageUrl(category);

  // LOG 4 – confirm what URL the <img> will actually receive
  dbg(`CategoryItem "${category.name}" (id=${category.id}) → imageUrl="${imageUrl}"`);

  const handleError = (e) => {
    // LOG 5 – fired when the browser can't load the image
    console.warn(
      `[ShopCategory] ❌ Image failed to load for "${category.name}":`,
      e.target.src,
      '– falling back to placeholder'
    );
    e.target.onerror = null;
    e.target.src = '/images/category/laptop.png';
  };

  if (mobile) {
    return (
      <button
        type="button"
        onClick={() => onClick(category)}
        className="flex flex-col items-center gap-2 group shrink-0 w-[25vw] cursor-pointer bg-transparent border-0 p-0"
      >
        <div className={`w-[60px] h-[60px] rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-[#FFF5F3] border-2 border-[#F44322]' : 'bg-[#F4F4F4] group-hover:bg-[#EAEAEA]'
          }`}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={category.name}
              width={32}
              height={32}
              className="w-[32px] h-[32px] object-contain"
              onError={handleError}
            />
          ) : (
            <span className="text-[#F44322] font-bold text-base">
              {category.name?.charAt(0).toUpperCase() || '?'}
            </span>
          )}
        </div>
        <span className={`text-[10px] font-medium text-center leading-tight w-full px-1 ${isActive ? 'text-[#F44322]' : 'text-[#092E3B]'
          }`}>
          {category.name}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onClick(category)}
      className="flex flex-col items-center gap-3 group cursor-pointer bg-transparent border-0 p-0"
    >
      <div
        className={`lg:w-[101px] lg:h-[101px] w-[80px] h-[80px] rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-[#FFF5F3] border-2 border-[#F44322]' : 'bg-[#F4F4F4] group-hover:bg-[#EAEAEA]'
          }`}
        aria-hidden
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={category.name}
            width={50}
            height={50}
            className="w-[50px] h-[50px] object-contain"
            onError={handleError}
          />
        ) : (
          <span className="text-[#F44322] font-bold text-xl">
            {category.name?.charAt(0).toUpperCase() || '?'}
          </span>
        )}
      </div>
      <span className={`text-base font-medium text-center ${isActive ? 'text-[#F44322]' : 'text-[#092E3B]'
        }`}>
        {category.name}
      </span>
    </button>
  );
}

export default function ShopCategory() {
  const router = useRouter();
  const pathname = usePathname();
  const { data, loading, sendGetRequest } = useGetRequest();

  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    dbg('useEffect fired – calling /categories/getAllCategories');
    sendGetRequest('/categories/getAllCategories');
    // NOTE: sendGetRequest intentionally omitted from deps to avoid infinite loops.
    // If images still don't show after a hard refresh, the issue is likely in
    // useGetRequest caching. Add a timestamp param to bust it:
    //   sendGetRequest('/categories/getAllCategories?ts=' + Date.now());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // LOG 6 – inspect the raw API response shape
  useEffect(() => {
    if (data !== undefined) {
      dbg('API response received:', JSON.stringify(data, null, 2));
      dbg('allTopLevelCategories count:', (data?.data || []).length);
    }
  }, [data]);

  const allTopLevelCategories = data?.data || [];

  const displayCategories = useMemo(() => {
    if (!activeCategory) return allTopLevelCategories;
    return activeCategory.children || [];
  }, [activeCategory, allTopLevelCategories]);

  const handleCategoryClick = (category) => {
    dbg('Category clicked:', category.name, category);

    const hasChildren =
      category.children && Array.isArray(category.children) && category.children.length > 0;

    if (hasChildren) {
      dbg(`  → has ${category.children.length} children, drilling down`);
      setActiveCategory(category);

      const childrenIds = category.children.map((c) => String(c.id));
      const childrenNames = category.children.map((c) => c.name || '').filter(Boolean);
      localStorage.setItem('selectedCategoryId', childrenIds.join(','));
      localStorage.setItem('selectedCategoryName', childrenNames.join(','));
      localStorage.setItem('selectedParentCategoryId', String(category.id));

      window.dispatchEvent(
        new CustomEvent('categorySelected', {
          detail: {
            ids: childrenIds,
            names: childrenNames,
            parentId: category.id,
            parentName: category.name,
          },
        })
      );
    } else {
      dbg('  → leaf category, navigating to products');
      localStorage.setItem('selectedCategoryId', String(category.id));
      localStorage.setItem('selectedCategoryName', category.name || '');
      localStorage.removeItem('selectedParentCategoryId');

      window.dispatchEvent(
        new CustomEvent('categorySelected', {
          detail: { id: String(category.id), name: category.name },
        })
      );

      if (pathname === '/' || pathname === '/home') {
        router.push('/products');
      }
    }
  };

  const handleBack = () => {
    dbg('Back clicked – clearing activeCategory');
    setActiveCategory(null);
    localStorage.removeItem('selectedCategoryId');
    localStorage.removeItem('selectedCategoryName');
    localStorage.removeItem('selectedParentCategoryId');

    window.dispatchEvent(new CustomEvent('filtersCleared'));
  };

  return (
    <section className="w-full bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          {activeCategory && (
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Back to All Categories"
            >
              <ChevronLeftIcon className="w-5 h-5 text-[#092E3B]" />
            </button>
          )}
          <h2 className="text-[#092E3B] font-bold text-xl sm:text-[22px]">
            {activeCategory ? activeCategory.name : 'Shop by Category'}
          </h2>
        </div>

        {/* Content */}
        {loading ? (
          <CategorySkeleton />
        ) : displayCategories.length === 0 ? (
          <div className="py-4 text-gray-500">No sub-categories found.</div>
        ) : (
          <>
            {/* ── MOBILE (< sm): horizontal swipeable slider, 4 items visible ── */}
            <div className="sm:hidden overflow-x-auto scrollbar-hide -mx-4">
              <div className="flex pb-2 px-4">
                {displayCategories.map((category) => {
                  const currentCategoryId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('category') : null;
                  const isActive = currentCategoryId === String(category.id);
                  return (
                    <CategoryItem
                      key={category.id}
                      category={category}
                      onClick={handleCategoryClick}
                      mobile
                      isActive={isActive}
                    />
                  );
                })}
              </div>
            </div>

            {/* ── TABLET + DESKTOP (≥ sm): flex-wrap grid ── */}
            <div className="hidden sm:flex flex-wrap items-center justify-start gap-6 sm:gap-8">
              {displayCategories.map((category) => {
                const currentCategoryId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('category') : null;
                const isActive = currentCategoryId === String(category.id);
                return (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    onClick={handleCategoryClick}
                    isActive={isActive}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
