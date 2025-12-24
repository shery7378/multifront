//src/components/LandingPageHeader.jsx
'use client';
import Link from 'next/link';
import { MapPinIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/contexts/I18nContext';
import LanguageSwitcher from './LanguageSwitcher';
import CurrencySwitcher from './CurrencySwitcher';

export default function LandingPageHeader({ postcode, onOpenModal }) {
  const { t } = useI18n();

  return (
    <header className="shadow-sm border-b border-gray-200">
      <nav className="container mx-auto flex justify-between items-center h-20">
        {/* Logo */}
        <Link href="/home">
          <span className="text-xl font-bold font-[bricle] text-vivid-red">{t('header.multiKonnect')}</span>
        </Link>

        {/* Right Side Buttons - Desktop */}
        <div className="md:flex items-center gap-4 hidden">
          {/* Language Switcher */}
          <LanguageSwitcher />
          {/* Currency Switcher */}
          <CurrencySwitcher />
          
          {/* Address Button */}
          <button
            onClick={onOpenModal}
            className="flex items-center rounded-full border h-[46px] w-[248px] px-4"
          >
            <MapPinIcon className="w-5 h-5 text-gray-600 mr-2" />
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap truncate">
              {postcode ? postcode : t('header.enterDeliveryAddress')}
            </span>
            <ChevronDownIcon className="w-5 h-5 text-gray-600 ml-2" />
          </button>

          {/* Login Button */}
          <Link
            href="/login"
            className="text-sm text-baltic-black font-medium hover:underline cursor-pointer"
          >
            {t('nav.login')}
          </Link>

          {/* Sign Up Button */}
          <Link
            href="/sign-up"
            className="bg-vivid-red grid justify-center items-center text-white text-sm font-medium rounded-full h-[46px] w-[110px]"
          >
            {t('nav.signUp')}
          </Link>
        </div>

        {/* Mobile Currency and Language Switchers */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <CurrencySwitcher />
        </div>
      </nav>
    </header>
  );
}

