"use client";

import Slider from "react-slick";
 import TestimonialCard from "./TestimonialCard";

import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
const testimonials = [
    {
      id: 1,
      name: "Floyd Miles",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      rating: 4,
      review:
        "Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit. Exercitation veniam consequat sunt nostrud amet.",
    },
    {
      id: 2,
      name: "Ronald Richards",
      image: "https://randomuser.me/api/portraits/men/75.jpg",
      rating: 4,
      review:
        "Ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit. Exercitation veniam consequat sunt nostrud amet.",
    },
    {
      id: 3,
      name: "Savannah Nguyen",
      image: "https://randomuser.me/api/portraits/women/44.jpg",
      rating: 5,
      review:
        "Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint.",
    },
    {
      id: 4,
      name: "Jenny Wilson",
      image: "https://randomuser.me/api/portraits/women/68.jpg",
      rating: 3,
      review:
        "Velit officia consequat duis enim velit mollit. Exercitation veniam consequat sunt nostrud amet.",
    },
  ];
export default function TestimonialSection() {
  const settings = {
    centerMode: true,
    centerPadding: "20px",
    slidesToShow: 2,
    infinite: true,
    arrows: false,
    dots: true,
    autoplay: true,
    speed: 500,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          centerMode: true,
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

  return (
    <section className="pb-20">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Heading */}
        <h2 className="text-3xl font-bold text-[#2F2F2F] mb-12">
          Rating and Feedback
        </h2>

        {/* Slider */}
        <Slider {...settings}>
          {testimonials.map((item) => (
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