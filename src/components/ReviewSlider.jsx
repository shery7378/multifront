//src/components/ReviewSlider.jsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import ReviewCard from './ReviewCard';
import { useGetRequest } from '@/controller/getRequests';
import { useI18n } from '@/contexts/I18nContext';

// Static fallback testimonials (used when no real reviews yet)
const FALLBACK_REVIEWS = [
  {
    name: "Floyd Miles",
    rating: 5,
    review:
      "Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit.",
    image: '/images/reviews/image1.png',
  },
  {
    name: "Ronald Richards",
    rating: 4,
    review:
      'Ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit. Exercitation veniam consequat sunt nostrud amet.',
    image: '/images/reviews/image2.png',
  },
  {
    name: "Savannah Nguyen",
    rating: 4,
    review:
      'Exercitation veniam consequat sunt nostrud amet. Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint.',
    image: '/images/reviews/image3.png',
  },
];

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

  const apiReviews = apiReviewsRaw
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

  const reviews = apiReviews.length > 0 ? apiReviews : FALLBACK_REVIEWS;

  const [currentIndex, setCurrentIndex] = useState(reviews.length);
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
  const extendedReviews = shouldLoop ? [...reviews, ...reviews, ...reviews] : reviews;
  const totalGroups = Math.ceil(reviews.length / visibleSlides);
  // If not looping, active dot is just based on currentIndex
  const activeDot = shouldLoop
    ? Math.floor((currentIndex - reviews.length) / visibleSlides) % totalGroups
    : Math.floor(currentIndex / visibleSlides);

  useEffect(() => {
    // Reset index if we switch to non-looping mode (e.g. resize)
    if (!shouldLoop) {
      setCurrentIndex(0);
    } else if (currentIndex === 0) {
      // Initialize loop position
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
    } else if (currentIndex < reviews.length) {
      // Handle scrolling backwards past the start
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
  };

  return (
    <div className="relative w-full min-h-[350px] overflow-hidden">
      <div
        ref={sliderRef}
        className={`flex h-[300px] transition-transform duration-500 ease-in-out md:gap-3 ${(extendedReviews.length * 100) / visibleSlides}%`}
        style={{
          transform: `translateX(-${currentIndex * slideWidthPercentage}%)`,
          transition: `transform ${transitionDuration}ms ease-in-out`,
        }}
        onTransitionEnd={handleTransitionEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {extendedReviews.map((review, index) => (
          <div
            key={index}
            style={{ width: `${slideWidthPercentage}%` }}
            className="shrink-0"
          >
            <div className="relative w-full h-full">
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
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {Array.from({ length: totalGroups }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(reviews.length + i * visibleSlides)}
            className={`w-3 h-3 rounded-full cursor-pointer ${i === (activeDot + totalGroups) % totalGroups
              ? 'bg-vivid-red'
              : 'bg-vivid-red/40'
              } transition-colors`}
          />
        ))}
      </div>
    </div>
  );
}
