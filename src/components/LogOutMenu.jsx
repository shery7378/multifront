//src/components/LogOutMenu.jsx
'use client';
import Image from 'next/image'; // For optimized image handling in Next.js
import Button from './UI/Button';
import Link from 'next/link';

export default function LogOutMenu({ onLogIn }) {
    return (
        <>
            {/* Buttons (Fixed at Bottom) */}
            <div className="p-4 border-t border-gray-200">
                <Link href="/sign-up">
                    <Button variant="primary" fullWidth className="rounded-md h-[60px] mb-2">
                        Sign up
                    </Button>
                </Link>
                <Link href="/login">
                    <Button
                        variant="secondary"
                        fullWidth
                        className="rounded-md h-[60px]"
                        onClick={onLogIn}
                    >
                        Log In
                    </Button>
                </Link>
            </div>

            <div className="p-4 grid gap-3">
                <Link href={`${process.env.NEXT_PUBLIC_DASHBOARD_URL}/sign-up`} className="underline font-medium text-oxford-blue">Create a Seller Account</Link>
                <Link href={`${process.env.NEXT_PUBLIC_DASHBOARD_URL}/sign-in`} className="underline font-medium text-oxford-blue">Add your Shop</Link>
            </div>
        </>
    );
}