'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import Topheader from '@/components/new-design/Topheader';
import DesktopNavNew from '@/components/new-design/DesktopNavNew';
import OrderCutoffBar from '@/components/new-design/OrderCutoffBar';
import ShopCategory from '@/components/new-design/ShopCategory';
import Stocksection from '@/components/new-design/Stocksection';
import Filters from '@/components/new-design/Filters';
import TrendingNearYou from '@/components/new-design/TrendingNearYou';
import WarrantyCards from '@/components/new-design/WarrantyCards';
import Footer from '@/components/Footer';
import NearStoreSection from '@/components/new-design/NearStoreSection';
import { useGetRequest } from '@/controller/getRequests';

export default function NewHomePage() {
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

    // Filter state
    const [sameDayActive, setSameDayActive] = useState(false);
    const [activeFilters, setActiveFilters] = useState({});

    const fetchData = useCallback(() => {
        const lat = localStorage.getItem('lat');
        const lng = localStorage.getItem('lng');
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
    }, [deliveryMode, sameDayActive, activeFilters, getProducts, getStores]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFilterChange = (key, value) => {
        setActiveFilters((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div>
            <Topheader />
            <DesktopNavNew />
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
            />
            <NearStoreSection stores={stores?.data || []} loading={storesLoading} />

            <WarrantyCards />
            <Footer />
        </div>
    );
}
