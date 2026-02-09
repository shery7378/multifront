// src/components/UI/Drawer.jsx
'use client';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Drawer({
  isOpen,
  onClose,
  position = 'left',
  width = 300,
  backdrop = true,
  swipeToOpen = false,
  children,
}) {
  useEffect(() => {
    // Lock body scroll when Drawer is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      console.log('Drawer opened, position:', position, 'isOpen:', isOpen); // Debug log
    } else {
      document.body.style.overflow = '';
      console.log('Drawer closed, position:', position, 'isOpen:', isOpen); // Debug log
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, position]);

  useEffect(() => {
    if (!swipeToOpen || position !== 'left' || !isOpen) return;

    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e) => (touchStartX = e.touches[0].clientX);
    const handleTouchMove = (e) => (touchEndX = e.touches[0].clientX);
    const handleTouchEnd = () => {
      if (touchEndX - touchStartX > 80 && touchStartX < 30 && onClose) {
        console.log('Touch close triggered');
        onClose(false);
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, onClose, swipeToOpen, position]);

  const drawerStyle = {
    width,
    [position]: 0,
  };

  const drawerVariants = {
    open: { x: 0 },
    closed: { x: position === 'left' ? -width : width },
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && backdrop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              console.log('Backdrop clicked, calling onClose');
              if (onClose) onClose(false); // Only close if allowed
            }}
          />
        )}
      </AnimatePresence>

      {/* Drawer Panel */}
      <motion.div
        className="fixed top-0 h-screen bg-white shadow-lg z-50 overflow-y-auto scroll-smooth custom-scrollbar"
        style={drawerStyle}
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
        variants={drawerVariants}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </>
  );
}