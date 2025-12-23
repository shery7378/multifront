//src/components/ProductSliderByCategory.jsx
'use client';

import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useEffect, useMemo, useRef, useState } from 'react';
import ImageModal from './ImageModal';
import ProductCard from './ProductCard';
import ResponsiveText from './UI/ResponsiveText';

const menu = [
    'Featured',
    'Popular Products',
    'Game Gaged',
    'Home',
    'LCD',
    'Air board',
    'Watch`s',
    'Charger',
];

// Helper to normalize strings for comparison
const normalize = (value) =>
    (value || '')
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

// Extract category-like labels from a product
const getProductCategories = (product) => {
    const direct =
        Array.isArray(product?.categories)
            ? product.categories.map((c) => c?.name || c?.title || c?.slug || '').filter(Boolean)
            : [];

    const extras = [
        product?.category,
        product?.categoryName,
        product?.type,
        product?.department,
    ].filter(Boolean);

    return [...direct, ...extras];
};

const ProductSliderByCategory = ({ title = "Popular Products", products = [], openModal }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [visibleSlides, setVisibleSlides] = useState(4);
    const [favorites, setFavorites] = useState({});
    const [modalOpen, setModalOpen] = useState(false);
    const [modalImage, setModalImage] = useState('');
    const [modalAlt, setModalAlt] = useState('');
    const touchStartX = useRef(null);
    const touchEndX = useRef(null);
    // Add state to track active tab
    const [activeMenu, setActiveMenu] = useState(menu[0]);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 640) setVisibleSlides(1);
            else if (width < 768) setVisibleSlides(2);
            else if (width < 1024) setVisibleSlides(3);
            else setVisibleSlides(4);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Filter products based on the active tab label
    const filteredProducts = useMemo(() => {
        if (!products || products.length === 0) return [];

        // "Featured" and "Popular Products" just show all products for now
        if (activeMenu === 'Featured' || activeMenu === 'Popular Products') {
            return products;
        }

        const tabKey = normalize(activeMenu);

        const matchesTab = (product) => {
            const categories = getProductCategories(product);

            // Direct category name match
            if (categories.some((c) => normalize(c) === tabKey)) {
                return true;
            }

            // Fallback: try to match on product name keywords
            const name = normalize(product?.name);
            if (!name) return false;

            const TAB_KEYWORDS = {
                gamegaged: ['game', 'gaming', 'console', 'ps', 'xbox'],
                home: ['home', 'kitchen', 'sofa', 'decor'],
                lcd: ['lcd', 'screen', 'display', 'monitor', 'tv'],
                airboard: ['airboard', 'hoverboard', 'scooter'],
                watchs: ['watch', 'smartwatch', 'clock'],
                charger: ['charger', 'charge', 'power', 'adapter'],
            };

            const keywords = TAB_KEYWORDS[tabKey] || [];
            return keywords.some((kw) => name.includes(kw));
        };

        const out = products.filter(matchesTab);

        // Return only matched products; if none match, show empty slider for this tab
        return out;
    }, [products, activeMenu]);

    const totalSlides = filteredProducts.length;

    const handleNext = () => {
        setCurrentIndex((prev) =>
            prev + visibleSlides >= totalSlides ? 0 : prev + 1
        );
    };

    const handlePrev = () => {
        setCurrentIndex((prev) =>
            prev === 0 ? Math.max(totalSlides - visibleSlides, 0) : prev - 1
        );
    };

    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;
        const delta = touchStartX.current - touchEndX.current;
        if (delta > 50) handleNext();
        else if (delta < -50) handlePrev();
        touchStartX.current = null;
        touchEndX.current = null;
    };

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

    return (
        <>
            <div className="pt-4 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex border-b-4 border-gray-200 gap-6 sm:gap-10 overflow-x-auto whitespace-nowrap no-scrollbar">

                        {menu.map((item) => (
                            <span
                                key={item}
                                onClick={() => setActiveMenu(item)}
                                className={`
                                    cursor-pointer
                                    font-medium
                                    text-sm
                                    appearance-none
                                    rounded-t
                                    relative
                                    pb-2
                                    ${activeMenu === item
                                        ? `after:content-[''] after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:bg-vivid-red after:rounded-t text-vivid-red`
                                        : ''
                                    }
                                    hover:after:content-[''] hover:after:absolute hover:after:inset-x-0 hover:after:bottom-0 hover:after:h-1 hover:after:bg-vivid-red hover:after:rounded-t
                                `}
                            >
                                {item}
                            </span>
                        ))}

                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={handlePrev}
                            className="p-2 border border-gray-200 rounded-full cursor-pointer hover:text-white hover:bg-vivid-red"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleNext}
                            className="p-2 border border-gray-200 rounded-full cursor-pointer hover:text-white hover:bg-vivid-red"
                        >
                            <ArrowRightIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="">
                    <ResponsiveText as="h2" minSize="1rem" maxSize="1.375rem" className="font-semibold text-oxford-blue my-2">{activeMenu}</ResponsiveText>
                </div>

                <div
                    className="relative overflow-hidden"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div
                        className="flex transition-transform duration-300 ease-in-out gap-3"
                        style={{
                            transform: `translateX(-${(currentIndex * 100) / visibleSlides}%)`,
                            width: `${(100 * totalSlides) / visibleSlides}%`,
                        }}
                    >
                        {filteredProducts.map((product, index) => (
                            <ProductCard
                                key={index}
                                product={product}
                                index={index}
                                TotalProducts={filteredProducts.length}
                                isFavorite={favorites[index]}
                                toggleFavorite={toggleFavorite}
                                onPreviewClick={handlePreviewClick}
                                productModal={() => openModal(product)}
                            />
                        ))}
                    </div>
                </div>
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

export default ProductSliderByCategory;
