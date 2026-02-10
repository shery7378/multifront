"use client";

import { useEffect, useState } from "react";
import ResponsiveText from "./UI/ResponsiveText";
import { motion, AnimatePresence } from "framer-motion";
import Button from "./UI/Button";
import StoreCard from "./StoreCard";
import Link from 'next/link';
import { useI18n } from '@/contexts/I18nContext';

export default function StoreNearYou({ stores = [], title = "Store Near You", viewAllHref = '#', maxStores = 8 }) {
  const { t } = useI18n();

    const [visibleCount, setVisibleCount] = useState(maxStores); // default to maxStores
    const [isLoading, setIsLoading] = useState(false);

    const showAll = visibleCount >= stores.length;

    const toggleStoreView = () => {
        setIsLoading(true);
        const storesToAnimate = showAll ? stores.length - maxStores : maxStores;
        const animationDuration = 300 + (storesToAnimate - 1) * 150;
        setTimeout(() => {
            setVisibleCount(showAll ? maxStores : stores.length);
            setIsLoading(false);
        }, animationDuration);
    };

    // Update visible count based on screen size AFTER component mounts
    useEffect(() => {
        const updateVisibleCount = () => {
            if (window.innerWidth < 768) {
                setVisibleCount(4);
            } else {
                setVisibleCount(maxStores);
            }
        };

        updateVisibleCount();
        window.addEventListener("resize", updateVisibleCount);
        return () => window.removeEventListener("resize", updateVisibleCount);
    }, [stores.length, maxStores]);

    return (
        <div className="py-4">
            <div className="">
                <div className="flex justify-between items-baseline mb-4">
                    <ResponsiveText as="h2" minSize="1.375rem" maxSize="1.375rem" className="font-bold text-oxford-blue" style={{ fontSize: '22px', lineHeight: '28px', fontWeight: '700' }}>
                        {title}
                    </ResponsiveText>
                    <Link href={viewAllHref}>
                        <ResponsiveText as="span" minSize="0.8rem" maxSize="1rem" className="font-semibold text-vivid-red">
                            {t('product.viewAll')}
                        </ResponsiveText>
                    </Link>
                </div>

                {/* White divider line */}
                <div className="w-full h-px bg-white my-4"></div>

                <div className="overflow-x-auto sm:overflow-visible">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <AnimatePresence initial={false}>
                            {stores.slice(0, visibleCount).map((store, index) => (
                                <StoreCard
                                    key={store.id || store.name}
                                    index={index}
                                    id={store.id}
                                    name={store.name}
                                    slug={store.slug}
                                    rating={store.rating}
                                    deliveryTime={store.deliveryTime}
                                    prepTime={store.prepTime || store.preparation_time}
                                    offer={store.offer}
                                    award={store.award}
                                    choice={store.choice}
                                    cuisine={store.cuisine}
                                    note={store.note}
                                    logo={store.logo}
                                    user_id={store.user_id || null}
                                    offersPickup={store.offers_pickup || store.offersPickup}
                                    offersDelivery={store.offers_delivery || store.offersDelivery}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {stores.length > maxStores && (
                    <div className="flex justify-center mt-4 md:hidden">
                        <Button
                            fullWidth
                            isLoading={isLoading}
                            onClick={toggleStoreView}
                            className="bg-vivid-red text-white px-4 py-2 rounded-md font-semibold cursor-pointer w-full"
                        >
                            {showAll ? t('product.showLess') : t('product.showMore')}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
