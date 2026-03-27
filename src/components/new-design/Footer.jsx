'use client';

import Link from 'next/link';
import { FaInstagram } from 'react-icons/fa';
import { getStorageUrl } from '@/utils/urlHelpers';

export default function Footer() {
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || '/login';

  const discoverLinks = [
    { label: 'Sign up to deliver', href: '/sign-up' },
    { label: 'Add your Shop', href: dashboardUrl },
    { label: 'Promotions', href: '#' },
    { label: 'Create a Business account', href: dashboardUrl },
  ];

  const usefulLinks = [
    { label: 'Store Near me', href: '/stores' },
    { label: 'Browse Stores', href: '/browse-stores' },
    { label: 'Pickup near me', href: '/pick-up' },
    { label: 'Live Selling', href: '/live-selling' },
  ];

  const policyLinks = [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms & Conditions', href: '/terms-conditions' },
    { label: 'Cookie Policy', href: '/cookie-policy' },
    { label: 'Refund Requests', href: '/refund-requests' },
  ];

  return (
    <footer className="bg-[#1E1E1E] text-white font-manrope">

      {/* Main Section */}
      <div className="max-w-[1172px] mx-auto px-4 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand */}
          <div>
            <img
              src={getStorageUrl('/storage/new-icons/MultiKonnect.svg')}
              alt="MultiKonnect"
              className="h-6 mb-6"
            />
            <p className="text-[15.14px] leading-[22.71px] font-light max-w-[234px]">
              Empowering your shopping experience for a smarter tomorrow !
            </p>
          </div>

          {/* Discover */}
          <div>
            <h3 className="font-semibold text-[22.71px] leading-[24.61px] tracking-[-1.7px] mb-4">
              Discover Multikonnect
            </h3>
            <ul className="space-y-3">
              {discoverLinks.map((item, i) => (
                <li key={i}>
                  <Link
                    href={item.href}
                    className="font-normal text-[15.14px] leading-[17.98px] tracking-[-0.28px] hover:text-[#FF6B35] transition"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Useful */}
          <div>
            <h3 className="font-semibold text-[22.71px] leading-[24.61px] tracking-[-1.7px] mb-4">
              Useful Links
            </h3>
            <ul className="space-y-3">
              {usefulLinks.map((item, i) => (
                <li key={i}>
                  <Link
                    href={item.href}
                    className="font-normal text-[15.14px] leading-[17.98px] tracking-[-0.28px] hover:text-[#FF6B35] transition"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policy */}
          <div>
            <h3 className="font-semibold text-[22.71px] leading-[24.61px] tracking-[-1.7px] mb-4">
              Policies
            </h3>
            <ul className="space-y-3">
              {policyLinks.map((item, i) => (
                <li key={i}>
                  <Link
                    href={item.href}
                    className="font-normal text-[15.14px] leading-[17.98px] tracking-[-0.28px] hover:text-[#FF6B35] transition"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-semibold text-[22.71px] leading-[24.61px] tracking-[-1.7px] mb-4">
              Social Links
            </h3>

            <div className="flex gap-3 mb-6">
              <a className="w-9 h-9 rounded-full border border-white flex items-center justify-center hover:bg-white hover:text-black transition">
                <svg viewBox="0 0 320 512" width="14" fill="currentColor">
                  <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"/>
                </svg>
              </a>

              <a className="w-9 h-9 rounded-full border border-white flex items-center justify-center hover:bg-white hover:text-black transition">
                <svg viewBox="0 0 448 512" width="14" fill="currentColor">
                  <path d="M100.28 448H7.4V148.9h92.88z"/>
                </svg>
              </a>

              <a className="w-9 h-9 rounded-full border border-white flex items-center justify-center hover:bg-white hover:text-black transition">
                <FaInstagram size={16} />
              </a>
            </div>

            <p className="font-normal text-[15.14px] leading-[17.98px] tracking-[-0.28px]">
              Email
            </p>
            <a
              href="mailto:info@multikonnect.com"
              className="font-normal text-[15.14px] leading-[17.98px] tracking-[-0.28px] hover:text-[#FF6B35] transition"
            >
              info@multikonnect.com
            </a>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-white rounded-t-[30px]">
        <div className="max-w-[1172px] mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-4">

          <p className="text-[#1B1B1B] text-[20px] font-light text-center md:text-left">
            © MultiKonnect 2026 | All rights reserved.
          </p>

          <Link
            href="/sign-up"
            className="bg-[#F34222] text-white w-[148px] h-[53px] rounded-[7px] flex items-center justify-center hover:opacity-90 transition"
          >
            Get Started
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          </Link>

        </div>
      </div>

    </footer>
  );
}
