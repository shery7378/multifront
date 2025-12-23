            'use client';
import { useEffect, useState } from 'react';
import { ClockIcon, MapPinIcon, StarIcon, SunIcon } from '@heroicons/react/24/outline';
import GoogleMapController from '@/controller/GoogleMapController';
import ResponsiveText from './UI/ResponsiveText';
import IconButton from './UI/IconButton';
import { FaEuroSign } from 'react-icons/fa6';
import { useGetRequest } from '@/controller/getRequests';
import { useI18n } from '@/contexts/I18nContext';
import { translateCategoryName } from '@/utils/categoryTranslations';

export default function StoreBanner({ onModeChange, store }) {
  const { t } = useI18n();
  const [mode, setMode] = useState('Delivery');
  const [vendorRating, setVendorRating] = useState(
    typeof store?.rating === 'number' ? Number(store.rating) : null
  );
  const [vendorReviewCount, setVendorReviewCount] = useState(
    typeof store?.reviewCount === 'number' ? Number(store.reviewCount) : null
  );

  const { data: ratingData, error: ratingError, loading: ratingLoading, sendGetRequest } = useGetRequest();

  const handleModeChange = (value) => {
    setMode(value);
    if (onModeChange) onModeChange(value);
  };

  useEffect(() => {
    const idOrSlug = store?.id ?? store?.slug;
    if (!idOrSlug) return;
    sendGetRequest(`/stores/${idOrSlug}/rating`);
  }, [store?.id, store?.slug, sendGetRequest]);

  useEffect(() => {
    const payload = ratingData?.data;
    if (!payload) return;
    if (typeof payload.bayesian_rating !== 'undefined') {
      setVendorRating(Number(payload.bayesian_rating));
    }
    if (typeof payload.review_count !== 'undefined') {
      setVendorReviewCount(Number(payload.review_count));
    }
  }, [ratingData]);

  const hasLocation = store?.latitude && store?.longitude;
  const center = {
    lat: parseFloat(store?.latitude) || 0,
    lng: parseFloat(store?.longitude) || 0,
  };

  const categoriesList = Array.isArray(store?.categories)
    ? store.categories
    : typeof store?.categories === 'string'
      ? store.categories.split(',')
      : [];
  const translatedCategories = categoriesList
    .filter(Boolean)
    .map(cat => translateCategoryName(cat.trim(), t));
  const metaRow = [
    translatedCategories.join(' • '),
    store?.priceSymbol || undefined,
  ].filter(Boolean).join(' • ');
  const displayRating = typeof vendorRating === 'number' ? vendorRating : (typeof store?.rating === 'number' ? Number(store.rating) : null);
  const displayReviewCount = typeof vendorReviewCount === 'number' ? vendorReviewCount : (typeof store?.reviewCount === 'number' ? Number(store.reviewCount) : 0);
  const reviewText = `(${displayReviewCount}) ${t('product.viewAll')}`;
  const ratingValue = typeof displayRating === 'number' ? displayRating.toFixed(1) : null;
  const canDelivery = Boolean(store?.offersDelivery);
  const canPickup = Boolean(store?.offersPickup);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-6">
        <h4 className="text-lg font-semibold text-center lg:hidden">{store?.name}</h4>

        {/* Left: Banner */}
        <div className="flex justify-start items-start flex-shrink-0">
          <img
            src={store?.bannerImage}
            alt={store?.name || 'store banner'}
            className="w-full max-w-[517px] h-auto min-h-[320px] rounded-md object-cover"
          />
        </div>

        {/* Right: Info + Map */}
        <div className="grid w-full gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <ResponsiveText as="h2" minSize="1rem" maxSize="1.375rem" className="font-semibold text-oxford-blue">
                {store?.name}
              </ResponsiveText>
              <div className="flex gap-2 items-center text-sm text-gray-600">
                <StarIcon className="w-5 h-5 text-amber-500" />
                {ratingValue && <span className="text-oxford-blue font-medium">{ratingValue}</span>}
                <span className="text-[13px] text-gray-500">{reviewText}</span>
              </div>
              {metaRow && (
                <div className="mt-1 text-[13px] text-gray-500">{metaRow} • <span className="underline cursor-pointer">{t('common.info')}</span></div>
              )}
              {store?.fullAddress && (
                <div className="text-[12px] text-gray-500 mt-1">{store.fullAddress}</div>
              )}
            </div>

            <div className="flex-shrink-0 self-start sm:self-center flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center gap-2">
              <button
                onClick={() => handleModeChange('Delivery')}
                disabled={!canDelivery}
                className={`px-4 h-9 rounded-full text-sm ${mode === 'Delivery' ? 'bg-vivid-red text-white' : 'bg-gray-100 text-oxford-blue'} ${!canDelivery ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {t('nav.delivery')}
              </button>
              <button
                onClick={() => handleModeChange('Pickup')}
                disabled={!canPickup}
                className={`px-4 h-9 rounded-full text-sm ${mode === 'Pickup' ? 'bg-vivid-red text-white' : 'bg-gray-100 text-oxford-blue'} ${!canPickup ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {t('nav.pickup')}
              </button>
              </div>
              {store?.user_id && (
                <button
                  onClick={() => {
                    // Trigger Daraz chat widget to open with vendor
                    const event = new CustomEvent('openVendorChat', {
                      detail: { vendorId: store.user_id }
                    });
                    window.dispatchEvent(event);
                  }}
                  className="px-4 h-9 rounded-full bg-primary hover:bg-primary-dark text-white text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {t('product.contactVendor') || 'Contact Vendor'}
                </button>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-700">{store?.description}</p>

          <div className="bg-white rounded-lg w-full border border-gray-200 overflow-hidden">
            {hasLocation ? (
              <GoogleMapController
                center={center}
                zoom={14}
                marker
                className="w-full h-64 sm:h-72 lg:h-80"
                options={{
                  disableDefaultUI: true,
                  draggable: false,
                  scrollwheel: false,
                  disableDoubleClickZoom: true,
                  keyboardShortcuts: false,
                }}
                fallback={<img src="/images/map.jpg" alt="fallback map" className="w-full h-64 sm:h-72 lg:h-80 object-cover" />}
              />
            ) : (
              <img src="/images/map.jpg" alt="fallback map" className="w-full h-64 sm:h-72 lg:h-80 object-cover" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center px-2 flex-1">
      <div className="!w-8 p-1">
        <IconButton icon={Icon} iconClasses="!text-black !w-4 !h-4" className="!min-w-6 !min-h-6" />
      </div>
      <div className="text-[8px] md:text-[14px]">
        <span className="font-semibold text-oxford-blue mb-1">{label}</span>
        <p className="font-normal text-oxford-blue/60">{value}</p>
      </div>
    </div>
  );
}
