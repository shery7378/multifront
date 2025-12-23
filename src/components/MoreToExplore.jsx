//src/components/MoreToExplore.jsx
"use client";

import ResponsiveText from "./UI/ResponsiveText";
import { AnimatePresence } from "framer-motion";
import StoreCard from "./StoreCard";

export default function MoreToExplore({ title = "More To Explore", stores }) {
    console.log(stores, 'stores from more to explore');
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
                <div className="relative">
                    {/* Custom scrollbar container */}
                    <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide md:scrollbar-default">
                        {/* Snap scrolling container */}
                        <div className="flex gap-4 w-max min-w-full snap-x snap-mandatory">
                            <AnimatePresence initial={false}>
                                {stores.map((store, index) => (
                                    <div
                                        key={store.name}
                                        className="flex-shrink-0 w-[280px] snap-start"
                                    >
                                        <StoreCard
                                            index={index}
                                            name={store.name}
                                            slug={store.slug}
                                            rating={store.rating}
                                            deliveryTime={store.deliveryTime}
                                            offer={store.offer}
                                            award={store.award}
                                            choice={store.choice}
                                            cuisine={store.cuisine}
                                            note={store.note}
                                            logo={store.logo}
                                            user_id={store.user_id}
                                        />
                                    </div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
