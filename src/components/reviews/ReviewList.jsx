'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useGetRequest } from '@/controller/getRequests';
import { useI18n } from '@/contexts/I18nContext';

function Stars({ value = 0 }) {
  const full = Math.floor(value);
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => {
        const isFilled = i < full;
        return (
          <svg
            key={i}
            className="w-4 h-4 text-yellow-400"
            fill={isFilled ? 'currentColor' : 'none'}
            stroke={isFilled ? 'none' : 'currentColor'}
            strokeWidth={isFilled ? 0 : 1.5}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.357 2.44a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.357-2.44a1 1 0 00-1.175 0l-3.357 2.44c-.784.57-1.838-.197-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.314 9.397c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.97z" />
          </svg>
        );
      })}
    </div>
  );
}

// Generate avatar background color based on name
function getAvatarColor(name) {
  const colors = [
    'bg-pink-300',   // Light pink (like Floyd Miles in the image)
    'bg-yellow-400', // Vibrant yellow
    'bg-blue-300',   // Light blue
    'bg-green-300',  // Green
    'bg-purple-300', // Purple
    'bg-indigo-300', // Indigo
  ];
  if (!name) return colors[0];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

// Get initials from name
function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export default function ReviewList({ productId, reloadKey, onReviewsLoaded }) {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const { data, error, loading, sendGetRequest } = useGetRequest();

  const fetchReviews = useCallback(() => {
    if (!productId) return;
    const url = `/products/${productId}/reviews?page=${page}`;
    sendGetRequest(url, false, { suppressAuthErrors: true });
  }, [productId, page, sendGetRequest]);

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchReviews, reloadKey]);

  const reviews = data?.data || [];
  const pagination = data?.pagination;

  // Notify parent when reviews are loaded
  useEffect(() => {
    if (onReviewsLoaded && reviews.length > 0) {
      onReviewsLoaded(reviews);
    }
  }, [reviews, onReviewsLoaded]);

  // Slider state and refs (same as ReviewSlider)
  const [currentIndex, setCurrentIndex] = useState(reviews.length || 0);
  const [visibleSlides, setVisibleSlides] = useState(2);
  const transitionDuration = 500;
  const sliderRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Update visible slides based on screen size (same as ReviewSlider)
  const updateVisibleSlides = useCallback(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 640) {
        setVisibleSlides(1);
      } else if (width < 1024) {
        setVisibleSlides(2);
      } else {
        setVisibleSlides(2); // Keep 2 for desktop (matching the design)
      }
    }
  }, []);

  useEffect(() => {
    updateVisibleSlides();
    window.addEventListener('resize', updateVisibleSlides);
    return () => window.removeEventListener('resize', updateVisibleSlides);
  }, [updateVisibleSlides]);

  // Calculate slide width and extended reviews for infinite loop
  const slideWidthPercentage = reviews.length > 0 ? 100 / visibleSlides : 0;
  const extendedReviews = reviews.length > 0 ? [...reviews, ...reviews, ...reviews] : [];

  // Initialize currentIndex to middle section for infinite loop
  useEffect(() => {
    if (reviews.length > 0) {
      setCurrentIndex(reviews.length);
    }
  }, [reviews.length]);

  // Auto-advance carousel
  useEffect(() => {
    if (reviews.length > visibleSlides) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => prevIndex + 1);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [reviews.length, visibleSlides]);

  // Handle transition end to reset position for infinite loop
  const handleTransitionEnd = () => {
    if (!sliderRef.current || reviews.length === 0) return;
    if (currentIndex >= reviews.length * 2) {
      sliderRef.current.style.transition = 'none';
      setCurrentIndex(reviews.length);
      sliderRef.current.getBoundingClientRect();
      setTimeout(() => {
        if (sliderRef.current) {
          sliderRef.current.style.transition = `transform ${transitionDuration}ms ease-in-out`;
        }
      }, 50);
    }
  };

  // Swipe Handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const deltaX = touchStartX.current - touchEndX.current;
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        setCurrentIndex((prev) => prev + 1); // swipe left
      } else {
        setCurrentIndex((prev) => prev - 1); // swipe right
      }
    }
  };

  // Dot Pagination Logic
  const totalGroups = reviews.length > 0 ? Math.ceil(reviews.length / visibleSlides) : 0;
  const activeDot = reviews.length > 0 
    ? Math.floor((currentIndex - reviews.length) / visibleSlides) % totalGroups 
    : 0;

  // Section Heading Component
  const SectionHeading = () => (
    <h2 className="text-xl font-bold text-slate-800 mb-6">
      {t('common.ratingAndFeedback') || 'Rating and Feedback'}
    </h2>
  );

  if (loading) {
    return (
      <div className="mt-6">
        <SectionHeading />
        <p className="text-gray-500">{t('common.loadingReviews')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6">
        <SectionHeading />
        <p className="text-red-600">{t('common.error')}: {error}</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="mt-6">
        <SectionHeading />
        <p className="text-gray-500">{t('common.noReviewsYet')}</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Section Heading */}
      <SectionHeading />
      
      {/* Review Cards Carousel - Infinite Loop Slider */}
      <div className="relative w-full overflow-hidden">
        <div
          ref={sliderRef}
          className={`flex transition-transform duration-500 ease-in-out gap-5`}
          style={{
            transform: `translateX(-${currentIndex * slideWidthPercentage}%)`,
            transition: `transform ${transitionDuration}ms ease-in-out`,
            width: `${(extendedReviews.length * 100) / visibleSlides}%`,
          }}
          onTransitionEnd={handleTransitionEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {extendedReviews.map((review, index) => {
            const reviewerName = review.reviewer_name || review.user?.name || t('common.anonymous');
            const avatarColor = getAvatarColor(reviewerName);
            const initials = getInitials(reviewerName);
            
            return (
              <div
                key={`${review.id}-${index}`}
                style={{ width: `${slideWidthPercentage}%` }}
                className="shrink-0"
              >
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-full">
                  <div className="flex items-start gap-4">
                    {/* Profile Picture - Circular with light pink background (top left) */}
                    <div className={`w-14 h-14 rounded-full ${avatarColor} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                      {review.user?.avatar || review.avatar ? (
                        <img
                          src={review.user?.avatar || review.avatar}
                          alt={reviewerName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold text-base">
                          {initials}
                        </span>
                      )}
                    </div>

                    {/* Review Content - Name and stars on same row, text below */}
                    <div className="flex-1 min-w-0">
                      {/* Top Row: Name (left) and Stars (right) */}
                      <div className="flex items-start justify-between mb-3">
                        {/* Reviewer Name - Bold, dark grey, prominent */}
                        <h4 className="font-bold text-slate-800 text-base leading-tight">
                          {reviewerName}
                        </h4>

                        {/* Star Rating - Top right corner */}
                        <div className="flex-shrink-0 ml-4">
                          <Stars value={review.rating || 5} />
                        </div>
                      </div>

                      {/* Review Text - Smaller dark grey, truncated with ellipsis */}
                      {review.comment && (
                        <p className="text-sm text-slate-700 leading-relaxed line-clamp-4">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination Dots - Orange/red dots matching the design */}
      {totalGroups > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalGroups }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(reviews.length + i * visibleSlides)}
              className={`rounded-full cursor-pointer transition-all duration-300 ${
                i === (activeDot + totalGroups) % totalGroups
                  ? 'bg-[#F24E2E] w-2.5 h-2.5' // Solid orange/red active dot
                  : 'bg-[#F24E2E]/40 w-2 h-2' // Lighter inactive dot
              }`}
              aria-label={`Go to review group ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Traditional Pagination (if needed) */}
      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            {t('common.previous')}
          </button>
          <div className="text-sm text-gray-600">
            {t('common.page')} {pagination.current_page} {t('common.of')} {pagination.last_page}
          </div>
          <button
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            onClick={() => setPage((p) => p + 1)}
            disabled={pagination.current_page >= pagination.last_page}
          >
            {t('common.next')}
          </button>
        </div>
      )}
    </div>
  );
}
