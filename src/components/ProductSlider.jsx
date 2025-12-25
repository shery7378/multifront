//src/components/ProductSlider.jsx
'use client';

import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useState, useRef, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import ImageModal from './ImageModal';
import ProductCard from './ProductCard';
import ResponsiveText from './UI/ResponsiveText';
import Link from 'next/link';
import { useI18n } from '@/contexts/I18nContext';
import { productFavorites } from '@/utils/favoritesApi';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

const ProductSlider = ({ title = "Popular Products", products = [], openModal, showArrows = true, viewAllHref = '#', emptyMessage = null }) => {
    const { t } = useI18n();
    const [favorites, setFavorites] = useState({});
    const [modalOpen, setModalOpen] = useState(false);
    const [modalImage, setModalImage] = useState('');
    const [modalAlt, setModalAlt] = useState('');
    const swiperRef = useRef(null);

    // Load favorites from database when products change
    useEffect(() => {
        const loadFavorites = async () => {
            if (!products || products.length === 0) return;
            
            try {
                // Get all favorite product IDs from database
                const favoriteIds = await productFavorites.getAll();
                const favoriteSet = new Set(favoriteIds.map(id => String(id)));
                
                // Also check localStorage as backup
                try {
                    const saved = JSON.parse(localStorage.getItem('favorites') || '{}');
                    Object.keys(saved).forEach(key => {
                        if (saved[key]) {
                            favoriteSet.add(key);
                        }
                    });
                } catch {}
                
                // Create favorites map by product index
                const favMap = {};
                products.forEach((product, index) => {
                    if (product?.id) {
                        favMap[index] = favoriteSet.has(String(product.id));
                    }
                });
                
                setFavorites(favMap);
                console.log('✅ [ProductSlider] Loaded favorites:', favMap);
            } catch (error) {
                console.error('❌ [ProductSlider] Error loading favorites:', error);
                // Fallback to localStorage
                try {
                    const saved = JSON.parse(localStorage.getItem('favorites') || '{}');
                    const favMap = {};
                    products.forEach((product, index) => {
                        if (product?.id) {
                            favMap[index] = !!saved[String(product.id)];
                        }
                    });
                    setFavorites(favMap);
                } catch {}
            }
        };
        
        loadFavorites();
        
        // Listen for favorite updates
        const handleFavoriteUpdate = () => {
            loadFavorites();
        };
        
        if (typeof window !== 'undefined') {
            window.addEventListener('favoriteUpdated', handleFavoriteUpdate);
            return () => {
                window.removeEventListener('favoriteUpdated', handleFavoriteUpdate);
            };
        }
    }, [products]);

    const toggleFavorite = (index) => {
        setFavorites((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    const handlePreviewClick = (image, alt) => {
        setModalImage(image);
        setModalAlt(alt);
        setModalOpen(true);
    };

    useEffect(() => {
        if (!showArrows) return; // skip wiring if arrows are hidden
        const prevBtn = document.querySelector('.swiper-button-prev-custom');
        const nextBtn = document.querySelector('.swiper-button-next-custom');

        const handlePrev = () => {
            if (swiperRef.current) {
                swiperRef.current.slidePrev();
            }
        };

        const handleNext = () => {
            if (swiperRef.current) {
                swiperRef.current.slideNext();
            }
        };

        if (prevBtn) {
            prevBtn.addEventListener('click', handlePrev);
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', handleNext);
        }

        return () => {
            if (prevBtn) {
                prevBtn.removeEventListener('click', handlePrev);
            }
            if (nextBtn) {
                nextBtn.removeEventListener('click', handleNext);
            }
        };
    }, [swiperRef.current, showArrows]);

    return (
        <>
            <div className="pt-4 max-w-7xl mx-auto">
                <div className="flex justify-between items-baseline mb-4">
                    <ResponsiveText
                        as="h2"
                        minSize="1rem"
                        maxSize="1.375rem"
                        className="font-semibold text-oxford-blue"
                    >
                        {title}
                    </ResponsiveText>

                    <div className="flex items-baseline space-x-2">
                        <Link href={viewAllHref}>
                            <ResponsiveText
                                as="span"
                                minSize="0.8rem"
                                maxSize="1rem"
                                className="font-semibold text-vivid-red"
                            >
                                {t('product.viewAll')}
                            </ResponsiveText>
                        </Link>

                        {showArrows && (
                            <>
                                <button
                                    className="swiper-button-prev-custom p-2 border border-gray-200 rounded-full cursor-pointer hover:text-white hover:bg-vivid-red"
                                >
                                    <ArrowLeftIcon className="w-5 h-5" />
                                </button>

                                <button
                                    className="swiper-button-next-custom p-2 border border-gray-200 rounded-full cursor-pointer hover:text-white hover:bg-vivid-red"
                                >
                                    <ArrowRightIcon className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {products.length === 0 ? (
                    <div className="py-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {emptyMessage || t('product.noProducts') || 'No products available at the moment.'}
                        </p>
                    </div>
                ) : (
                    <Swiper
                        onSwiper={(swiper) => { swiperRef.current = swiper; }}
                        // modules={[Pagination]}
                        spaceBetween={12}
                        slidesPerView={1}
                        // pagination={{ clickable: true }}
                        loop={products.length > 5}
                        grabCursor={true}
                        breakpoints={{
                            412: {
                                slidesPerView: 1,
                                spaceBetween: 12,
                            },
                            640: {
                                slidesPerView: 2,
                                spaceBetween: 12,
                            },
                            768: {
                                slidesPerView: 2,
                                spaceBetween: 16,
                            },
                            1024: {
                                slidesPerView: 4,
                                spaceBetween: 20,
                            },
                            1280: {
                                slidesPerView: 5,
                                spaceBetween: 24,
                            },
                        }}
                        className="relative overflow-hidden !py-3"
                    >
                        {products.map((product, index) => (
                            <SwiperSlide key={product?.id || `product-${index}`} className="w-auto sm:!w-auto max-w-[89vw] sm:max-w-auto">
                                <ProductCard
                                    product={product}
                                    index={index}
                                    isFavorite={favorites[index]}
                                    toggleFavorite={toggleFavorite}
                                    onPreviewClick={handlePreviewClick}
                                    productModal={() => openModal(product)}
                                />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                )}
            </div>

            <ImageModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                imageSrc={modalImage}
                alt={modalAlt}
            />
        </>
    );
};

export default ProductSlider;