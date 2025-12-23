//src/app/page.jsx
"use client";

import LocationAllowModal from "@/components/LocationAllowModal";
import { useState, useEffect } from "react";
import { MapPinIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import ServiceCard from "@/components/ServiceCard";
import ResponsiveText from "@/components/UI/ResponsiveText";
import LandingPageHeader from "@/components/LandingPageHeader";
import Footer from "@/components/Footer";
import TechShowcase from "@/components/TechShowcase";
import { useRouter } from "next/navigation";
import PostcodeModal from "@/components/PostcodeModal";
import { useI18n } from '@/contexts/I18nContext';
import Image from "next/image";

export default function LandingPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [isModalAutoLocationOpen, setIsModalAutoLocationOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postcode, setPostcode] = useState("");
  const [coords, setCoords] = useState(null); // { lat, lng }
  const [searchTerm, setSearchTerm] = useState(""); // New state for search input

  useEffect(() => {
    // Check if data is saved in localStorage
    const savedPostcode = localStorage.getItem("postcode");
    const savedLat = localStorage.getItem("lat");
    const savedLng = localStorage.getItem("lng");

    if (!savedPostcode) {
      setIsModalAutoLocationOpen(true); // ask for postcode if not saved
    } else {
      setPostcode(savedPostcode);
      if (savedLat && savedLng) {
        setCoords({ lat: parseFloat(savedLat), lng: parseFloat(savedLng) });
      }
    }
  }, []);

  const handleSavePostcode = (code) => {
    setPostcode(code);
    localStorage.setItem("postcode", code);
  };

  const handleSaveLocation = ({ postcode, lat, lng }) => {
    console.log("Saved location:", { postcode, lat, lng });
    setPostcode(postcode);
    setCoords(lat && lng ? { lat, lng } : null);

    localStorage.setItem("postcode", postcode);
    if (lat && lng) {
      localStorage.setItem("lat", lat);
      localStorage.setItem("lng", lng);
    } else {
      localStorage.removeItem("lat");
      localStorage.removeItem("lng");
    }
    setIsModalOpen(false);
    // ✅ Redirect to /home
    // router.push("/home");
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      // Redirect to /home with search term as query parameter
      router.push(`/home?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const services = [
    {
      id: 1,
      image: "/images/services/service1.png",
      title: t('landing.yourRestaurantDelivered'),
      link: "#",
    },
    {
      id: 2,
      image: "/images/services/service2.png",
      title: t('landing.deliverWithMultikonnect'),
      link: "#",
    },
    {
      id: 3,
      image: "/images/services/service3.png",
      title: t('landing.feedYourEmployees'),
      link: "#",
    },
  ];

  const cities = [
    "Nashville", "Oklahoma City", "Bridgeport", "Providence",
    "Queens", "Bridgeport", "San Antonio", "Akron",
    "Hartford", "Albuquerque", "Albuquerque", "Bridgeport",
    "Houston", "Concord", "Dayton", "El Paso",
    "Concord", "Palm Bay", "Mesa", "Dayton",
    "McAllen", "Palm Bay", "Mesa", "Dayton",
  ];

  const countries = [
    "Akron", "Albuquerque", "Bridgeport", "Concord", "Dayton",
    "El Paso", "Dayton", "Tucson", "View all 100+ cities", "Hartford",
    "Albuquerque", "Houston", "Nashville", "Oklahoma City", "Bridgeport",
    "Palm Bay", "Providence", "Queens", "Bridgeport", "San Antonio",
    "Dayton", "Concord", "Mesa", "Dayton", "McAllen", "Palm Bay", "Tucson"
  ];

  return (
    <>
      {/* ✅ Pass props to Header */}
      <LandingPageHeader
        postcode={postcode}
        onOpenModal={() => setIsModalOpen(true)}
      />

      <div className="grid items-center justify-items-center">
        {/* Banner */}
        <section className="banner bg-vivid-red w-full">
          <div className="container mx-auto min-h-[750px] flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="text-white grid gap-6 pt-11 w-full max-w-7xl">
              <div className="top text-center grid gap-4">
                <h1 className="text-white text-3xl sm:text-4xl font-bold">{t('landing.orderOnMultikonnect')}</h1>
                <p className="text-base sm:text-lg max-w-xl mx-auto">
                  {t('landing.getFoodDelivered')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-xl mx-auto">
                  {/* ✅ Banner Button uses same modal */}
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center w-full sm:max-w-xs px-4 py-2 bg-white text-baltic-black rounded-full border border-gray-200 shadow-sm hover:bg-gray-50 transition"
                  >
                    <MapPinIcon className="w-5 h-5 text-baltic-black mr-2" />
                    <span className="flex-1 text-left text-sm font-medium truncate">
                      {postcode ? postcode : "Enter Delivery Address"}
                    </span>
                    <ChevronDownIcon className="w-5 h-5 text-baltic-black ml-2" />
                  </button>

                  <div className="flex items-center w-full sm:max-w-xs px-4 py-2 bg-white text-black rounded-full border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-vivid-red">
                    <MagnifyingGlassIcon
                      className="w-5 h-5 text-baltic-black mr-2 cursor-pointer"
                      onClick={handleSearch} // Add click handler
                    />
                    <input
                      type="text"
                      placeholder={t('landing.searchPlaceholder')}
                      className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-baltic-black"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSearch();
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="bottom">
                <div className="w-full max-w-4xl mx-auto">
                  <TechShowcase />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  image={service.image}
                  title={service.title}
                  link={service.link}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Cities Near Me */}
        <section className="bg-white py-8 w-full">
          <div className="grid grid-cols-1 gap-8">
            <div className="container mx-auto">
              <div className="flex justify-between">
                <span className=" font-bold text-[33px]/[44px] text-baltic-black">{t('landing.citiesNearMe')}</span>
                <span className=" text-vivid-red underline cursor-pointer">{t('landing.viewAllCities')}</span>
              </div>
            </div>

            <div>
              <div className="w-full">
                <Image
                  src="/images/map.jpg"
                  alt="Responsive image"
                  width={1200}
                  height={600}
                  className="w-full h-auto max-w-full object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Countries */}
        <section className="bg-white w-full">
          <div className="container mx-auto ">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-center font-medium text-black">
              {cities.map((city, index) => (
                <div key={index} className="py-1">
                  {city}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white w-full pb-8">
            <div className="container mx-auto">
              <div className="flex justify-between py-8">
                <ResponsiveText as="span" minSize="1rem" maxSize="2.1rem" className="text-baltic-black font-bold">
                  {t('landing.countriesWithMultikonnect')}
                </ResponsiveText>

                <ResponsiveText as="span" minSize="1rem" maxSize="1rem" className="text-vivid-red underline cursor-pointer">
                  {t('landing.viewAllCities')}
                </ResponsiveText>
              </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-center font-medium text-black">
              {countries.map((country, index) => (
                <div key={index} className="py-1">
                  {country}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Modal */}
        <LocationAllowModal
          // isOpen={isModalAutoLocationOpen}
          onClose={() => setIsModalAutoLocationOpen(false)}
          onSave={handleSaveLocation}
        />
      </div>

      <PostcodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePostcode}
      />
      <Footer />
    </>
  );
}
