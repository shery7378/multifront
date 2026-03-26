// src/components/frontHeader/DrawerContainer.jsx
'use client';

import Drawer from '@/components/UI/Drawer';
import LeftDrawer from '@/components/UI/LeftDrawer';
import RightDrawer from '@/components/UI/RightDrawer';
import CloseXButton from '@/components/UI/CloseXButton';
import { getStorageUrl } from '@/utils/urlHelpers';
import UserMenu from '@/components/UserMenu';
import { useSelector } from 'react-redux';
import { useLogout } from '@/controller/logoutController';

export default function DrawerContainer({
  isDrawerOpen,
  setDrawerOpen,
  isRightDrawerOpen,
  handleCloseRightDrawer,
  isAuthenticated = false,
}) {
  console.log('DrawerContainer Rendering, isRightDrawerOpen:', isRightDrawerOpen, 'isAuthenticated:', isAuthenticated);
  return (
    <>
      <Drawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)}>
        <h2 className="text-xl font-semibold mb-4">Drawer Content</h2>
        <p>This is a slide-in drawer menu.</p>
      </Drawer>
      <LeftDrawer />
      
      {/* RightDrawer - Show auth sidebar for guest, or UserMenu for logged in users */}
      <RightDrawer
        isOpen={isRightDrawerOpen}
        onClose={handleCloseRightDrawer}
        initialOpenState={false}
        width={350}
        storageKey="right_drawer_state"
      >
        <div className="p-4 min-h-screen flex flex-col">
          {/* Header with centered brand and close */}
          <div className="relative mb-6">
            <img 
              src={getStorageUrl('/storage/images/logo/MultiKonnect Hero.png')}
              alt="MultiKonnect" 
              className="h-6 w-auto object-contain mx-auto"
            />
            <div className="absolute right-1 top-0">
              <CloseXButton onClick={handleCloseRightDrawer} />
            </div>
          </div>

          {!isAuthenticated ? (
            <div className="space-y-3">
              <a href="/sign-up" className="block w-full bg-[#F24E2E] text-white text-center h-11 leading-[44px] rounded-md hover:brightness-110">Sign up</a>
              <a href="/sign-in" className="block w-full bg-gray-100 text-slate-900 text-center h-11 leading-[44px] rounded-md">Log in</a>
              
              <div className="mt-6 space-y-3 text-sm">
                <a href="/sign-up" className="text-blue-600 underline">Create a Seller Account</a>
                <div>
                  <a href="/sign-up" className="text-blue-600 underline">Add your Shop</a>
                </div>
              </div>
            </div>
          ) : (
             <div className="overflow-auto flex-1 no-scrollbar">
                <UserMenuDrawerContent />
             </div>
          )}

          <div className="mt-auto" />
        </div>
      </RightDrawer>
    </>
  );
}

function UserMenuDrawerContent() {
    const { user } = useSelector((state) => state.auth);
    const { handleLogout } = useLogout();
    console.log('UserMenuDrawerContent rendering, user found:', !!user);
    return (
        <UserMenu 
            user={user} 
            handleLogout={handleLogout}
        />
    );
}