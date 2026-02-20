"use client";
import { useState } from "react";
import Image from "next/image";

const productData = {
  id: 1,
  title: "Apple iPhone 14 Pro Max",
  price: 1399,
  oldPrice: 1499,
  description:
    "Enhanced capabilities thanks to an enlarged display of 6.7 inches and work without recharging throughout the day. Incredible photos in weak, yes and in bright lighting using the new system with two cameras more...",
  category: "Mobile",
  stock: 1,
  delivery: "1-2 day",
  images: [
    "/images/new-icons/stockImage1.svg",
    "/images/new-icons/stockImage2.svg",
    "/images/new-icons/stockImage3.svg",
    "/images/new-icons/stockImage4.svg",
  ],
  colors: [
    { name: "Black", code: "bg-black" },
    { name: "Purple", code: "bg-purple-600" },
    { name: "Red", code: "bg-red-600" },
    { name: "Gold", code: "bg-yellow-400" },
    { name: "Silver", code: "bg-gray-300" },
  ],
  storage: ["128GB", "256GB", "512GB", "1TB"],
};

export default function ProductDetailSection() {
  const [selectedImage, setSelectedImage] = useState(
    productData.images[0]
  );
  const [selectedColor, setSelectedColor] = useState(
    productData.colors[1].name
  );
  const [selectedStorage, setSelectedStorage] = useState(
    productData.storage[3]
  );

  return (
    <section className="w-full bg-white py-16">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        
        {/* LEFT SIDE */}
        <div className="flex gap-6">
          
          {/* Thumbnails */}
          <div className="flex flex-col gap-4">
            {productData.images.map((img, index) => (
              <div
                key={index}
                onClick={() => setSelectedImage(img)}
                className={`w-20 h-20 rounded-lg flex items-center justify-center border cursor-pointer ${
                  selectedImage === img
                    ? "border-black"
                    : "border-gray-200"
                }`}
              >
                <Image
                  src={img}
                  alt="thumb"
                  width={60}
                  height={60}
                  className="object-contain"
                />
              </div>
            ))}
          </div>

          {/* Main Image */}
          <div className="flex-1 bg-gray-50 rounded-2xl p-10 flex items-center justify-center">
            <Image
              src={selectedImage}
              alt="product"
              width={400}
              height={500}
              className="object-contain"
            />
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div>
          <h1 className="text-4xl font-semibold text-gray-900">
            {productData.title}
          </h1>

          {/* Price */}
          <div className="flex items-center gap-4 mt-6">
            <span className="text-3xl font-bold text-gray-900">
              ${productData.price}
            </span>
            <span className="text-xl text-gray-400 line-through">
              ${productData.oldPrice}
            </span>
          </div>

          {/* Colors */}
          <div className="mt-8">
            <p className="text-gray-600 mb-3">Select color :</p>
            <div className="flex gap-4">
              {productData.colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color.name)}
                  className={`w-8 h-8 rounded-full border-2 transition ${
                    selectedColor === color.name
                      ? "border-black scale-110"
                      : "border-transparent"
                  } ${color.code}`}
                />
              ))}
            </div>
          </div>

          {/* Storage */}
          <div className="mt-8 flex gap-4 flex-wrap">
            {productData.storage.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedStorage(size)}
                className={`px-6 py-3 rounded-lg border text-sm font-medium transition ${
                  selectedStorage === size
                    ? "border-red-500 text-red-500"
                    : "border-gray-300 text-gray-600 hover:border-gray-400"
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          {/* Description */}
          <p className="mt-8 text-gray-500 leading-relaxed max-w-lg">
            {productData.description}
          </p>

          {/* Info Section */}
          <div className="grid grid-cols-3 gap-6 mt-10">
            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div>
                <p className="text-sm text-gray-500">Free Delivery</p>
                <p className="text-sm font-semibold">
                  {productData.delivery}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div>
                <p className="text-sm text-gray-500">In Stock</p>
                <p className="text-sm font-semibold">
                  {productData.stock}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="text-sm font-semibold">
                  {productData.category}
                </p>
              </div>
            </div>
          </div>

          {/* Button */}
          <button className="mt-10 w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl text-lg font-medium transition">
            Add to Cart
          </button>
        </div>
      </div>
    </section>
  );
}