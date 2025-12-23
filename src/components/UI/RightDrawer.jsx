// src/components/UI/RightDrawer.jsx
'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Drawer from './Drawer';

export default function RightDrawer({
  children,
  isOpen, // Controlled prop
  onClose, // Controlled prop
  initialOpenState = false,
  storageKey = 'right_drawer_state',
  position = 'right',
  width = 300,
  swipeToOpen = true,
  onToggle,
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (!isOpen) {
      localStorage.setItem(storageKey, 'false');
    } else {
      localStorage.setItem(storageKey, 'true');
    }
  }, [isOpen, storageKey]);

  useEffect(() => {
    // Only reset if route changes and drawer should not be open
    if (pathname && !isOpen) {
      if (onClose) onClose(); // Close only if not intended to be open
      console.log('Route changed, closing drawer if open:', isOpen);
    }
  }, [pathname, isOpen, onClose]); // Add isOpen to dependencies

  const handleToggle = (newState) => {
    if (onToggle) onToggle(newState);
  };

  return (
    <Drawer
      isOpen={isOpen} // Use controlled prop directly
      onClose={onClose}
      position={position}
      width={width}
      swipeToOpen={swipeToOpen}
      backdrop={true} // Ensure backdrop is enabled
    >
      <div className="overflow-auto">
        <div className="flex flex-col min-h-[100dvh] overflow-auto bg-white shadow-lg">
          {children}
        </div>
      </div>
    </Drawer>
  );
}