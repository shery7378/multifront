//src/components/SignUpPageHeader.jsx
'use client';
import Link from 'next/link';
import { MapPinIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import PostcodeModal from "@/components/PostcodeModal";
import { useState, useEffect } from "react";
import Button from './UI/Button';
import { getStorageUrl } from '@/utils/urlHelpers';

export default function LandingPageHeader() {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postcode, setPostcode] = useState("");

  useEffect(() => {
    // Check if postcode is saved in localStorage
    const savedPostcode = localStorage.getItem("postcode");
    if (!savedPostcode) {
      setIsModalOpen(false); // ask for postcode if not saved
    } else {
      setPostcode(savedPostcode);
    }
  }, []);

  const handleSavePostcode = (code) => {
    setPostcode(code);
    localStorage.setItem("postcode", code);
  };

  return (
    <>
      <header className="bg-vivid-red border-b border-gray-200">
        <nav className="container mx-auto flex justify-between items-center h-16 px-4">
          {/* Logo */}
          <Link href="/home">
            <img 
              src={getStorageUrl('/storage/images/logo/MultiKonnect Hero.png')}
              alt="MultiKonnect" 
              className="h-4 w-auto object-contain cursor-pointer brightness-0 invert"
            />
          </Link>

          {/* Right Side Buttons */}
          <div className="md:flex items-center gap-3 hidden">
            {/* Address Button */}
            <button onClick={() => setIsModalOpen(true)} className="flex items-center rounded-full border border-white/90 h-10 px-4 bg-transparent">
              <MapPinIcon className="w-5 h-5 text-white mr-2" />
              <span className="text-sm font-medium text-white whitespace-nowrap truncate max-w-[220px]">
                {postcode ? postcode : 'Enter Delivery Address'}
              </span>
              <ChevronDownIcon className="w-5 h-5 text-white ml-2" />
            </button>

            {/* Login Button */}
            <Link href={`/login`}>
              <Button variant="transparent" className="border border-white/90 text-white rounded-full !h-10 !px-4">
                Log in
              </Button>
            </Link>

          </div>
        </nav>
      </header>

      <PostcodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePostcode}
      />
    </>
  );
}
