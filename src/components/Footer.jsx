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
    { label: t('footer.signUpToDeliver'), href: "/sign-up" },
    { label: t('footer.addYourShop'), href: "/sign-up" },
    { label: t('footer.promotions'), href: "#" },
    { label: t('footer.createBusinessAccount'), href: "/sign-up" },
  ];

  const usefulLinks = [
    { label: t('footer.storeNearMe'), href: "#" },
    { label: t('footer.pickupNearMe'), href: "#" },
    { label: t('footer.allCitiesCountries'), href: "#" },
  ];

  const policyLinks = [
    { label: t('footer.termsConditions'), href: "#" },
    { label: t('footer.cookiePolicy'), href: "#" },
    { label: t('footer.refundPolicy'), href: "#" },
  ];

  const socialLinks = [
    { icon: <FaFacebookF className="text-xl text-white" />, href: "" },
    { icon: <FaLinkedinIn className="text-xl text-white" />, href: "" },
    { icon: <FaInstagram className="text-xl text-white" />, href: "" },
  ];

  return (
    <footer className="bg-[#1E1E1E] text-white">
      <div className="container mx-auto px-6 py-12 ">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Column 1 - MultiKonnect */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-white mb-3">MultiKonnect</h2>
            <p className="text-sm text-gray-300 leading-relaxed" style={{fontFamily: 'Montserrat', fontWeight: '400', fontStyle: 'normal', fontSize: '15.14px', width: '233.6338653564453px', height: '59px', lineHeight: '22.71px', letterSpacing: '0%', verticalAlign: 'middle', opacity: 1}}>
              Empowering your shopping experience for a smarter tomorrow!
            </p>
          </div>

          {/* Column 2 - Discover Multikonnect */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Discover Multikonnect</h3>
            <ul className="space-y-2">
              {discoverLinks.map(({ label, href }, indx) => {
                // Handle Promotions link specially
                if (label === t('footer.promotions')) {
                  return (
                    <li key={indx}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          openModal();
                        }}
                        className="text-gray-300 hover:text-white transition text-left text-sm" style={{fontFamily: 'var(--font-manrope), sans-serif', fontWeight: '400', fontStyle: 'normal', fontSize: '15.14px'}}>
                        {label}
                      </button>
                    </li>
                  );
                }
                
                return (
                  <li key={indx}>
                    <Link href={href}
                      className="text-gray-300 hover:text-white transition text-sm" style={{width: '127px', height: '18px', top: '-0px', fontFamily: 'Manrope', fontWeight: '400', fontStyle: 'normal', fontSize: '15.14px', lineHeight: '17.98px', letterSpacing: '-0.28px', verticalAlign: 'middle', opacity: 1}}>
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Column 3 - Useful links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Useful links</h3>
            <ul className="space-y-2">
              {usefulLinks.map(({ label, href }, indx) => (
                <li key={indx}>
                  <Link href={href} className="text-gray-300 hover:text-white transition text-sm" style={{fontFamily: 'var(--font-manrope), sans-serif', fontWeight: '400', fontStyle: 'normal', fontSize: '15.14px'}}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 - Privacy Policy */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Privacy Policy</h3>
            <ul className="space-y-2">
              {policyLinks.map(({ label, href }, indx) => (
                <li key={indx}>
                  <Link href={href} className="text-gray-300 hover:text-white transition text-sm" style={{fontFamily: 'var(--font-manrope), sans-serif', fontWeight: '400', fontStyle: 'normal', fontSize: '15.14px'}}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5 - Social Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Social Links</h3>
            
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
              <a href="mailto:info@multikonnect.com" className="text-sm text-white hover:text-gray-300 transition" style={{fontFamily: 'var(--font-manrope), sans-serif', fontWeight: '400', fontStyle: 'normal', fontSize: '15.14px'}}>
                info@multikonnect.com
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