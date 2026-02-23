'use client';

import Image from 'next/image';

const items = [
    { text: 'Same - Day In Your Area' },
    { text: 'QC-Verified Sellers' },
    { text: 'Free 1-Year Accessory Shield' },
    { text: 'Easy Returns' },
];

export default function Topheader() {
    return (
        <header className="w-full bg-[#F44322]">
            <div className="container mx-auto px-4 sm:px-6 md:px-8">

                {/* ── MOBILE (< sm): horizontal swipeable slider ── */}
                <div className="sm:hidden overflow-x-auto scrollbar-hide px-4 py-4">
                    <div className="flex items-center gap-4 w-max">
                        {items.map((item, index) => (
                            <div key={index} className="flex items-center gap-2.5 shrink-0">
                                <span className="flex items-center justify-center w-[38px] h-[38px] shrink-0 rounded-full border border-white/40">
                                    <Image
                                        src="/images/new-icons/mynaui_cart-solid.svg"
                                        alt="cart"
                                        width={16}
                                        height={16}
                                    />
                                </span>
                                <span className="text-sm text-white font-normal whitespace-nowrap">
                                    {item.text}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── TABLET (sm – lg): 2 rows of 2, centered ── */}
                <div className="hidden sm:grid lg:hidden grid-cols-2 gap-x-8 gap-y-3 py-4 max-w-lg mx-auto">
                    {items.map((item, index) => (
                        <div key={index} className="flex items-center gap-2.5">
                            <span className="flex items-center justify-center w-[42px] h-[42px] shrink-0 rounded-full border border-white/40">
                                <Image
                                    src="/images/new-icons/mynaui_cart-solid.svg"
                                    alt="cart"
                                    width={18}
                                    height={18}
                                />
                            </span>
                            <span className="text-sm text-white font-normal leading-tight">
                                {item.text}
                            </span>
                        </div>
                    ))}
                </div>

                {/* ── DESKTOP (≥ lg): single row ── */}
                <div className="hidden lg:flex items-center justify-center gap-[53px] h-[87px]">
                    {items.map((item, index) => (
                        <div key={index} className="flex items-center gap-2.5 shrink-0">
                            <span className="flex items-center justify-center w-[47px] h-[47px] shrink-0 rounded-full border border-[#EAEAEA]">
                                <Image
                                    src="/images/new-icons/mynaui_cart-solid.svg"
                                    alt="cart"
                                    width={20.5}
                                    height={20.5}
                                    className="w-[20.50px] h-[20.50px]"
                                />
                            </span>
                            <span className="text-base text-white font-normal whitespace-nowrap">
                                {item.text}
                            </span>
                        </div>
                    ))}
                </div>

            </div>
        </header>
    );
}