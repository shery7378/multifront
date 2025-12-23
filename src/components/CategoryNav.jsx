'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import { useGetRequest } from '@/controller/getRequests';
import { useI18n } from '@/contexts/I18nContext';
import { translateCategoryName } from '@/utils/categoryTranslations';

export default function CategoryNav() {
    const { t } = useI18n();
    const { data, error, loading, sendGetRequest } = useGetRequest();

    useEffect(() => {
        sendGetRequest('/categories/getAllCategories');
    }, []);

    const allCategories = data?.data || [];

    if (loading) return <p>{t('common.loadingCategories')}</p>;
    if (error) return <p>{t('common.error')}: {error}</p>;

    // 🔍 Flatten all children that have images
    const childCategoriesWithImages = allCategories
        .flatMap((parent) =>
            (parent.children || []).filter((child) => !!child.image)
        );
    if (childCategoriesWithImages.length === 0) {
        return <p>{t('common.noCategoriesFound')}</p>;
    }

    const handleClick = (e, category) => {
        e.preventDefault();
        const next = String(category.id);
        const currently = localStorage.getItem('selectedCategoryId');
        if (currently === next) {
            localStorage.removeItem('selectedCategoryId');
            localStorage.removeItem('selectedCategoryName');
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('categorySelected', { detail: { id: null, name: null } }));
            }
        } else {
            localStorage.setItem('selectedCategoryId', next);
            localStorage.setItem('selectedCategoryName', category.name || '');
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('categorySelected', { detail: { id: next, name: category.name || '' } }));
            }
        }
    };

    return (
        <div className="flex overflow-x-auto gap-6 lg:gap-10 no-scrollbar pt-2 pe-2">
            {childCategoriesWithImages.map((category) => (
                <Link
                    key={category.id}
                    // href={`/category/${category.slug}`}
                    href={`#`}
                    className="flex flex-col items-center min-w-[80px] group"
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
                        {/* <Image
                            src={category.image}
                            alt={category.name}
                            width={50}
                            height={50}
                            className="object-contain p-2"
                            loading="lazy"
                        /> */}
                        <img
                            src={category.image}
                            alt={category.name}
                            width={50}
                            height={50}
                            className="object-contain p-2"
                        />
                    </div>
                    <span className="text-oxford-blue font-medium text-[11px] mt-2 text-center">
                        {translateCategoryName(category.name, t)}
                    </span>
                </Link>
            ))}
        </div>
    );
}
