// src/components/HomeBannerSection.jsx
import React from "react";

export default function HomeBannerSection({ mainBanner, sideBanners = [] }) {
  return (
    <div className="mt-6 grid grid-cols-12 gap-6">
      {/* Main Banner */}
      <div className="col-span-12 lg:col-span-8">
        <div className="aspect-[803/443] w-full">
          <img
            src={mainBanner || "/images/NoImageLong.jpg"}
            alt="Main Banner"
            className="w-full h-full object-cover rounded-xl"
          />
        </div>
      </div>

      {/* Side Banners */}
      <div className="col-span-12 lg:col-span-4 space-y-6">
        {sideBanners.length > 0 ? (
          sideBanners.map((banner, i) => (
            <div key={i} className="aspect-[390/443] w-full">
              <img
                src={banner || "/images/NoImageSmall.jpg"}
                alt={`Side Banner ${i + 1}`}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
          ))
        ) : (
          <div className="aspect-[390/443] w-full">
            <img
              src="/images/NoImageSmall.jpg"
              alt="Default Side Banner"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
        )}
      </div>
    </div>
  );
}
