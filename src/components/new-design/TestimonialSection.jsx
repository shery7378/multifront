"use client";

import { useState, useEffect } from "react";
import Slider from "react-slick";
 import TestimonialCard from "./TestimonialCard";

import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
// This section is now dynamic and fetches data from the API
export default function TestimonialSection({ productId, storeId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
        let url = '';
        
        if (productId) {
          url = `${apiBase}/api/products/${productId}/reviews?per_page=10`;
        } else if (storeId) {
          url = `${apiBase}/api/stores/${storeId}/reviews?per_page=10`;
        }

        if (!url) {
          setLoading(false);
          return;
        }

        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          const apiData = Array.isArray(json?.data) ? json.data : (Array.isArray(json?.data?.data) ? json.data.data : []);
          
          const formattedReviews = apiData.map(r => ({
            id: r.id,
            name: r.user?.name || "Verified Customer",
            image: r.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.user?.name || "V")}&background=random`,
            rating: Number(r.rating || 5),
            review: r.comment || r.title || "Excellent product!"
          })).filter(r => r.review);
          
          setReviews(formattedReviews);
        }
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, [productId, storeId]);

  const settings = {
    centerMode: reviews.length > 2,
    centerPadding: "20px",
    slidesToShow: Math.min(reviews.length, 2),
    infinite: reviews.length > 2,
    arrows: false,
    dots: true,
    autoplay: reviews.length > 1,
    speed: 500,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: Math.min(reviews.length, 2),
          centerMode: reviews.length > 2,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          centerMode: false,
        },
      },
    ],
  };

  if (loading) return null;
  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="pb-20">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Heading */}
        <h2 className="text-3xl font-bold text-[#2F2F2F] mb-12">
          Rating and Feedback
        </h2>

        {/* Slider */}
        <Slider {...settings}>
          {reviews.map((item) => (
            <div key={item.id} className="px-4">
              <TestimonialCard item={item} />
            </div>
          ))}
        </Slider>
      </div>

      {/* Custom Slick Dots Styling */}
      <style jsx global>{`
        .slick-dots {
          bottom: -40px;
        }
        .slick-dots li button:before {
          font-size: 10px;
          color: #F97316;
          opacity: 0.3;
        }
        .slick-dots li.slick-active button:before {
          opacity: 1;
          color: #F97316;
        }
      `}</style>
    </section>
  );
}