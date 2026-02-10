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
      <div className="container mx-auto px-4 pt-16 pb-8" style={{ maxWidth: '1172.63px' }}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
          {/* Column 1 - MultiKonnect */}
          <div className="w-full max-w-full overflow-hidden flex flex-col">
            <h2 className="text-2xl font-bold text-white mb-3 truncate">MultiKonnect</h2>
            <p className="text-sm text-white leading-relaxed break-words" style={{fontFamily: 'Montserrat', fontWeight: '400', fontStyle: 'normal', fontSize: '15.14px', lineHeight: '22.71px', letterSpacing: '0%', verticalAlign: 'middle', opacity: 1}}>
              Empowering your shopping experience for a smarter tomorrow!
            </p>
          </div>

          {/* Column 2 - Discover Multikonnect */}
          <div className="w-full max-w-full overflow-hidden flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4 break-words" style={{fontFamily: 'Montserrat', fontWeight: '600', fontStyle: 'normal', fontSize: '22.71px', lineHeight: '24.6px', letterSpacing: '-1.7px', verticalAlign: 'middle', opacity: 1}}>Discover Multikonnect</h3>
            <ul className="space-y-2">
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
                        className="text-white hover:text-white transition text-left text-sm" style={{fontFamily: 'var(--font-manrope), sans-serif', fontWeight: '400', fontStyle: 'normal', fontSize: '15.14px'}}>
                        {label}
                      </button>
                    </li>
                  );
                }
                
                return (
                  <li key={indx}>
                    <Link href={href}
                      className="text-white hover:text-white transition text-sm" style={{width: '127px', height: '18px', top: '-0px', fontFamily: 'Manrope', fontWeight: '400', fontStyle: 'normal', fontSize: '15.14px', lineHeight: '17.98px', verticalAlign: 'middle', opacity: 1}}>
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Column 3 - Useful links */}
          <div className="w-full max-w-full overflow-hidden flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4 break-words" style={{fontFamily: 'Montserrat', fontWeight: '600', fontStyle: 'normal', fontSize: '22.71px', lineHeight: '24.6px',  verticalAlign: 'middle', opacity: 1}}>Useful links</h3>
            <ul className="space-y-2">
              {usefulLinks.map(({ label, href }, indx) => (
                <li key={indx}>
                  <Link href={href} className="text-white hover:text-white transition text-sm truncate block" style={{fontFamily: 'var(--font-manrope), sans-serif', fontWeight: '400', fontStyle: 'normal', fontSize: '15.14px'}}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 - Privacy Policy */}
          <div className="w-full max-w-full overflow-hidden flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4 break-words" style={{fontFamily: 'Montserrat', fontWeight: '600', fontStyle: 'normal', fontSize: '22.71px', lineHeight: '24.6px', letterSpacing: '-1.7px', verticalAlign: 'middle', opacity: 1}}>Privacy Policy</h3>
            <ul className="space-y-2">
              {policyLinks.map(({ label, href }, indx) => (
                <li key={indx}>
                  <Link href={href} className="text-white hover:text-white transition text-sm truncate block" style={{fontFamily: 'var(--font-manrope), sans-serif', fontWeight: '400', fontStyle: 'normal', fontSize: '15.14px'}}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5 - Social Links */}
          <div className="w-full max-w-full overflow-hidden flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4 break-words" style={{fontFamily: 'Montserrat', fontWeight: '600', fontStyle: 'normal', fontSize: '22.71px', lineHeight: '24.6px', letterSpacing: '-1.7px', verticalAlign: 'middle', opacity: 1}}>Social Links</h3>
            
            <div className="flex gap-3 mb-6">
              {socialLinks.map(({ icon, href }, idx) => (
                <a
                  key={idx}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center transition" 
                  style={{ 
                    width: '41.6416015625px', 
                    height: '41.6416015625px', 
                    borderRadius: '47.32px',
                    border: '0.95px solid #FFFFFF',
                    opacity: 1
                  }}
                >
                  {icon}
                </a>
              ))}
            </div>

            <div className="space-y-1">
              <p className="text-sm text-gray-300" style={{fontFamily: 'var(--font-manrope), sans-serif', fontWeight: '400', fontStyle: 'normal', fontSize: '15.14px'}}>Email</p>
              <a href="mailto:Rajasaifuiux@gmail.com" className="text-sm text-white hover:text-gray-300 transition" style={{fontFamily: 'var(--font-manrope), sans-serif', fontWeight: '400', fontStyle: 'normal', fontSize: '15.14px'}}>
                Rajasaifuiux@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Close inner container before fluid bar */}
      </div>

      {/* Bottom bar (container-fluid) */}
      <div className="mt-12 bg-white text-[#1B1B1B] rounded-t-[60px] py-6 ">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-center md:text-left" style={{width: '390px', height: '24px', fontFamily: 'Manrope', fontWeight: '400', fontStyle: 'normal', fontSize: '20px', lineHeight: '24px', letterSpacing: '0%', verticalAlign: 'middle', opacity: 1}}>
            &copy; {t('header.multiKonnect')} 2025 | {t('footer.allRightsReserved')}
          </p>
          <button className="bg-vivid-red text-white font-medium hover:bg-red-600 transition flex items-center justify-center" style={{fontFamily: 'var(--font-manrope), sans-serif', fontWeight: '400', fontStyle: 'normal', width: '148px', height: '53px', borderRadius: '7px'}}>
            {t('footer.getStarted')} <span aria-hidden="true" className="ml-2">↗</span>
          </button>
        </div>
      </div>
    </footer>
  );
}