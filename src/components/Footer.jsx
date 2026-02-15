//src/components/Footer.jsx
// Version: 2025-02-15-SpacingReduct-Aggressive
'use client';

import { FaFacebookF, FaLinkedinIn, FaInstagram } from "react-icons/fa";
import Link from "next/link";
import { useI18n } from '@/contexts/I18nContext';
import { usePromotionsModal } from '@/contexts/PromotionsModalContext';
import { getStorageUrl } from '@/utils/urlHelpers';

export default function Footer() {
  const { t } = useI18n();
  const { openModal } = usePromotionsModal();

  const discoverLinks = [
    { label: "Discover Multikonnect", href: "/about" },
    { label: "Sign up to deliver", href: "/sign-up" },
    { label: "Add your Shop", href: "/sign-up" },
    { label: "Promotions", href: "#" },
    { label: "Create a Business account", href: "/sign-up" },
  ];

  const usefulLinks = [
    { label: "Store Near me", href: "#" },
    { label: "View all cities", href: "#" },
    { label: "Pickup near me", href: "#" },
    { label: "View all countries", href: "#" },
  ];

  const policyLinks = [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms & Conditions", href: "#" },
    { label: "Cookie Policy", href: "#" },
    { label: "Refund Policy", href: "#" },
  ];

  const socialLinks = [
    { icon: <FaFacebookF className="text-xl text-white" />, href: "" },
    { icon: <FaLinkedinIn className="text-xl text-white" />, href: "" },
    { icon: <FaInstagram className="text-xl text-white" />, href: "" },
  ];

  // Common font style to maintain the specific look required
  const fontStyle = { fontFamily: 'var(--font-manrope), sans-serif' };

  return (
    <footer className="bg-[#1E1E1E] text-white" data-version="2025-02-15-SpacingReduct-Aggressive">
      <div className="container mx-auto px-4 pt-8 sm:pt-10 pb-6" style={{ maxWidth: '1172.63px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1.4fr_1fr_1fr_1fr] gap-6 lg:gap-8 items-start">
          
          {/* Column 1 - MultiKonnect */}
          <div className="flex flex-col">
            <img 
              src={getStorageUrl('/storage/images/logo/MultiKonnect.png')}
              alt="MultiKonnect" 
              className="h-8 mb-4 w-auto object-contain"
            />
            <p 
              className="text-[15px] text-white leading-relaxed opacity-100 max-w-[200px]" 
              style={{ ...fontStyle, lineHeight: '1.4', color: '#FFFFFF' }}
            >
              Empowering your shopping experience for a smarter tomorrow!
            </p>
          </div>

          {/* Column 2 - Discover Multikonnect */}
         <div className="flex flex-col"> 
            <h3 
              className="text-[22px] font-semibold text-white mb-2 tracking-tight whitespace-nowrap min-w-fit" 
              style={fontStyle}
            >
              Discover Multikonnect
            </h3>
            <ul className="space-y-1">
              {discoverLinks.map(({ label, href }, indx) => {
                // Skip the title entry
                if (indx === 0) return null;
                
                if (label === "Promotions") {
                  return (
                    <li key={indx}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          openModal();
                        }}
                        className="text-[15px] text-white hover:text-white transition-colors text-left font-normal block py-0.5"
                        style={fontStyle}
                      >
                        {label}
                      </button>
                    </li>
                  );
                }
                
                return (
                  <li key={indx}>
                    <Link 
                      href={href} 
                      className="text-[15px] text-white hover:text-white transition-colors block font-normal py-0.5"
                      style={fontStyle}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Column 3 - Useful links */}
          <div className="flex flex-col">
            <h3 
              className="text-[22px] font-semibold text-white mb-2 tracking-tight whitespace-nowrap" 
              style={fontStyle}
            >
              Useful links
            </h3>
            <ul className="space-y-1">
              {usefulLinks.map(({ label, href }, indx) => (
                <li key={indx}>
                  <Link 
                    href={href} 
                    className="text-[15px] text-white hover:text-white transition-colors block font-normal py-0.5"
                    style={fontStyle}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 - Privacy Policy */}
          <div className="flex flex-col">
            <h3 
              className="text-[22px] font-semibold text-white mb-2 tracking-tight whitespace-nowrap" 
              style={fontStyle}
            >
              Privacy Policy
            </h3>
            <ul className="space-y-1">
              {policyLinks.map(({ label, href }, indx) => (
                <li key={indx}>
                  <Link 
                    href={href} 
                    className="text-[15px] text-white hover:text-white transition-colors block font-normal py-0.5"
                    style={fontStyle}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5 - Social Links */}
          <div className="flex flex-col">
            <h3 
              className="text-[22px] font-semibold text-white mb-2 tracking-tight whitespace-nowrap" 
              style={fontStyle}
            >
              Social Links
            </h3>
            
            <div className="flex gap-4 mb-3">
              {socialLinks.map(({ icon, href }, idx) => (
                <a
                  key={idx}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-8 h-8 rounded-full border border-white/80 hover:bg-white/10 transition-colors"
                >
                  <div className="text-sm text-white flex items-center justify-center">
                    {icon}
                  </div>
                </a>
              ))}
            </div>

            <div className="space-y-0.5">
              <p className="text-[15px] text-white font-normal" style={{ ...fontStyle, color: '#FFFFFF' }}>Email</p>
              <a 
                href="mailto:Info@multikonnect.com" 
                className="text-[15px] text-white hover:text-white transition-colors block font-normal break-all py-0.5"
                style={fontStyle}
              >
                Info@multikonnect.com
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar (container-fluid) */}
      <div className="mt-6 sm:mt-8 bg-white text-[#1B1B1B] rounded-t-[30px] py-4">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p 
            className="text-center sm:text-left text-[14px] sm:text-[15px]" 
            style={fontStyle}
          >
            &copy; {t('header.multiKonnect')} 2025 | {t('footer.allRightsReserved')}
          </p>
          <button 
            className="bg-[#F24E2E] text-white font-medium hover:bg-red-600 transition flex items-center justify-center text-sm rounded-lg px-6 py-3"
            style={fontStyle}
          >
            {t('footer.getStarted')} <span aria-hidden="true" className="ml-2">↗</span>
          </button>
        </div>
      </div>
    </footer>
  );
}