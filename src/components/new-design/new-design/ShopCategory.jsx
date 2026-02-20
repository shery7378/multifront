'use client';

import Link from 'next/link';
import Image from 'next/image';

const CATEGORIES = [
  {
    name: 'iPhone',
    href: '/category/iphone',
    iconImage: '/images/new-icons/iphone.svg',
  },
  {
    name: 'Android Phone',
    href: '/category/android',
    iconImage: '/images/new-icons/android.svg',
  },
  {
    name: 'Laptops',
    href: '/category/laptops',
    iconImage: '/images/new-icons/laptop.svg',
  },
  {
    name: 'Headphone',
    href: '/category/headphone',
    iconImage: '/images/new-icons/headphone.svg',
  },
  {
    name: 'Accessories',
    href: '/category/accessories',
    iconImage: '/images/new-icons/accessories.svg',
  },
  {
    name: "Android Phone",
    href: '/category/watches',
    iconImage: '/images/new-icons/android.svg',
  },
  {
    name: 'watches',
    href: '/category/watches',
    iconImage: '/images/new-icons/watch.svg',
  },
  {
    name: "Tablets",
    href: '/category/tablets',
    iconImage: '/images/new-icons/tablet.svg',
  },
  {
    name: 'Iphone',
    href: '/category/android',
    iconImage: '/images/new-icons/iphone.svg',
  },
];

export default function ShopCategory() {
  return (
    <section className="w-full bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <h2 className="text-[#092E3B] font-bold text-xl sm:text-[22px] mb-6">
          Shop by Category
        </h2>
        <div className="flex flex-wrap items-center justify-start gap-6 sm:gap-8">
          {CATEGORIES.map(({ name, href, iconImage }) => (
            <Link
              key={name}
              href={href}
              className="flex flex-col items-center gap-3 group"
            >
              <div
                className="lg:w-[101px] lg:h-[101px] w-[80px] h-[80px] rounded-full bg-[#F4F4F4] flex items-center justify-center group-hover:bg-[#EAEAEA] transition-colors"
                aria-hidden
              >
                <Image src={iconImage} alt={name} width={50} height={50} className="w-[50px] h-[50px] object-contain" />
              </div>
              <span className="text-[#092E3B] text-base font-medium text-center">
                {name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
