'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGetRequest } from '@/controller/getRequests';
import { useI18n } from '@/contexts/I18nContext';
import { translateCategoryName } from '@/utils/categoryTranslations';

export default function CategoryNav() {
    const { t } = useI18n();
    const router = useRouter();
    const { data, error, loading, sendGetRequest } = useGetRequest();
    const [refreshKey, setRefreshKey] = useState(0);

    // Fetch categories on mount and when refresh is triggered
    useEffect(() => {
        sendGetRequest('/categories/getAllCategories');
    }, [refreshKey]);

    // Listen for category updates and refresh
    useEffect(() => {
        const handleCategoryUpdate = () => {
            setRefreshKey(prev => prev + 1);
        };

        // Listen for custom events that might indicate category changes
        if (typeof window !== 'undefined') {
            window.addEventListener('categoryUpdated', handleCategoryUpdate);
            // Also refresh periodically (every 30 seconds) to catch any changes
            const interval = setInterval(() => {
                setRefreshKey(prev => prev + 1);
            }, 30000);

            return () => {
                window.removeEventListener('categoryUpdated', handleCategoryUpdate);
                clearInterval(interval);
            };
        }
    }, []);

    const allCategories = data?.data || [];

    if (loading) return <p>{t('common.loadingCategories')}</p>;
    if (error) return <p>{t('common.error')}: {error}</p>;

    // 🔍 Show all child categories (previously only showed those with images)
    // Now show ALL child categories regardless of whether they have images
    const allCategoriesList = allCategories.flatMap((parent) =>
        (parent.children || []).map((child) => ({
            ...child,
            parentName: parent.name
        }))
    );
    
    if (allCategoriesList.length === 0) {
        return <p>{t('common.noCategoriesFound')}</p>;
    }

    const handleClick = (e, category) => {
        e.preventDefault();
        const categoryId = String(category.id);
        const categoryName = category.name || '';
        
        // Save category selection to localStorage
        localStorage.setItem('selectedCategoryId', categoryId);
        localStorage.setItem('selectedCategoryName', categoryName);
        
        // Dispatch event for other components that might need it
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('categorySelected', { 
                detail: { id: categoryId, name: categoryName } 
            }));
        }
        
        // Navigate to products page with category filter applied
        router.push('/products');
    };

    return (
        <div className="w-full">
            {/* Desktop: Wrap to multiple rows, Mobile: Horizontal scroll */}
            <div className="hidden md:flex flex-wrap gap-6 lg:gap-10 pt-2">
                {allCategoriesList.map((category) => (
                    <div
                        key={category.id}
                        className="flex flex-col items-center min-w-[80px] group cursor-pointer"
                        onClick={(e) => handleClick(e, category)}
                    >
                        <div
                            className="
                  relative w-16 h-16 md:w-[74px] md:h-[74px] bg-white border border-gray-200 rounded-full flex items-center justify-center
                  transition-all duration-200 shadow-sm
                  hover:border-vivid-red hover:shadow-[0_0_6px_#ef4444]
                  focus-within:ring-2 focus-within:ring-vivid-red
                "
                            tabIndex={0}
                        >
                            {category.image ? (
                                <img
                                    src={category.image}
                                    alt={category.name}
                                    width={50}
                                    height={50}
                                    className="object-contain p-2"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-vivid-red font-bold text-lg">
                                        {category.name?.charAt(0).toUpperCase() || '?'}
                                    </span>
                                </div>
                            )}
                        </div>
                        <span className="text-oxford-blue font-medium text-[11px] mt-2 text-center">
                            {translateCategoryName(category.name, t)}
                        </span>
                    </div>
                ))}
            </div>
            
            {/* Mobile: Horizontal scroll */}
            <div className="flex md:hidden overflow-x-auto gap-6 lg:gap-10 no-scrollbar pt-2 pe-2 scroll-smooth">
                {allCategoriesList.map((category) => (
                <div
                    key={category.id}
                    className="flex flex-col items-center min-w-[80px] group cursor-pointer"
                    onClick={(e) => handleClick(e, category)}
                >
                    <div
                        className="
              relative w-16 h-16 md:w-[74px] md:h-[74px] bg-white border border-gray-200 rounded-full flex items-center justify-center
              transition-all duration-200 shadow-sm
              hover:border-vivid-red hover:shadow-[0_0_6px_#ef4444]
              focus-within:ring-2 focus-within:ring-vivid-red
            "
                        tabIndex={0}
                    >
                        {category.image ? (
                            <img
                                src={category.image}
                                alt={category.name}
                                width={50}
                                height={50}
                                className="object-contain p-2"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <span className="text-vivid-red font-bold text-lg">
                                    {category.name?.charAt(0).toUpperCase() || '?'}
                                </span>
                            </div>
                        )}
                    </div>
                    <span className="text-oxford-blue font-medium text-[11px] mt-2 text-center">
                        {translateCategoryName(category.name, t)}
                    </span>
                </div>
                ))}
            </div>
        </div>
    );
}
