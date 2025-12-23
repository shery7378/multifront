//src/components/UI/ProfileDrawer.jsx
'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import Drawer from './Drawer';
import DrawerToggle from './DrawerToggle';
import UserMenu from '@/components/UserMenu';
import { useLoadAuth } from '@/hooks/useLoadAuth';
import { useLogout } from '@/controller/logoutController';

const STORAGE_KEY = 'drawer_open_state';

export default function ProfileDrawer() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const { handleLogout } = useLogout();
    useLoadAuth(); // Load auth state from localStorage
    // const [menuItems, setMenuItems] = useState([]);

    // useEffect(() => {
    //     fetch('/api/menu')
    //         .then((res) => res.json())
    //         .then((data) => setMenuItems(data));
    // }, []);

    const menuItems = [
        { label: 'Home', href: '/home' },
        { label: 'Store', href: '/store' },
    ];

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'true') setIsOpen(true);
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, isOpen.toString());
    }, [isOpen]);

    useEffect(() => {
        setIsOpen(false); // Auto-close on route change
    }, [pathname]);

    return (
        <>
            <DrawerToggle isOpen={isOpen} toggle={() => setIsOpen((prev) => !prev)} />
            {/* for right side open */}
            {/* <DrawerToggle isOpen={isOpen} toggle={() => setIsOpen((prev) => !prev) } offset={-300} /> */}
            <Drawer
                isOpen={isOpen}
                onClose={setIsOpen}
                // position="right"
                position="left"
                width={300}
                swipeToOpen
            >

                <div className=" overflow-auto">
                    <UserMenu 
                        user={user} 
                        handleLogout={handleLogout}
                        onItemClick={() => setIsOpen(false)}
                    />
                </div>
            </Drawer>
        </>
    );
}