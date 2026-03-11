'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function ProductImageZoom({
  isOpen,
  onClose,
  images = [],
  currentIndex = 0,
  productName = '',
}) {
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setActiveIndex(currentIndex);
  }, [currentIndex]);

  // Debug: Log images received
  useEffect(() => {
    if (isOpen) {
      console.log('🖼️ ProductImageZoom - Modal opened with images:', {
        totalImages: images?.length || 0,
        currentIndex,
        activeIndex,
        imagesArrayType: Array.isArray(images) ? 'Array' : typeof images,
        firstImage: images?.[0],
        currentImage: images?.[activeIndex],
      });
    }
  }, [isOpen]);

  // Handle keyboard navigation and prevent page zoom with wheel
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };

    const handleWheel = (e) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    // Use passive: false to allow preventDefault on wheel events
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [isOpen, onClose]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const goToNext = () => {
    setActiveIndex((prev) => (prev + 1) % images.length);
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  const goToPrevious = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoom <= 1) return;

    const newPanX = e.clientX - dragStart.x;
    const newPanY = e.clientY - dragStart.y;

    setPanX(newPanX);
    setPanY(newPanY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!mounted) return null;

  const currentImageUrl = images?.[activeIndex] || '/images/NoImageLong.jpg';

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-8 h-8" />
          </button>

          {/* Main Image Container */}
          <div
            className="relative w-full h-full flex items-center justify-center p-4"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div
              className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg cursor-zoom-in active:cursor-zoom-out"
              onWheel={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setZoom((prev) =>
                  Math.min(Math.max(prev + (e.deltaY > 0 ? -0.1 : 0.1), 1), 3)
                );
              }}
              onMouseDown={handleMouseDown}
            >
              <motion.img
                key={activeIndex}
                src={currentImageUrl}
                alt={`${productName} - Image ${activeIndex + 1}`}
                className="w-full h-full object-contain"
                style={{
                  x: panX,
                  y: panY,
                  cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, scale: zoom }}
                exit={{ opacity: 0 }}
                transition={{ scale: { type: 'tween', duration: 0.2 } }}
                onError={(e) => {
                  console.error('❌ Image failed to load:', currentImageUrl);
                  e.target.src = '/images/NoImageLong.jpg';
                }}
                onLoad={() => {
                  console.log('✅ Image loaded successfully:', currentImageUrl);
                }}
              />
            </div>

            {/* Previous Button */}
            {images.length > 1 && (
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-3 rounded-full transition-colors z-10"
                aria-label="Previous image"
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
            )}

            {/* Next Button */}
            {images.length > 1 && (
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-3 rounded-full transition-colors z-10"
                aria-label="Next image"
              >
                <ChevronRightIcon className="w-6 h-6" />
              </button>
            )}

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium">
                {activeIndex + 1} / {images.length}
              </div>
            )}

            {/* Debug Info */}
            {images.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <p className="text-white text-center">No images to display</p>
              </div>
            )}
          </div>

          {/* Image Thumbnails */}
          {images.length > 1 && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 max-w-xs overflow-x-auto pb-4">
              {images.map((image, index) => (
                <motion.button
                  key={index}
                  onClick={() => {
                    setActiveIndex(index);
                    setZoom(1);
                  }}
                  className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-all ${activeIndex === index
                      ? 'border-white'
                      : 'border-gray-600 opacity-60 hover:opacity-80'
                    }`}
                  whileHover={{ scale: 1.1 }}
                >
                  <img
                    src={image || '/images/NoImageLong.jpg'}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-contain bg-black/20"
                    onError={(e) => {
                      e.target.src = '/images/NoImageLong.jpg';
                    }}
                  />
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
