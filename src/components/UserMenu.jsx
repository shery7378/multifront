//src/components/UserMenu.jsx
'use client';
import { useEffect } from 'react';
import Image from 'next/image'; // For optimized image handling in Next.js
import Link from 'next/link';
import {
    FaReceipt,
    FaHeart,
    FaCircleQuestion,
    FaBullhorn,
    FaGift,
    FaRightFromBracket,
    FaStar,
    FaTag,
    FaArrowRotateLeft,
} from 'react-icons/fa6'; // Import Font Awesome 6 icons
import Button from './UI/Button';
import { usePromotionsModal } from '@/contexts/PromotionsModalContext';

export default function UserMenu({ user, handleLogout }) {
    // Default handleLogout if not provided
    const defaultHandleLogout = () => {
        console.warn('handleLogout not provided to UserMenu');
    };
    
    const logoutHandler = handleLogout || defaultHandleLogout;
    const { openModal } = usePromotionsModal();
    
    // Log user changes for debugging and listen for profile updates
    useEffect(() => {
        if (user) {
            console.log('UserMenu - User object changed:', {
                userId: user.id,
                userName: user.name,
                userImage: user.image,
                profileImage: user.profile?.image,
                timestamp: new Date().toISOString()
            });
        }
    }, [user?.id, user?.image, user?.profile?.image]);
    
    // Listen for profile update events to force re-render
    useEffect(() => {
        const handleProfileUpdate = (event) => {
            console.log('UserMenu - Received profile update event:', event.detail);
            // Force component to re-render by updating state if needed
            // The user prop will update from Redux automatically
        };
        
        window.addEventListener('userProfileUpdated', handleProfileUpdate);
        return () => {
            window.removeEventListener('userProfileUpdated', handleProfileUpdate);
        };
    }, []);
    
    const menuItems = [
        { icon: FaReceipt, label: 'Orders', href: '/orders' },
        { icon: FaArrowRotateLeft, label: 'Refund Requests', href: '/refund-requests' },
        { icon: FaStar, label: 'To Review', href: '/to-review' },
        { icon: FaHeart, label: 'Favorites', href: '/favorites' },
        { icon: FaTag, label: 'My Coupons', href: '/coupons' },
        { icon: FaCircleQuestion, label: 'Help', href: '/#' },
        { icon: FaBullhorn, label: 'Promotions', href: '/#' },
        { icon: FaGift, label: 'Invite Friends', href: '/user-account?tab=Referrals' },
        { icon: FaRightFromBracket, label: 'Sign out', href: '/' },
    ];

    return (
        <>
            {/* User Profile */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 overflow-hidden rounded-full">
                        {(() => {
                            // Check all possible paths for the image
                            // Priority: user.image (merged from profile), then user.profile.image, then user.data paths
                            const imagePath = 
                                user?.image ||                     // Direct image (merged from profile)
                                user?.profile?.image ||            // Direct profile
                                user?.data?.profile?.image ||      // customer-profile API response (if not merged)
                                user?.data?.user?.profile?.image || // nested user.profile
                                null;
                            
                            // Debug logging
                            if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
                                console.log('UserMenu - Image lookup:', {
                                    userId: user?.id,
                                    userImage: user?.image,
                                    profileImage: user?.profile?.image,
                                    dataProfileImage: user?.data?.profile?.image,
                                    finalImagePath: imagePath,
                                    userKeys: user ? Object.keys(user) : []
                                });
                            }
                            
                            const imageUrl = imagePath 
                                ? (imagePath.startsWith('http') 
                                    ? imagePath 
                                    : `${process.env.NEXT_PUBLIC_API_URL}/${imagePath.replace(/^\//, '')}`)
                                : '/images/profile/profile.png';
                            
                            // Use a key that includes the image path to force re-render when image changes
                            // Include user ID and image path to ensure re-render when either changes
                            const imageKey = `user-${user?.id}-img-${imagePath || 'default'}`;
                            
                            return (
                                <img
                                    key={imageKey} // Force re-render when image path changes
                                    src={imageUrl}
                                    alt="User profile"
                                    width={48}
                                    height={48}
                                    className="object-cover"
                                    onError={(e) => {
                                        // Fallback to default image if load fails
                                        console.warn('UserMenu - Image failed to load:', imageUrl);
                                        e.target.src = '/images/profile/profile.png';
                                    }}
                                    onLoad={() => {
                                        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
                                            console.log('UserMenu - Image loaded successfully:', imageUrl);
                                        }
                                    }}
                                />
                            );
                        })()}
                    </div>
                    <div>
                        <p className="text-2xl font-medium text-oxford-blue">
                            {(() => {
                                const firstName = user?.data?.profile?.first_name || user?.data?.user?.profile?.first_name;
                                const lastName = user?.data?.profile?.last_name || user?.data?.user?.profile?.last_name;
                                const name = user?.data?.user?.name || user?.name;
                                
                                if (firstName && lastName) {
                                    return `${firstName} ${lastName}`;
                                }
                                return name || 'Guest';
                            })()}
                        </p>
                        <a href="/user-account" className="text-xl text-vivid-red hover:underline">
                            Manage account
                        </a>
                    </div>
                </div>
            </div>

            {/* Menu Items (Scrollable Section) */}
            <nav className="flex-1 p-2 overflow-y-auto">
                {menuItems.map((item) => {
                    // Use Link for internal routes, anchor for external or special cases
                    const isSignOut = item.label === 'Sign out';
                    const isPromotions = item.label === 'Promotions';
                    const isExternal = item.href.startsWith('#') || item.href.startsWith('http');
                    
                    const content = (
                        <>
                            <item.icon className="h-5 w-5 text-vivid-red flex-shrink-0" />
                            <span className="font-medium text-xl text-oxford-blue">{item.label}</span>
                        </>
                    );

                    if (isSignOut) {
                    return (
                        <button
                            key={item.label}
                            onClick={(e) => {
                                e.preventDefault();
                                logoutHandler();
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-md transition-colors text-left"
                        >
                            {content}
                        </button>
                    );
                    }

                    if (isPromotions) {
                        return (
                            <button
                                key={item.label}
                                onClick={(e) => {
                                    e.preventDefault();
                                    openModal();
                                }}
                                className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-md transition-colors text-left"
                            >
                                {content}
                            </button>
                        );
                    }

                    if (isExternal) {
                        return (
                            <a
                                key={item.label}
                                href={item.href}
                                className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                {content}
                            </a>
                        );
                    }

                    // Internal Next.js routes (Orders, To Review, Favorites, My Coupons)
                    // Ensure href is relative and doesn't start with http
                    const internalHref = item.href.startsWith('/') ? item.href : `/${item.href}`;
                    
                    return (
                        <Link
                            key={item.label}
                            href={internalHref}
                            prefetch={true}
                            className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            {content}
                        </Link>
                    );
                })}
            </nav>

            {/* Buttons (Fixed at Bottom) */}
            <div className="p-4 border-t border-gray-200">
                <Button variant="primary" fullWidth className="rounded-md h-[60px] mb-2">
                    Create a Business Account
                </Button>
                <Button variant="secondary" fullWidth className="rounded-md h-[60px]">
                    Sign up Seller
                </Button>
            </div>
        </>
    );
}