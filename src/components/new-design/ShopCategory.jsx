'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGetRequest } from '@/controller/getRequests';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

function getCategoryImageUrl(category) {
  const raw = category.image_url || category.image;
  if (!raw) return null;
  if (raw.startsWith('http')) return raw;
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return `${API_BASE}${path}`;
}

function CategorySkeleton() {
  return (
    <div className="flex flex-wrap items-center justify-start gap-6 sm:gap-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-3 animate-pulse">
          <div className="lg:w-[101px] lg:h-[101px] w-[80px] h-[80px] rounded-full bg-gray-200" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function ShopCategory() {
  const router = useRouter();
  const { data, loading, sendGetRequest } = useGetRequest();

  useEffect(() => {
    sendGetRequest('/categories/getAllCategories');
  }, [sendGetRequest]);

  const categories = data?.data || [];

  const handleClick = (category) => {
    const hasChildren =
      category.children && Array.isArray(category.children) && category.children.length > 0;

    if (hasChildren) {
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
      localStorage.setItem('selectedCategoryId', String(category.id));
      localStorage.setItem('selectedCategoryName', category.name || '');
      localStorage.removeItem('selectedParentCategoryId');
      window.dispatchEvent(
        new CustomEvent('categorySelected', {
          detail: { id: String(category.id), name: category.name },
        })
      );
    }

    router.push('/products');
  };

  return (
    <section className="w-full bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <h2 className="text-[#092E3B] font-bold text-xl sm:text-[22px] mb-6">
          Shop by Category
        </h2>

        {loading ? (
          <CategorySkeleton />
        ) : categories.length === 0 ? null : (
          <div className="flex flex-wrap items-center justify-start gap-6 sm:gap-8">
            {categories.map((category) => {
              const imageUrl = getCategoryImageUrl(category);
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleClick(category)}
                  className="flex flex-col items-center gap-3 group cursor-pointer bg-transparent border-0 p-0"
                >
                  <div
                    className="lg:w-[101px] lg:h-[101px] w-[80px] h-[80px] rounded-full bg-[#F4F4F4] flex items-center justify-center group-hover:bg-[#EAEAEA] transition-colors"
                    aria-hidden
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={category.name}
                        width={50}
                        height={50}
                        className="w-[50px] h-[50px] object-contain"
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
                  <span className="text-[#092E3B] text-base font-medium text-center">
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
