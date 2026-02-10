//src/components/Footer.jsx
'use client';
import ResponsiveText from "@/components/UI/ResponsiveText";
import { FaFacebookF, FaLinkedinIn, FaInstagram } from "react-icons/fa";
import Link from "next/link";
import { useI18n } from '@/contexts/I18nContext';
import { usePromotionsModal } from '@/contexts/PromotionsModalContext';

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

  return (
    <footer className="bg-[#1E1E1E] text-white">
      <div className="container mx-auto px-4 pt-8 sm:pt-12 md:pt-16 pb-6 sm:pb-8" style={{ maxWidth: '1172.63px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
          {/* Column 1 - MultiKonnect */}
          <div className="w-full max-w-full overflow-hidden flex flex-col sm:col-span-2 lg:col-span-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 truncate" style={{fontFamily: 'var(--font-manrope), sans-serif', letterSpacing: '-1.1px'}}>MultiKonnect</h2>
            <p className="text-xs sm:text-sm text-white leading-relaxed break-words" style={{fontFamily: 'var(--font-manrope), sans-serif', fontWeight: '400', fontStyle: 'normal', fontSize: '13px', lineHeight: '20px', letterSpacing: '0%', verticalAlign: 'middle', opacity: 1}}>
              Empowering your shopping experience for a smarter tomorrow!
            </p>
          </div>

          {/* Column 2 - Discover Multikonnect */}
          <div className="w-full max-w-full overflow-hidden flex flex-col sm:col-span-1 lg:col-span-1">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 break-words" style={{fontFamily: 'var(--font-manrope), sans-serif', fontWeight: '600', fontStyle: 'normal', fontSize: '16px', lineHeight: '20px', verticalAlign: 'middle', opacity: 1, letterSpacing: '-1.1px'}}>Discover Multikonnect</h3>
            <ul className="space-y-1 sm:space-y-2">
              {discoverLinks.map(({ label, href }, indx) => {
                // Skip the first item as it's the heading
                if (indx === 0) return null;
                
                // Handle Promotions link specially
                if (label === "Promotions") {
                  return (
                    <li key={indx}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          openModal();
                        }}
                        className="text-white hover:text-white transition text-left text-xs sm:text-sm" style={{fontFamily: 'var(--font-manrope), sans-serif', fontWeight: '400', fontStyle: 'normal', fontSize: '12px'}}>
                        {label}
                      </button>
                    </li>
                  );
                }
                
                return (
                  <li key={indx}>
                    <Link href={href}
                      className="text-white hover:text-white transition text-xs sm:text-sm text-left" style={{fontFamily: 'var(--font-manrope), sans-serif', fontWeight: '400', fontStyle: 'normal', fontSize: '12px', lineHeight: '16px', verticalAlign: 'middle', opacity: 1}}>
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Column 3 - Useful links */}
          <div className="w-full max-w-full overflow-hidden flex flex-col sm:col-span-1 lg:col-span-1">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 break-words" style={{fontFamily: 'var(--font-manrope), sans-serif', fontWeight: '600', fontStyle: 'normal', fontSize: '16px', lineHeight: '20px', verticalAlign: 'middle', opacity: 1, letterSpacing: '-1.1px'}}>Useful links</h3>
            <ul className="space-y-1 sm:space-y-2">
              {usefulLinks.map(({ label, href }, indx) => (
                <li key={indx}>
                  <Link href={href} className="text-white hover:text-white transition text-xs sm:text-sm truncate block" style={{fontFamily: 'var(--font-manrope), sans-serif', fontWeight: '400', fontStyle: 'normal', fontSize: '12px'}}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 - Privacy Policy */}
          <div className="w-full max-w-full overflow-hidden flex flex-col sm:col-span-1 lg:col-span-1">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 break-words" style={{fontFamily: 'var(--font-manrope), sans-serif', fontWeight: '600', fontStyle: 'normal', fontSize: '16px', lineHeight: '20px', verticalAlign: 'middle', opacity: 1, letterSpacing: '-1.1px'}}>Privacy Policy</h3>
            <ul className="space-y-1 sm:space-y-2">
              {policyLinks.map(({ label, href }, indx) => (
                <li key={indx}>
                  <Link href={href} className="text-white hover:text-white transition text-xs sm:text-sm truncate block" style={{fontFamily: 'var(--font-manrope), sans-serif', fontWeight: '400', fontStyle: 'normal', fontSize: '12px'}}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5 - Social Links */}
          <div className="w-full max-w-full overflow-hidden flex flex-col sm:col-span-2 lg:col-span-1">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 break-words" style={{fontFamily: 'var(--font-manrope), sans-serif', fontWeight: '600', fontStyle: 'normal', fontSize: '16px', lineHeight: '20px', verticalAlign: 'middle', opacity: 1, letterSpacing: '-1.1px'}}>Social Links</h3>
            
            <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
              {socialLinks.map(({ icon, href }, idx) => (
                <a
                  key={idx}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center transition" 
                  style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '40px',
                    border: '0.8px solid #FFFFFF',
                    opacity: 1
                  }}
                >
                  <div className="text-sm text-white">
                    {icon}
                  </div>
                </a>
              ))}
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-300" style={{fontFamily: 'var(--font-manrope), sans-serif', fontWeight: '400', fontStyle: 'normal', fontSize: '12px'}}>Email</p>
              <a href="mailto:Rajasaifuiux@gmail.com" className="text-xs text-white hover:text-gray-300 transition" style={{fontFamily: 'var(--font-manrope), sans-serif', fontWeight: '400', fontStyle: 'normal', fontSize: '12px'}}>
                Rajasaifuiux@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Close inner container before fluid bar */}
      </div>

      {/* Bottom bar (container-fluid) */}
      <div className="mt-8 sm:mt-12 bg-white text-[#1B1B1B] rounded-t-[30px] py-4 sm:py-6 ">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-center sm:text-left text-xs sm:text-sm" style={{fontFamily: 'var(--font-manrope), sans-serif', fontWeight: '400', fontStyle: 'normal', fontSize: '12px', lineHeight: '16px', letterSpacing: '0%', verticalAlign: 'middle', opacity: 1}}>
            &copy; {t('header.multiKonnect')} 2025 | {t('footer.allRightsReserved')}
          </p>
          <button className="bg-vivid-red text-white font-medium hover:bg-red-600 transition flex items-center justify-center text-xs sm:text-sm" style={{fontFamily: 'var(--font-manrope), sans-serif', fontWeight: '400', fontStyle: 'normal', width: '100px', height: '40px', borderRadius: '6px'}}>
            {t('footer.getStarted')} <span aria-hidden="true" className="ml-2">↗</span>
          </button>
        </div>
      </div>
    </footer>
  );
}