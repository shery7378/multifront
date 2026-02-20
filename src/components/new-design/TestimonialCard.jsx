"use client";

import { StarIcon } from "@heroicons/react/24/solid";

 
export default function TestimonialCard({ item }) {
  return (
    <div className="bg-white border border-[#EAEAEA] rounded-[6px] p-8 h-full transition duration-300">
      
      {/* Top Section */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <img
            src={item.image}
            alt={item.name}
            className="w-14 h-14 rounded-full object-cover"
          />
          <h3 className="text-xl lg:text-3xl font-semibold text-[#133240]">
            {item.name}
          </h3>
        </div>

        {/* Stars */}
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <StarIcon className={`w-5 h-5 ${star <= item.rating ? "fill-[#F59E0B] text-[#F59E0B]" : "text-[#F59E0B]"}`} />
          ))}
        </div>
      </div>

      {/* Review Text */}
      <p className="text-[#133240] leading-relaxed text-sm lg:text-lg">
        {item.review}
      </p>
    </div>
  );
}