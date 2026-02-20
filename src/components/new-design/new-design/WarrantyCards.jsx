"use client";
import Image from "next/image";
import { useState } from "react";
 
const Card = ({ title, description, buttonLabel, icon, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex items-center justify-between bg-white rounded-[5px] border border-[#E6EAED] px-5 py-[26px] gap-2.5 transition-all duration-300 cursor-pointer h-[219px]"
    >
      {/* Text content */}
      <div className="flex flex-col gap-[15px] flex-1 min-w-0">
        <h3 className="text-lg lg:text-2xl mdLtext-xl font-semibold text-[#092E3B] leading-snug">{title}</h3>
        <p className="text-sm text-[#585C5CB2] leading-relaxed">{description}</p>
           <button
            onClick={onClick}
            className="text-sm font-normal text-[#F44322] border border-[#F44322] rounded-[6px] text-center h-[39px] min-w-[130px] max-w-[149px] transition-all duration-200"
          >
            {buttonLabel}
          </button>
       </div>

      {/* Icon */}
      <div className="flex-shrink-0 ml-2 lg:ml-8">
        <Image src={icon} alt={title} width={100} height={100} />
      </div>
    </div>
  );
};

export default function WarrantyCards() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 ">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-10 mt-5">
        <Card
          title="Accessory shield - Free 1 Year Replacement"
          description="Charger, cable, screen protector — one free replacement within 12 months on eligible products."
          buttonLabel="See what's covered"
          icon={'/images/new-icons/varanticardimage1.png'}
          onClick={() => alert("See what's covered clicked")}
        />
        <Card
          title="Open-Box Confidence"
          description="Unseal video recorded at hand-off. If DOA within 48 hours, we'll swap instantly."
          buttonLabel="How it works"
          icon={'/images/new-icons/varanticardimage2.png'}
          onClick={() => alert("How it works clicked")}
        />
      </div>
    </div>
  );
}