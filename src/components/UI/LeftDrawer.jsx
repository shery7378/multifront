//src/components/UI/LeftDrawer.jsx
'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import Drawer from './Drawer';
import DrawerToggle from './DrawerToggle';
import UserMenu from '@/components/UserMenu';
import LogOutMenu from '../LogOutMenu';
import { useLoadAuth } from '@/hooks/useLoadAuth';
import { useLogout } from '@/controller/logoutController';
import { getStorageUrl } from '@/utils/urlHelpers';

const STORAGE_KEY = 'drawer_open_state';

export default function LeftDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated } = useSelector((state) => state.auth); // Access auth state from Redux
  const { handleLogout } = useLogout();
  useLoadAuth(); // Load auth state from localStorage
console.log('User in LeftDrawer:', user);
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
      <Drawer
        isOpen={isOpen}
        onClose={setIsOpen}
        position="left"
        width={300}
        swipeToOpen
      >
        <div className="overflow-auto">
          <div className="flex flex-col min-h-[100dvh] overflow-auto bg-white shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-center p-4 border-b border-gray-200">
              <img 
                src={getStorageUrl('/storage/images/logo/MultiKonnect Hero.png')}
                alt="MultiKonnect" 
                className="h-6 w-auto object-contain"
              />
            </div>
            {isAuthenticated ? (
                <UserMenu 
                    user={user} 
                    handleLogout={handleLogout}
                    onItemClick={() => setIsOpen(false)}
                />
            ) : (
                <LogOutMenu />
            )}
          </div>
        </div>
      </Drawer>
    </>
  );
}