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
    
    // Debug log when data changes
    useEffect(() => {
        if (data && typeof window !== 'undefined') {
            console.log('CategoryNav - Categories API response:', {
                dataStructure: data,
                hasData: !!data?.data,
                categoriesCount: data?.data?.length || 0,
                sampleCategory: data?.data?.[0] ? {
                    id: data.data[0].id,
                    name: data.data[0].name,
                    hasChildren: !!data.data[0].children,
                    childrenCount: data.data[0].children ? data.data[0].children.length : 0,
                    sampleChild: data.data[0].children?.[0] || null
                } : null
            });
        }
    }, [data]);
    
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

            return () => {
                window.removeEventListener('categoryUpdated', handleCategoryUpdate);
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
            // Handle storage URLs - use API base URL for storage paths
            if (category.image_url.startsWith('/storage/')) {
                const fullStorageUrl = `${apiBaseUrl}${category.image_url}`;
                if (typeof window !== 'undefined') {
                    console.log('CategoryNav - Using storage URL:', fullStorageUrl);
                }
                return fullStorageUrl;
            }
            // Handle full HTTP URLs
            else if (category.image_url.startsWith('http')) {
                return category.image_url;
            }
            // Handle other relative paths
            else {
                const imageUrl = category.image_url.startsWith('/') 
                    ? category.image_url 
                    : `/${category.image_url}`;
                if (typeof window !== 'undefined') {
                    console.log('CategoryNav - Using relative URL:', imageUrl);
                }
                return imageUrl;
            }
        } else if (category.image) {
            // Fall back to image field
            if (category.image.startsWith('http://') || category.image.startsWith('https://') || category.image.startsWith('data:')) {
                return category.image;
            } else if (category.image.startsWith('storage/') || category.image.startsWith('/storage/')) {
                // Handle storage URLs in image field as well
                const storagePath = category.image.startsWith('/') ? category.image : `/${category.image}`;
                const fullStorageUrl = `${apiBaseUrl}${storagePath}`;
                if (typeof window !== 'undefined') {
                    console.log('CategoryNav - Using storage URL from image field:', fullStorageUrl);
                }
                return fullStorageUrl;
            } else if (category.image.startsWith('/')) {
                return category.image;
            } else {
                // Try local category images first - ensure proper path construction
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
        
        // Debug logging
        if (typeof window !== 'undefined') {
            console.log('CategoryNav - Parent category lookup:', {
                selectedParentId,
                parentCategory: parentCategory ? {
                    id: parentCategory.id,
                    name: parentCategory.name,
                    hasChildren: !!parentCategory.children,
                    childrenCount: parentCategory.children ? parentCategory.children.length : 0
                } : null
            });
        }
        
        if (parentCategory && parentCategory.children && Array.isArray(parentCategory.children) && parentCategory.children.length > 0) {
            // Show children categories
            categoriesToShow = parentCategory.children.map((child) => ({
                ...child,
                imageUrl: getImageUrl(child)
            }));
            
            if (typeof window !== 'undefined') {
                console.log('CategoryNav - Showing children categories:', categoriesToShow.length);
            }
        } else {
            // Parent not found or has no children - show message and fallback to parent categories
            if (typeof window !== 'undefined') {
                console.log('CategoryNav - No children found for parent category, falling back to all parent categories');
            }
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
        <div className="w-full flex flex-col gap-[28px] ">
            {/* Desktop: Wrap to multiple rows, Mobile: Horizontal scroll */}
            <div className="hidden md:flex flex-wrap gap-[28px]">
                {categoriesToShow.map((category) => (
                    <div
                        key={category.id}
                        className="flex flex-col items-center w-[101px] group cursor-pointer"
                        onClick={(e) => handleClick(e, category)}
                    >
                        <div
                            className="
                   relative w-[101px] h-[101px] bg-[#F4F4F4] rounded-[51px] flex items-center justify-center
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
                                    className="object-cover"
                                    onError={(e) => {
                                        console.log('CategoryNav - Image failed to load:', {
                                            src: e.target.src,
                                            alt: e.target.alt,
                                            category: category
                                        });
                                        e.target.onerror = null;
                                        // Try fallback with storage URL if available
                                        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
                                        if (category.image_url && (category.image_url.startsWith('storage/') || category.image_url.startsWith('/storage/'))) {
                                            const storagePath = category.image_url.startsWith('/') ? category.image_url : `/${category.image_url}`;
                                            e.target.src = `${apiBaseUrl}${storagePath}`;
                                        }
                                        // Try fallback with storage URL from image field
                                        else if (category.image && (category.image.startsWith('storage/') || category.image.startsWith('/storage/'))) {
                                            const storagePath = category.image.startsWith('/') ? category.image : `/${category.image}`;
                                            e.target.src = `${apiBaseUrl}${storagePath}`;
                                        }
                                        // Try fallback with full path for local images
                                        else if (category.image && !category.image.startsWith('/') && !category.image.startsWith('http')) {
                                            e.target.src = `/images/category/${category.image}`;
                                        } else {
                                            e.target.src = '/images/category/laptop.png';
                                        }
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
                        <span className="text-[rgb(9,46,59)] font-medium text-[16px] text-center">
                            {translateCategoryName(category.name, t)}
                        </span>
                    </div>
                ))}
            </div>
            
            {/* Mobile: Horizontal scroll */}
            <div className="flex md:hidden overflow-x-auto gap-[28px] no-scrollbar pe-2 scroll-smooth">
                {categoriesToShow.map((category) => (
                <div
                    key={category.id}
                    className="flex flex-col items-center w-[101px] group cursor-pointer"
                    onClick={(e) => handleClick(e, category)}
                >
                    <div
                        className="
              relative w-[101px] h-[101px] bg-[#F4F4F4] rounded-[51px] flex items-center justify-center
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
                                className="object-cover"
                                onError={(e) => {
                                    console.log('CategoryNav - Mobile Image failed to load:', {
                                        src: e.target.src,
                                        alt: e.target.alt,
                                        category: category
                                    });
                                    e.target.onerror = null;
                                    // Try fallback with storage URL if available
                                    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
                                    if (category.image_url && (category.image_url.startsWith('storage/') || category.image_url.startsWith('/storage/'))) {
                                        const storagePath = category.image_url.startsWith('/') ? category.image_url : `/${category.image_url}`;
                                        e.target.src = `${apiBaseUrl}${storagePath}`;
                                    }
                                    // Try fallback with storage URL from image field
                                    else if (category.image && (category.image.startsWith('storage/') || category.image.startsWith('/storage/'))) {
                                        const storagePath = category.image.startsWith('/') ? category.image : `/${category.image}`;
                                        e.target.src = `${apiBaseUrl}${storagePath}`;
                                    }
                                    // Try fallback with full path for local images
                                    else if (category.image && !category.image.startsWith('/') && !category.image.startsWith('http')) {
                                        e.target.src = `/images/category/${category.image}`;
                                    } else {
                                        e.target.src = '/images/category/laptop.png';
                                    }
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
                    <span className="text-[rgb(9,46,59)] font-medium text-[16px] text-center">
                        {translateCategoryName(category.name, t)}
                    </span>
                </div>
                ))}
            </div>
        </div>
    );
}
