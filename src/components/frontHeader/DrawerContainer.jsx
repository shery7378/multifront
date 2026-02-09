// src/components/frontHeader/DrawerContainer.jsx
'use client';

import Drawer from '@/components/UI/Drawer';
import LeftDrawer from '@/components/UI/LeftDrawer';
import RightDrawer from '@/components/UI/RightDrawer';
import PickUpMap from '@/components/PickUpMap';
import CloseXButton from '@/components/UI/CloseXButton';

export default function DrawerContainer({
  isDrawerOpen,
  setDrawerOpen,
  isRightDrawerOpen,
  handleCloseRightDrawer,
  isAuthenticated = false,
}) {
  return (
    <>
      <Drawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)}>
        <h2 className="text-xl font-semibold mb-4">Drawer Content</h2>
        <p>This is a slide-in drawer menu.</p>
      </Drawer>
      <LeftDrawer />
      {/* Only show RightDrawer (auth sidebar) when user is NOT authenticated */}
      {!isAuthenticated && (
        <RightDrawer
          isOpen={isRightDrawerOpen}
          onClose={handleCloseRightDrawer}
          initialOpenState={false}
          width={320}
          storageKey="right_drawer_state"
        >
          <div className="p-4 min-h-screen flex flex-col">
            {/* Header with centered brand and close */}
            <div className="relative mb-6">
<h2 className="text-sm font-[bricle] text-vivid-red text-center">MultiKonnect</h2>
              <div className="absolute right-0 top-0">
                <CloseXButton onClick={handleCloseRightDrawer} />
              </div>
            </div>

            {/* Auth buttons */}
            <div className="space-y-3">
              <a href="/sign-up" className="block w-full bg-[#F24E2E] text-white text-center h-11 leading-[44px] rounded-md hover:brightness-110">Sign up</a>
              <a href="/sign-in" className="block w-full bg-gray-100 text-slate-900 text-center h-11 leading-[44px] rounded-md">log in</a>
            </div>

            {/* Links */}
            <div className="mt-6 space-y-3 text-sm">
              <a href="/sign-up" className="text-blue-600 underline">Create a Seller Account</a>
              <div>
                <a href="/sign-up" className="text-blue-600 underline">Add your Shop</a>
              </div>
            </div>

            <div className="mt-auto" />
          </div>
        </RightDrawer>
      )}
    </>
  );
}