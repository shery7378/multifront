'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useGetRequest } from '@/controller/getRequests';
import { useI18n } from '@/contexts/I18nContext';
import { translateCategoryName } from '@/utils/categoryTranslations';

export default function CategoryNav() {
    const { t } = useI18n();
    const router = useRouter();
    const pathname = usePathname();
    const { data, error, loading, sendGetRequest } = useGetRequest();
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedParentId, setSelectedParentId] = useState(null);
    const isProductsPage = pathname?.includes('/products');

    // Fetch categories on mount and when refresh is triggered
    useEffect(() => {
        sendGetRequest('/categories/getAllCategories');
    }, [refreshKey]);
    
    // Read selectedParentCategoryId from localStorage and update state
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const parentId = localStorage.getItem('selectedParentCategoryId');
            setSelectedParentId(parentId);
        }
    }, [pathname]); // Re-read when pathname changes (e.g., navigating to products page)
    
    // Listen for category selection events
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const handleCategorySelected = () => {
                const newParentId = localStorage.getItem('selectedParentCategoryId');
                setSelectedParentId(newParentId);
            };
            
            window.addEventListener('categorySelected', handleCategorySelected);
            return () => {
                window.removeEventListener('categorySelected', handleCategorySelected);
            };
        }
    }, []);

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

    if (loading) return ;
    if (error) return <p>{t('common.error')}: {error}</p>;

    // Helper function to get image URL
    const getImageUrl = (category) => {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        
        // Debug logging
        if (typeof window !== 'undefined') {
            console.log('CategoryNav - Category data:', {
                id: category.id,
                name: category.name,
                image: category.image,
                image_url: category.image_url
            });
        }
        
        // Check image_url first (from API response)
        if (category.image_url) {
            // Use relative URL to leverage Next.js rewrite proxy
            const imageUrl = category.image_url.startsWith('http') 
                ? category.image_url 
                : category.image_url.startsWith('/') 
                    ? category.image_url 
                    : `/${category.image_url}`;
            
            if (typeof window !== 'undefined') {
                console.log('CategoryNav - Using image_url:', imageUrl);
            }
            return imageUrl;
        } else if (category.image) {
            // Fall back to image field
            if (category.image.startsWith('http://') || category.image.startsWith('https://') || category.image.startsWith('data:')) {
                return category.image;
            } else if (category.image.startsWith('/')) {
                return category.image;
            } else {
                // Try local category images first
                const localImagePath = `/images/category/${category.image}`;
                if (typeof window !== 'undefined') {
                    console.log('CategoryNav - Trying local image path:', localImagePath);
                }
                return localImagePath;
            }
        }
        // Fallback to a default category image
        const fallback = '/images/category/laptop.png';
        if (typeof window !== 'undefined') {
            console.log('CategoryNav - Using fallback image:', fallback);
        }
        return fallback;
    };

    // On products page: if a parent category is selected, show its children
    // On home page: show parent categories
    let categoriesToShow = [];
    
    if (isProductsPage && selectedParentId) {
        // Find the parent category and get its children
        const parentCategory = allCategories.find(cat => String(cat.id) === selectedParentId);
        if (parentCategory && parentCategory.children && Array.isArray(parentCategory.children) && parentCategory.children.length > 0) {
            // Show children categories
            categoriesToShow = parentCategory.children.map((child) => ({
                ...child,
                imageUrl: getImageUrl(child)
            }));
        } else {
            // Parent not found or has no children, show parent categories
            categoriesToShow = allCategories.map((category) => ({
                ...category,
                imageUrl: getImageUrl(category)
            }));
        }
    } else {
        // Home page or no parent selected: show parent categories
        categoriesToShow = allCategories.map((category) => ({
            ...category,
            imageUrl: getImageUrl(category)
        }));
    }
    
    if (categoriesToShow.length === 0) {
        return <p>{t('common.noCategoriesFound')}</p>;
    }

    const handleClick = (e, category) => {
        e.preventDefault();
        
        // If category has children, use children IDs instead of parent ID
        const hasChildren = category.children && Array.isArray(category.children) && category.children.length > 0;
        
        if (hasChildren) {
            // Get all children category IDs
            const childrenIds = category.children.map(child => String(child.id));
            const childrenNames = category.children.map(child => child.name || '').filter(name => name);
            
            // Store children IDs as comma-separated string
            localStorage.setItem('selectedCategoryId', childrenIds.join(','));
            localStorage.setItem('selectedCategoryName', childrenNames.join(','));
            // Store parent ID to show its children on products page
            const parentId = String(category.id);
            localStorage.setItem('selectedParentCategoryId', parentId);
            setSelectedParentId(parentId); // Update state immediately
            
            // Dispatch event with children IDs
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('categorySelected', { 
                    detail: { ids: childrenIds, names: childrenNames, parentId: category.id, parentName: category.name } 
                }));
            }
        } else {
            // No children, use the category itself (this is a child category or category without children)
            const categoryId = String(category.id);
            const categoryName = category.name || '';
            
            localStorage.setItem('selectedCategoryId', categoryId);
            localStorage.setItem('selectedCategoryName', categoryName);
            // Clear parent ID when selecting a category without children
            localStorage.removeItem('selectedParentCategoryId');
            setSelectedParentId(null); // Update state immediately
            
            // Dispatch event for other components that might need it
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('categorySelected', { 
                    detail: { id: categoryId, name: categoryName } 
                }));
            }
        }
        
        // Navigate to products page with category filter applied
        router.push('/products');
    };

    return (
        <div className="w-full">
            {/* Desktop: Wrap to multiple rows, Mobile: Horizontal scroll */}
            <div className="hidden md:flex flex-wrap gap-6 lg:gap-10 pt-2">
                {categoriesToShow.map((category) => (
                    <div
                        key={category.id}
                        className="flex flex-col items-center min-w-[80px] group cursor-pointer"
                        onClick={(e) => handleClick(e, category)}
                    >
                        <div
                            className="
                   relative w-16 h-16 md:w-[74px] md:h-[74px] bg-[#F3F3F3] rounded-full flex items-center justify-center
                  shadow-none border-0
                "
                            tabIndex={0}
                        >
                            {category.imageUrl ? (
                                <img
                                    src={category.imageUrl}
                                    alt={category.name}
                                    width={50}
                                    height={50}
                                    className="object-contain p-2"
                                    onError={(e) => {
                                        console.log('CategoryNav - Image failed to load:', {
                                            src: e.target.src,
                                            alt: e.target.alt,
                                            category: category
                                        });
                                        e.target.onerror = null;
                                        e.target.src = '/images/category/laptop.png';
                                    }}
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
                {categoriesToShow.map((category) => (
                <div
                    key={category.id}
                    className="flex flex-col items-center min-w-[80px] group cursor-pointer"
                    onClick={(e) => handleClick(e, category)}
                >
                    <div
                        className="
              relative w-16 h-16 md:w-[74px] md:h-[74px] bg-[#F3F3F3] rounded-full flex items-center justify-center
              shadow-none border-0
            "
                        tabIndex={0}
                    >
                        {category.imageUrl ? (
                            <img
                                src={category.imageUrl}
                                alt={category.name}
                                width={50}
                                height={50}
                                className="object-contain p-2"
                                onError={(e) => {
                                    console.log('CategoryNav - Mobile Image failed to load:', {
                                        src: e.target.src,
                                        alt: e.target.alt,
                                        category: category
                                    });
                                    e.target.onerror = null;
                                    e.target.src = '/images/category/laptop.png';
                                }}
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
