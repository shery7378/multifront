// src/components/frontHeader/DrawerContainer.jsx
'use client';

import RightDrawer from '@/components/UI/RightDrawer';
import CloseXButton from '@/components/UI/CloseXButton';
import { getStorageUrl } from '@/utils/urlHelpers';
import UserMenu from '@/components/UserMenu';
import { useSelector } from 'react-redux';
import { useLogout } from '@/controller/logoutController';

export default function DrawerContainer({
  isRightDrawerOpen,
  handleCloseRightDrawer,
  isAuthenticated = false,
}) {
  return (
    <>
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
  return (
    <UserMenu
      user={user}
      handleLogout={handleLogout}
    />
  );
}