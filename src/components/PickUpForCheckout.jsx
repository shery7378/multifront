//src/components/PickUpForCheckout.jsx
import React from 'react';
import IconButton from './UI/IconButton';
import { PiMapPinLight } from "react-icons/pi";
import Image from 'next/image';

export default function PickUpForCheckout({ storesGrouped = {}, enhancedStores = {} }) {
    const storeIds = Object.keys(storesGrouped);
    
    return (
        <div className="space-y-6">
            {/* Map Image Section */}
            <div className="w-full mb-4">
                <Image
                    src="/images/checkout-map.jpg"
                    alt="Map of pickup location"
                    width={600}
                    height={200}
                    className="w-full h-[150px] object-cover rounded-xl"
                />
            </div>

            <div className="space-y-5">
                {storeIds.map(storeId => {
                    const storeGroup = storesGrouped[storeId];
                    const store = enhancedStores[storeId] || storeGroup?.store;
                    if (!store) return null;

                    // Calculate max ready_in_minutes for this store's items
                    const maxReadyMinutes = storeGroup.items.reduce((max, item) => {
                        const readyTime = parseInt(item.product?.ready_in_minutes || 0);
                        return Math.max(max, readyTime);
                    }, 0);

                    const address = store.full_address || store.address || "Address not available";

                    return (
                        <div key={storeId} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="mt-1">
                                <IconButton 
                                    icon={PiMapPinLight} 
                                    iconClasses="!text-vivid-red !w-5 !h-5" 
                                    className="bg-white shadow-sm"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="block font-bold text-sm text-oxford-blue truncate uppercase tracking-tight">
                                    {store.name}
                                </span>
                                <span className="text-xs text-sonic-silver block mb-2">
                                    {address}
                                </span>
                                
                                <div className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded-md text-[10px] font-bold uppercase tracking-wider border border-green-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                                    Ready {maxReadyMinutes > 0 ? `in ${maxReadyMinutes} mins` : "Now"}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}