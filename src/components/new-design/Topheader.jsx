'use client';

import Image from 'next/image';
import { HiShoppingCart } from 'react-icons/hi';

const items = [
    { text: 'Same - Day In Your Area' },
    { text: 'QC-Verified Sellers' },
    { text: 'Free 1-Year Accessory Shield' },
    { text: 'Easy Returns' },
];

export default function Topheader() {
    return (
        <header className="w-full bg-[#F44322]">
            {/* Thin blue strip */}
           

            <div className="container mx-auto">
                <div
                    className="w-full flex flex-wrap items-center justify-center gap-x-6 gap-y-3 px-4 h-[87px] lg:gap-[53px] md:gap-10 sm:px-6 md:px-8"
                 >
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2.5 shrink-0"
                        >
                            {/* Icon in white circle */}
                            <span
                                className="flex items-center w-[47px] h-[47px] justify-center shrink-0 rounded-full border border-[#EAEAEA]"
                            >
                                <Image src={'/images/new-icons/mynaui_cart-solid.svg'} alt="cart" width={20.5} height={20.5} className="text-white w-[20.50px] h-[20.50px]" />
                            </span>
                            {/* Text */}
                            <span
                                className="text-base text-white font-normal whitespace-nowrap sm:whitespace-normal"
                             >
                                {item.text}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </header>
    );
}
