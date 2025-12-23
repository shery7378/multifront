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
    <footer className="bg-[#1B1B1B] text-bright-gray pt-12 ">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 justify-between">
          {/* Column 1 */}
          <div>
            <ResponsiveText
              as="h2"
              minSize="1.2rem"
              maxSize="1.2rem"
              className="text-bright-gray font-[bricle]"
            >
              {t('header.multiKonnect')}
            </ResponsiveText>
            <p className="text-sm mt-2 leading-relaxed text-bright-gray">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Column 2 */}
          <div>
            <ResponsiveText
              as="h3"
              minSize="0.8725rem"
              maxSize="0.9rem"
              className="font-semibold mb-2 text-bright-gray"
            >
              {t('footer.discoverMultikonnect')}
            </ResponsiveText>
            <ul className="text-xs space-y-1 text-white">
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
                        className="hover:text-bright-gray transition text-left"
                      >
                        {label}
                      </button>
                    </li>
                  );
                }
                
                return (
                  <li key={indx}>
                    <Link href={href}
                      className="hover:text-bright-gray transition">
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <ResponsiveText
              as="h3"
              minSize="0.8725rem"
              maxSize="0.9rem"
              className="font-semibold mb-2 text-bright-gray"
            >
              {t('footer.usefulLinks')}
            </ResponsiveText>
            <ul className="text-xs space-y-1 text-white">
              {usefulLinks.map(({ label, href }, indx) => (
                <li key={indx}>
                  <Link href={href} className="hover:text-bright-gray transition">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <ResponsiveText
              as="h3"
              minSize="0.8725rem"
              maxSize="0.9rem"
              className="font-semibold mb-2 text-bright-gray"
            >
              {t('footer.privacyPolicy')}
            </ResponsiveText>
            <ul className="text-xs space-y-1 text-white">
              {policyLinks.map(({ label, href }, indx) => (
                <li key={indx}>
                  <Link href={href} className="hover:text-bright-gray transition">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5 */}
          <div>
            <ResponsiveText
              as="h3"
              minSize="0.8725rem"
              maxSize="0.9rem"
              className="font-semibold mb-2 text-bright-gray"
            >
              {t('footer.socialLinks')}
            </ResponsiveText>

            <div className="flex gap-4 mt-1 mb-3">
              {socialLinks.map(({ icon, href }, idx) => (
                <a
                  key={idx}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-red-500 hover:shadow-[0_0_10px_#ef4444] transition cursor-pointer"
                >
                  {icon}
                </a>
              ))}
            </div>

            <div className="text-sm text-white space-y-1">
              <p className="font-semibold text-bright-gray">{t('footer.email')}</p>
              <p>info@MultiKonnect.com</p>
            </div>
          </div>
        </div>

        {/* Close inner container before fluid bar */}
      </div>

      {/* Bottom bar (container-fluid) */}
      <div className="mt-10 bg-white text-[#1B1B1B] rounded-t-[48px] py-4 mb-1">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-center md:text-left">
            &copy; {t('header.multiKonnect')} 2025 | {t('footer.allRightsReserved')}
          </p>
          <button className="bg-vivid-red text-white px-6 py-2 rounded-md font-medium hover:bg-red-600 transition">
            {t('footer.getStarted')} <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
    </footer>
  );
}