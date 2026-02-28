//src/app/home/page.jsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import Topheader from '@/components/new-design/Topheader';
import DesktopNav from '@/components/frontHeader/DesktopNav';
import OrderCutoffBar from '@/components/new-design/OrderCutoffBar';
import ShopCategory from '@/components/new-design/ShopCategory';
import Stocksection from '@/components/new-design/Stocksection';
import Filters from '@/components/new-design/Filters';
import TrendingNearYou from '@/components/new-design/TrendingNearYou';
import WarrantyCards from '@/components/new-design/WarrantyCards';
import Footer from '@/components/Footer';
import NearStoreSection from '@/components/new-design/NearStoreSection';
import { useGetRequest } from '@/controller/getRequests';
import { usePostRequest } from '@/controller/postRequests';
import BurgerMenu from '@/components/frontHeader/BurgerMenu';
import PersonalizedFeed from '@/components/PersonalizedFeed';
import ProductSection from '@/components/new-design/ProductSection';
import ProfileDrawer from '@/components/UI/ProfileDrawer';

export default function HomePage() {
    const deliveryMode = useSelector((state) => state.delivery.mode);

    const {
        data: products,
        loading: productsLoading,
        sendGetRequest: getProducts
    } = useGetRequest();

    const {
        data: stores,
        loading: storesLoading,
        sendGetRequest: getStores
    } = useGetRequest();

    const { sendPostRequest: logView } = usePostRequest();

    // Filter state
    const [sameDayActive, setSameDayActive] = useState(false);
    const [activeFilters, setActiveFilters] = useState({});
    const [burgerOpen, setBurgerOpen] = useState(false);
    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const [location, setLocation] = useState({ lat: null, lng: null });
    const { token, isAuthenticated } = useSelector((state) => state.auth);

    const handleProductView = useCallback(async (product) => {
        if (!product || !product.id) return;

        // 1. Local Storage Tracking (for "Recently Viewed" section)
        const key = 'recentlyViewedProductIds';
        const dataKey = 'recentlyViewedProductsData';
        const raw = localStorage.getItem(key);
        const rawData = localStorage.getItem(dataKey);

        let ids = raw ? JSON.parse(raw) : [];
        let productsData = rawData ? JSON.parse(rawData) : [];

        const idStr = String(product.id);
        ids = [idStr, ...ids.filter(id => String(id) !== idStr)].slice(0, 20);
        productsData = [product, ...productsData.filter(p => String(p?.id) !== idStr)].slice(0, 20);

        // Filter out any deleted products (products not in active list)
        const activeProductIds = new Set((products?.data || []).map(p => p.id));
        productsData = productsData.filter(p => activeProductIds.has(p.id));

        localStorage.setItem(key, JSON.stringify(ids));
        localStorage.setItem(dataKey, JSON.stringify(productsData));

        setRecentlyViewed(productsData.slice(0, 12));

        // 2. Backend Logging (for "Smart Recommendations")
        if (isAuthenticated) {
            try {
                await logView('/personalized-feed/log-view', { product_id: product.id }, false);
            } catch (e) {
                console.error('Failed to log product view to server', e);
            }
        }
    }, [isAuthenticated, logView, products?.data]);

    const loadRecentlyViewed = useCallback(() => {
        if (!isAuthenticated) {
            setRecentlyViewed([]);
            return;
        }
        const dataKey = 'recentlyViewedProductsData';
        const rawData = localStorage.getItem(dataKey);
        if (rawData) {
            try {
                const stored = JSON.parse(rawData);
                if (Array.isArray(stored)) {
                    // Filter out deleted products - keep only those that exist in the current product list
                    const activeProductIds = new Set(
                        (products?.data || []).map(p => p.id)
                    );
                    const filtered = stored.filter(p => activeProductIds.has(p.id));
                    setRecentlyViewed(filtered.slice(0, 12));
                }
            } catch (e) {
                console.error('Error loading recently viewed:', e);
            }
        }
    }, [isAuthenticated, products?.data]);

    useEffect(() => {
        loadRecentlyViewed();
    }, [loadRecentlyViewed]);

    // Watch for location changes from localStorage and update state
    useEffect(() => {
        const updateLocation = () => {
            const lat = localStorage.getItem('lat');
            const lng = localStorage.getItem('lng');
            setLocation({
                lat: lat ? parseFloat(lat) : null,
                lng: lng ? parseFloat(lng) : null,
            });
        };

        // Initial load
        updateLocation();

        // Listen for storage changes (from other tabs/windows or location modal)
        window.addEventListener('storage', updateLocation);

        // Also listen for custom events that might be dispatched by location modal
        window.addEventListener('locationChanged', updateLocation);

        return () => {
            window.removeEventListener('storage', updateLocation);
            window.removeEventListener('locationChanged', updateLocation);
        };
    }, []);

    const fetchData = useCallback(() => {
        // Use location state instead of reading from localStorage
        const lat = location.lat;
        const lng = location.lng;
        const modeParam = `mode=${deliveryMode}`;

        // Build query string from active filters
        const params = new URLSearchParams();
        params.set('mode', deliveryMode);
        if (sameDayActive) params.set('same_day', '1');
        if (activeFilters['Distance'] && activeFilters['Distance'] !== 'Any') {
            const km = activeFilters['Distance'].match(/\d+/)?.[0];
            if (km) params.set('radius', km);
        }
        if (activeFilters['Ready In'] && activeFilters['Ready In'] !== 'Any') {
            const mins = activeFilters['Ready In'] === '15 min' ? 15
                : activeFilters['Ready In'] === '30 min' ? 30
                    : activeFilters['Ready In'] === '1 hour' ? 60
                        : activeFilters['Ready In'] === '2 hours' ? 120 : null;
            if (mins) params.set('ready_in', mins);
        }
        if (activeFilters['Brand'] && activeFilters['Brand'] !== 'All brands') {
            params.set('brand', activeFilters['Brand']);
        }
        if (activeFilters['Storage'] && activeFilters['Storage'] !== 'Any') {
            params.set('storage', activeFilters['Storage']);
        }
        if (activeFilters['Colour'] && activeFilters['Colour'] !== 'Any') {
            params.set('colour', activeFilters['Colour']);
        }
        if (activeFilters['Condition'] && activeFilters['Condition'] !== 'Any') {
            params.set('condition', activeFilters['Condition']);
        }
        if (activeFilters['Price'] && activeFilters['Price'] !== 'Any') {
            const priceMap = {
                'Under £100': { max: 100 },
                '£100–£500': { min: 100, max: 500 },
                '£500–£1000': { min: 500, max: 1000 },
                'Over £1000': { min: 1000 },
            };
            const range = priceMap[activeFilters['Price']];
            if (range?.min) params.set('price_min', range.min);
            if (range?.max) params.set('price_max', range.max);
        }
        if (activeFilters['Sort']) {
            const sortMap = {
                'Lowest price': 'price_asc',
                'Highest price': 'price_desc',
                'Distance': 'distance',
                'Ready soon': 'ready_asc',
                'Relevance': 'relevance',
            };
            const sort = sortMap[activeFilters['Sort']];
            if (sort && sort !== 'relevance') params.set('sort', sort);
        }

        const qs = params.toString();

        // Fetch products
        let productsUrl = lat && lng
            ? `/products/getNearbyProducts?lat=${lat}&lng=${lng}&${qs}`
            : `/products/getAllProducts?${qs}`;
        getProducts(productsUrl);

        // Fetch stores
        let storesUrl = lat && lng
            ? `/stores/getAllStores?${qs}&lat=${lat}&lng=${lng}`
            : `/stores/getAllStores?${qs}`;
        getStores(storesUrl);
    }, [deliveryMode, sameDayActive, activeFilters, getProducts, getStores, location.lat, location.lng]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFilterChange = (key, value) => {
        setActiveFilters((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="flex flex-col min-h-screen w-full">
            <header className="flex-shrink-0">
                <Topheader />
                <DesktopNav burgerOpen={burgerOpen} setBurgerOpen={setBurgerOpen} />
            </header>
            <main className="flex-grow">
                <BurgerMenu burgerOpen={burgerOpen} setBurgerOpen={setBurgerOpen} />
                <OrderCutoffBar />
                <Stocksection />
                <Filters
                    sameDayActive={sameDayActive}
                    onSameDayChange={setSameDayActive}
                    onFilterChange={handleFilterChange}
                    onClearFilters={() => {
                        setSameDayActive(false);
                        setActiveFilters({});
                    }}
                />
                <ShopCategory />
                <TrendingNearYou
                    products={products?.data || []}
                    loading={productsLoading}
                    activeFilters={activeFilters}
                    sameDayActive={sameDayActive}
                    onProductView={handleProductView}
                />

                {isAuthenticated && (
                    <PersonalizedFeed onProductView={handleProductView} allProducts={products?.data || []} />
                )}

                <NearStoreSection stores={stores?.data || []} loading={storesLoading} />

                {isAuthenticated && recentlyViewed.length > 0 && (
                    <ProductSection
                        title="Recently Viewed"
                        products={recentlyViewed}
                        onProductView={handleProductView}
                        viewAllHref="/products?section=recently-viewed"
                    />
                )}

                <WarrantyCards />
            </main>
            <Footer />
            <ProfileDrawer />
        </div>
    );
}
