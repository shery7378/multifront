//src/components/CouponEmptyState.jsx
'use client';
import Image from 'next/image';
import Button from './UI/Button';
import { useRouter } from 'next/navigation';

export default function CouponEmptyState({ activeTab = 'available' }) {
    const router = useRouter();

    const handleFindProducts = () => {
        router.push('/home');
    };

    const getContent = () => {
        switch (activeTab) {
            case 'used':
                return {
                    title: 'No Used Coupons Yet',
                    message: "You haven't used any coupons yet. Your used coupons will appear here."
                };
            case 'expired':
                return {
                    title: 'No Expired Coupons',
                    message: "You don't have any expired coupons."
                };
            case 'available':
            default:
                return {
                    title: 'No Coupons Yet',
                    message: "When you receive your first coupon, it will appear here."
                };
        }
    };

    const { title, message } = getContent();

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-oxford-blue px-6 py-10">
            <div className="w-full max-w-[320px] flex flex-col items-center text-center">
                {/* Illustration */}
                <div className="relative w-full max-w-[280px] mb-6">
                    <img
                        src={`${process.env.NEXT_PUBLIC_API_URL}/storage/images/no-orders-yet.png`} 
                        alt="No coupons illustration"
                        className="w-full h-auto object-contain mx-auto"
                    />
                </div>

                {/* Text Content */}
                <div className="mb-8">
                    <h2 className="text-xl sm:text-2xl text-oxford-blue font-bold mb-3">
                        {title}
                    </h2>
                    <p className="text-sm text-gray-500 max-w-[260px] mx-auto leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Button - only show for available tab as it's actionable to go shop even if no coupons, 
                   but usually users want to find coupons. For now, let's just keep it simple or generic. 
                   If 'available' is empty, maybe they want to shop to earn them? 
                   Let's leave button out to match the previous user request style, or add if requested.
                   User image showed no button, so I will omit it for now.
                */}
            </div>
        </div>
    );
}
