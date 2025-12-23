//src/components/UserMenu.jsx
'use client';
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

export default function UserMenu({ user, handleLogout }) {
    // Default handleLogout if not provided
    const defaultHandleLogout = () => {
        console.warn('handleLogout not provided to UserMenu');
    };
    
    const logoutHandler = handleLogout || defaultHandleLogout;
    
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
                        <img
                            src={`${user?.image ? process.env.NEXT_PUBLIC_API_URL + '/' + user?.image : '/images/profile/profile.png'}`}
                            alt="User profile"
                            width={48}
                            height={48}
                            className="object-cover"
                        />
                    </div>
                    <div>
                        <p className="text-2xl font-medium text-oxford-blue">{user?.name ? user.name : 'Guest'}</p>
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