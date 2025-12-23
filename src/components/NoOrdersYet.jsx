//src/components/NoOrdersYet.jsx
'use client';
import Image from 'next/image';
import Button from './UI/Button';
import { useRouter } from 'next/navigation';

export default function NoOrdersYet() {
    const router = useRouter();

    const handleFindProducts = () => {
        router.push('/home');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh]  text-oxford-blue px-6">
            <div className="w-[320]">
                {/* Illustration */}
                <div className="relative w-full max-w-md ">
                    <Image
                        src="/images/no-orders-yet.png" // Replace with actual image path
                        alt="No orders yet illustration"
                        width={300}
                        height={300}
                        className="object-contain"
                    />
                </div>

                {/* Text Content */}
                <div className="text-center">
                    <h2 className="text-xl text-oxford-blue font-semibold mb-2">No orders yet</h2>
                    <p className="text-xs text-oxford-blue/60 mb-6">
                        When you place your first order, it will appear here
                    </p>
                </div>

                {/* Button */}
                <Button
                    variant="primary"
                    className="w-full max-w-xs py-3 text-white rounded-md"
                    onClick={handleFindProducts} // Add onClick handler
                >
                    Find Products
                </Button>
            </div>
        </div>
    );
}