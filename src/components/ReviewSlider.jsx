//src/components/ReviewSlider.jsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import ReviewCard from './ReviewCard';
import { useGetRequest } from '@/controller/getRequests';
import { useI18n } from '@/contexts/I18nContext';

// Generic slider: works for either a store or a product
export default function ReviewSlider({ storeId, productId }) {
  const { t } = useI18n();
  const { data, error, loading, sendGetRequest } = useGetRequest();

  // Decide which endpoint to hit
  const resourcePath = productId
    ? `/products/${productId}/reviews`
    : storeId
      ? `/stores/${storeId}/reviews`
      : null;

  // Fetch dynamic reviews
  useEffect(() => {
    if (!resourcePath) return;
    sendGetRequest(`${resourcePath}?per_page=12`, false, {
      suppressAuthErrors: true,
    });
  }, [resourcePath, sendGetRequest]);

  const apiReviewsRaw = Array.isArray(data?.data) ? data.data : [];

  const reviews = apiReviewsRaw
    .map((r) => {
      const name =
        r.user?.name ||
        t('common.anonymous') ||
        'Anonymous';

      return {
        name,
        rating: Number(r.rating || 0),
        review: r.comment || r.title || '',
        image: '/images/reviews/image1.png', // simple placeholder avatar
      };
    })
    .filter((r) => r.review);

  // If no reviews, return null to hide the section
  if (!reviews || reviews.length === 0) {
    return null;
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleSlides, setVisibleSlides] = useState(3);
  const transitionDuration = 500;
  const sliderRef = useRef(null);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const updateVisibleSlides = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 640) {
        setVisibleSlides(1);
      } else if (width < 1024) {
        setVisibleSlides(2);
      } else {
        setVisibleSlides(3);
      }
    }
  };

  useEffect(() => {
    updateVisibleSlides();
    window.addEventListener('resize', updateVisibleSlides);
    return () => window.removeEventListener('resize', updateVisibleSlides);
  }, []);

  const slideWidthPercentage = 100 / visibleSlides;
  // Dot Pagination Logic
  const shouldLoop = reviews.length > visibleSlides;
  
  // Create extended array for infinite loop effect only if needed
  const extendedReviews = shouldLoop 
    ? [...reviews, ...reviews, ...reviews] 
    : reviews;
    
  const totalGroups = Math.ceil(reviews.length / visibleSlides);
  // If not looping, active dot is just based on currentIndex
  const activeDot = shouldLoop
    ? Math.floor((currentIndex - reviews.length) / visibleSlides) % totalGroups
    : Math.floor(currentIndex / visibleSlides);

  useEffect(() => {
    // Reset index when reviews change or loop mode changes
    if (!shouldLoop) {
      setCurrentIndex(0);
    } else {
      // Initialize loop position to the middle set
      setCurrentIndex(reviews.length);
    }
  }, [shouldLoop, reviews.length]);

  useEffect(() => {
    if (!shouldLoop) return; // Don't auto-scroll if not looping

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => prevIndex + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [shouldLoop]);

  const handleTransitionEnd = () => {
    if (!sliderRef.current || !shouldLoop) return;

    // If we've scrolled past the visible "middle" set to the right
    if (currentIndex >= reviews.length * 2) {
      sliderRef.current.style.transition = 'none';
      setCurrentIndex(reviews.length);
      // Force reflow
      sliderRef.current.getBoundingClientRect();
      requestAnimationFrame(() => {
        if (sliderRef.current) {
          sliderRef.current.style.transition = `transform ${transitionDuration}ms ease-in-out`;
        }
      });
    } 
    // If we've scrolled past the visible "middle" set to the left
    else if (currentIndex < reviews.length) {
      sliderRef.current.style.transition = 'none';
      setCurrentIndex(reviews.length * 2 - 1);
      sliderRef.current.getBoundingClientRect();
      requestAnimationFrame(() => {
        if (sliderRef.current) {
          sliderRef.current.style.transition = `transform ${transitionDuration}ms ease-in-out`;
        }
      });
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
    if (!touchStartX.current || !touchEndX.current) return;
    
    const deltaX = touchStartX.current - touchEndX.current;
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // swipe left (next)
        if (shouldLoop || currentIndex < reviews.length - visibleSlides) {
          setCurrentIndex(prev => prev + 1);
        }
      } else {
        // swipe right (prev)
        if (shouldLoop || currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
        }
      }
    }
    // Reset touch coordinates
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return (
    <section className="mt-16 sm:mt-24 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
         <h2 className="text-3xl font-bold text-[#0B1537] mb-8 lg:mb-12 text-center sm:text-left">
           {t('common.verified_customer_reviews')}
        </h2>
        
        <div className="relative w-full min-h-[350px] overflow-hidden">
        <div
            ref={sliderRef}
            className={`flex h-[300px] transition-transform duration-500 ease-in-out md:gap-3`}
            style={{
            transform: `translateX(-${currentIndex * (100 / extendedReviews.length)}%)`,
            transition: `transform ${transitionDuration}ms ease-in-out`,
            width: `${(extendedReviews.length * 100) / visibleSlides}%`
            }}
            onTransitionEnd={handleTransitionEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {extendedReviews.map((review, index) => (
            <div
                key={index}
                style={{ width: `${100 / extendedReviews.length}%` }}
                className="shrink-0 flex justify-center" // added flex justify-center for alignment
            >
                <div className="relative w-full h-full max-w-[400px]"> {/* added max-w constraint */}
                <ReviewCard
                    name={review.name}
                    rating={review.rating}
                    review={review.review}
                    image={review.image}
                />
                </div>
            </div>
            ))}
        </div>

        {/* Dot Indicators */}
        {totalGroups > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {Array.from({ length: totalGroups }).map((_, i) => (
                <button
                key={i}
                onClick={() => setCurrentIndex(reviews.length + i * visibleSlides)}
                className={`w-3 h-3 rounded-full cursor-pointer ${
                    shouldLoop 
                    ? (i === (activeDot + totalGroups) % totalGroups ? 'bg-[#F24E2E]' : 'bg-[#F24E2E]/30')
                    : (i === Math.floor(currentIndex / visibleSlides) ? 'bg-[#F24E2E]' : 'bg-[#F24E2E]/30')
                } transition-colors`}
                />
            ))}
            </div>
        )}
        </div>
      </div>
    </section>
  );
}
