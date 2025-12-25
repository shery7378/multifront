//src/components/MoreToExplore.jsx
"use client";

import ResponsiveText from "./UI/ResponsiveText";
import { AnimatePresence } from "framer-motion";
import StoreCard from "./StoreCard";

export default function MoreToExplore({ title = "More To Explore", stores }) {
    console.log(stores, 'stores from more to explore');
    
    // Ensure stores is an array
    const storesArray = Array.isArray(stores) ? stores : [];
    
    return (
        <div className="py-4">
            <div className="mx-auto">
                <div className="flex justify-between items-center mb-4 ">
                    <ResponsiveText as="h2" minSize="1rem" maxSize="1.375rem" className="font-semibold text-oxford-blue">
                        {title}
                    </ResponsiveText>
                    {/* <a href="#" className="">
                        <ResponsiveText as="span" minSize="0.8rem" maxSize="1rem" className="font-semibold text-vivid-red">
                            View All
                        </ResponsiveText>
                    </a> */}
                </div>
                {storesArray.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>No stores available to explore.</p>
                        <p className="text-sm mt-2">Add stores to your favorites to see them here.</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Custom scrollbar container */}
                        <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide md:scrollbar-default">
                            {/* Snap scrolling container */}
                            <div className="flex gap-4 w-max min-w-full snap-x snap-mandatory">
                                <AnimatePresence initial={false}>
                                    {storesArray.map((store, index) => (
                                        <div
                                            key={store?.id || store?.slug || store?.name || index}
                                            className="flex-shrink-0 w-[280px] snap-start"
                                        >
                                            <StoreCard
                                                index={index}
                                                id={store.id}
                                                name={store.name}
                                                slug={store.slug}
                                                rating={store.rating}
                                                deliveryTime={store.deliveryTime || store.delivery_time_text}
                                                offer={store.offer}
                                                award={store.award}
                                                choice={store.choice}
                                                cuisine={store.cuisine}
                                                note={store.note}
                                                logo={store.logo || store.image}
                                                user_id={store.user_id}
                                            />
                                        </div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}
