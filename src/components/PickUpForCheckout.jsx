//src/components/PickUpForCheckout.jsx
import React from 'react';
import IconButton from './UI/IconButton';
import { PiMapPinLight } from "react-icons/pi";
import Image from 'next/image';

export default function PickUpForCheckout() {
    return (
        <>
            {/* Map Image Section */}
            <div className="w-full mb-4">
                <Image
                    src="/images/checkout-map.jpg" // Replace with actual image path
                    alt="Map of pickup location"
                    width={600} // Adjust width as needed
                    height={300} // Adjust height as needed
                    className="w-full h-auto object-cover rounded-md"
                />
            </div>

            {/* Pickup Location Details */}
            <div className="flex items-center space-x-2 ">
                <span className="w-8 inline-block">
                    <IconButton icon={PiMapPinLight} iconClasses="!text-black " />
                </span>
                <div>
                    <span className="block font-semibold text-sm text-oxford-blue">Sambal Express</span>
                    <span className="text-sm text-oxford-blue/60">28/32 High Street North,</span>
                </div>
            </div>
        </>
    );
}