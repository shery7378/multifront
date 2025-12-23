//src/components/ImageModal.jsx
'use client';

import { useEffect, useRef, useState } from 'react';
import CloseXButton from '@/components/UI/CloseXButton';

const ImageModal = ({ isOpen, onClose, imageSrc, alt }) => {
  const modalRef = useRef(null);
  const touchStartY = useRef(null);
  const [visible, setVisible] = useState(false);

  // Handle body scroll and visibility animation
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setVisible(true);
    } else {
      document.body.style.overflow = '';
      setVisible(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Handle swipe-down to close
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const swipeDistance = touchEndY - touchStartY.current;
    if (swipeDistance > 100) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        bg-black transition-opacity duration-300 ease-in-out
        ${visible ? 'bg-opacity-70' : 'bg-opacity-0'}
      `}
      role="dialog"
      aria-modal="true"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        ref={modalRef}
        className={`
          relative bg-white rounded-lg p-6 max-w-xl w-full max-h-[75vh] overflow-auto
          transform transition-all duration-300 ease-in-out
          ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        `}
      >
        {/* Close Button */}
        <div className="absolute top-4 right-4 z-50">
          <CloseXButton onClick={onClose} />
        </div>

        {/* Image */}
        <img
          src={imageSrc}
          alt={alt}
          className="w-full max-h-[65vh] object-contain rounded-md"
        />
      </div>
    </div>
  );
};

export default ImageModal;
