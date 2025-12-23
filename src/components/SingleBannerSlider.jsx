// src/components/SingleBannerSlider.jsx
"use client";

import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

export default function SingleBannerSlider({
  autoPlay = true,
  showArrows = true,
  showIndicators = true,
  interval = 5000,
  height = "400px",
}) {
  const banners = [
    { image: "/images/NoImageLong.jpg" },
    { image: "/images/NoImageLong.jpg" },
    { image: "/images/banners/pc-builder-challenge.png" },
    { image: "/images/banners/premium-tech-collection.png" },
  ];

  const [currentIndex, setCurrentIndex] = useState(banners.length);
  const transitionDuration = 500;
  const sliderRef = useRef(null);

  const extendedBanners = [...banners, ...banners, ...banners];
  const totalSlides = extendedBanners.length;

  // Auto-slide
  useEffect(() => {
    if (!autoPlay) return;
    const intervalId = setInterval(() => {
      setCurrentIndex((prevIndex) => prevIndex + 1);
    }, interval);
    return () => clearInterval(intervalId);
  }, [autoPlay, interval]);

  // Infinite loop handle
  const handleTransitionEnd = () => {
    if (!sliderRef.current) return;
    if (currentIndex >= banners.length * 2) {
      sliderRef.current.style.transition = "none";
      setCurrentIndex(banners.length);
      sliderRef.current.getBoundingClientRect(); // reflow
      setTimeout(() => {
        if (sliderRef.current) {
          sliderRef.current.style.transition = `transform ${transitionDuration}ms ease-in-out`;
        }
      }, 50);
    } else if (currentIndex <= banners.length - 1) {
      sliderRef.current.style.transition = "none";
      setCurrentIndex(banners.length * 2 - 1);
      sliderRef.current.getBoundingClientRect();
      setTimeout(() => {
        if (sliderRef.current) {
          sliderRef.current.style.transition = `transform ${transitionDuration}ms ease-in-out`;
        }
      }, 50);
    }
  };

  // Go to next/prev slide
  const goToNext = () => setCurrentIndex((prev) => prev + 1);
  const goToPrev = () => setCurrentIndex((prev) => prev - 1);

  // Current visible index in original array
  const visibleIndex = currentIndex % banners.length;

  return (
    <div className="relative w-full overflow-hidden" style={{ height }}>
      {/* Slider */}
      <div
        ref={sliderRef}
        className="flex h-full"
        style={{
          transform: `translateX(-${currentIndex * (100 / totalSlides)}%)`,
          transition: `transform ${transitionDuration}ms ease-in-out`,
          width: `${totalSlides * 100}%`,
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {extendedBanners.map((banner, index) => (
          <div
            key={index}
            className="flex-shrink-0 relative"
            style={{ width: `${100 / totalSlides}%`, height: "100%" }}
          >
            <Image
              src={banner.image}
              alt={`Banner ${index + 1}`}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {/* Arrows */}
      {showArrows && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/70 transition"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/70 transition"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && (
        <div className="absolute bottom-3 w-full flex justify-center gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(banners.length + i)}
              className={`h-2 w-2 rounded-full transition-all ${
                visibleIndex === i ? "bg-white w-4" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

//Usage Example in src/app/home/page.jsx
{/* <SingleBannerSlider
  autoPlay={true}
  showArrows={true}
  showIndicators={true}
  interval={4000}
  height="300px"
/> */}
