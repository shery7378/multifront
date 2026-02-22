//src/components/EmptyState.jsx
'use client';
import Image from 'next/image';
import Button from './UI/Button';
import { useRouter } from 'next/navigation';

export default function EmptyState({ 
    title, 
    description, 
    buttonText, 
    buttonHref, 
    imageSrc = '/images/no-orders-yet.png' 
}) {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-oxford-blue px-6">
            <div className="w-full max-w-[320px] flex flex-col items-center text-center">
                {/* Illustration */}
                <div className="relative w-full max-w-[280px] mb-6">
                    <img
                        src={`${process.env.NEXT_PUBLIC_API_URL}${imageSrc.startsWith('/') ? '' : '/'}${imageSrc}`} 
                        alt={title}
                        className="w-full h-auto object-contain mx-auto"
                        onError={(e) => { e.target.src = '/images/NoImageLong.jpg'; }}
                    />
                </div>

                {/* Text Content */}
                <div className="mb-8">
                    <h2 className="text-xl sm:text-2xl text-oxford-blue font-bold mb-3">
                        {title}
                    </h2>
                    <p className="text-sm text-gray-500 max-w-[260px] mx-auto leading-relaxed">
                        {description}
                    </p>
                </div>

                {/* Button */}
                {buttonText && buttonHref && (
                    <Button
                        variant="primary"
                        className="w-full py-3.5 rounded-xl font-medium shadow-lg shadow-vivid-red/20 active:scale-95 transition-transform"
                        onClick={() => router.push(buttonHref)}
                    >
                        {buttonText}
                    </Button>
                )}
            </div>
        </div>
    );
}
