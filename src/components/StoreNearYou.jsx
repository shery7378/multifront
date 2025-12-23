"use client";

import { useEffect, useState } from "react";
import ResponsiveText from "./UI/ResponsiveText";
import { motion, AnimatePresence } from "framer-motion";
import Button from "./UI/Button";
import StoreCard from "./StoreCard";
import Link from 'next/link';
import { useI18n } from '@/contexts/I18nContext';

export default function StoreNearYou({ stores = [], title = "Store Near You", viewAllHref = '#' }) {
  const { t } = useI18n();

    const [visibleCount, setVisibleCount] = useState(4); // default to 4
    const [isLoading, setIsLoading] = useState(false);

    console.log(stores, 'stores from page');
    const showAll = visibleCount >= stores.length;

    const toggleStoreView = () => {
        setIsLoading(true);
        const storesToAnimate = showAll ? stores.length - 4 : 4;
        const animationDuration = 300 + (storesToAnimate - 1) * 150;
        setTimeout(() => {
            setVisibleCount(showAll ? 4 : stores.length);
            setIsLoading(false);
        }, animationDuration);
    };

    // Update visible count based on screen size AFTER component mounts
    useEffect(() => {
        const updateVisibleCount = () => {
            if (window.innerWidth < 768) {
                setVisibleCount(4);
            } else {
                setVisibleCount(stores.length);
            }
        };

        updateVisibleCount();
        window.addEventListener("resize", updateVisibleCount);
        return () => window.removeEventListener("resize", updateVisibleCount);
    }, [stores.length]);

    return (
        <div className="py-4">
            <div className="">
                <div className="flex justify-between items-baseline mb-4">
                    <ResponsiveText as="h2" minSize="1rem" maxSize="1.375rem" className="font-semibold text-oxford-blue">
                        {title}
                    </ResponsiveText>
                    <Link href={viewAllHref}>
                        <ResponsiveText as="span" minSize="0.8rem" maxSize="1rem" className="font-semibold text-vivid-red">
                            {t('product.viewAll')}
                        </ResponsiveText>
                    </Link>
                </div>

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

                {stores.length > 4 && (
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
