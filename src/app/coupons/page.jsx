//src/app/coupons/page.jsx
'use client';
import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { useGetRequest } from '@/controller/getRequests';
import ResponsiveText from "@/components/UI/ResponsiveText";
import { FaTag, FaCopy, FaCheck, FaClock } from 'react-icons/fa6';
import { FaCalendarAlt, FaInfoCircle, FaShippingFast } from 'react-icons/fa';

export default function CouponsPage() {
  const { isAuthenticated, token } = useSelector((state) => state.auth);
  const [copiedCode, setCopiedCode] = useState(null);
  const [activeTab, setActiveTab] = useState('available'); // 'available', 'used', 'expired'

  const {
    data,
    error,
    loading,
    sendGetRequest: getCoupons
  } = useGetRequest();

  useEffect(() => {
    if (isAuthenticated && token) {
      getCoupons('/account/coupons', true);
    }
  }, [isAuthenticated, token]);

  // Get coupons data - must be before any early returns
  const coupons = data?.data || [];

  // Categorize coupons - MUST be called before any conditional returns
  const categorizedCoupons = useMemo(() => {
    const available = coupons.filter(c => c.is_available && !c.pivot?.is_used);
    const used = coupons.filter(c => c.pivot?.is_used);
    const expired = coupons.filter(c => c.is_expired && !c.pivot?.is_used);
    
    return { available, used, expired };
  }, [coupons]);

  // Get coupons for active tab - MUST be called before any conditional returns
  const displayCoupons = useMemo(() => {
    switch (activeTab) {
      case 'used':
        return categorizedCoupons.used;
      case 'expired':
        return categorizedCoupons.expired;
      case 'available':
      default:
        return categorizedCoupons.available;
    }
  }, [activeTab, categorizedCoupons]);

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatValue = (coupon) => {
    if (coupon.is_percent) {
      return `${coupon.value}%`;
    }
    return `$${coupon.value}`;
  };

  // Early returns AFTER all hooks
  if (!isAuthenticated) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-gray-600 mb-4">Please log in to view your coupons.</p>
        <a href="/login" className="text-vivid-red hover:underline">Log in</a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-10">
        <p className="text-red-500">Failed to load coupons: {error}</p>
      </div>
    );
  }

  const tabs = [
    { id: 'available', label: 'Available', count: categorizedCoupons.available.length },
    { id: 'used', label: 'Used', count: categorizedCoupons.used.length },
    { id: 'expired', label: 'Expired', count: categorizedCoupons.expired.length },
  ];

  return (
    <div className="px-4">
      <ResponsiveText 
        as="h1" 
        minSize="1.5rem" 
        maxSize="2rem" 
        className="font-semibold text-oxford-blue mb-6"
      >
        My Coupons
      </ResponsiveText>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-vivid-red text-vivid-red'
                : 'border-transparent text-gray-600 hover:text-oxford-blue'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id
                  ? 'bg-vivid-red text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {displayCoupons.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-300 rounded-xl bg-white">
          <FaTag className="mx-auto text-6xl text-gray-300 mb-4" />
          <div className="text-xl font-medium text-oxford-blue mb-2">
            {activeTab === 'available' && 'No available coupons'}
            {activeTab === 'used' && 'No used coupons'}
            {activeTab === 'expired' && 'No expired coupons'}
          </div>
          <div className="text-gray-500 mb-6">
            {activeTab === 'available' && 'You don\'t have any available coupons at the moment.'}
            {activeTab === 'used' && 'You haven\'t used any coupons yet.'}
            {activeTab === 'expired' && 'You don\'t have any expired coupons.'}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayCoupons.map((coupon) => {
            const isUsed = coupon.pivot?.is_used || false;
            const isExpired = coupon.is_expired || false;
            const usedAt = coupon.pivot?.used_at;

            // Determine status and styling
            let statusLabel = 'Available';
            let statusColor = 'bg-green-500';
            let borderColor = 'border-vivid-red';
            let bgColor = 'bg-white';
            let opacity = '';

            if (isUsed) {
              statusLabel = 'Used';
              statusColor = 'bg-gray-400';
              borderColor = 'border-gray-300';
              bgColor = 'bg-gray-50';
              opacity = 'opacity-75';
            } else if (isExpired) {
              statusLabel = 'Expired';
              statusColor = 'bg-orange-500';
              borderColor = 'border-orange-300';
              bgColor = 'bg-orange-50';
              opacity = 'opacity-90';
            }

            return (
              <div
                key={coupon.id}
                className={`${bgColor} rounded-xl border-2 p-6 relative ${borderColor} ${opacity} ${
                  !isUsed && !isExpired ? 'shadow-md hover:shadow-lg transition-shadow' : ''
                }`}
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${statusColor}`}
                  >
                    {statusLabel}
                  </span>
                </div>

                {/* Coupon Name */}
                <h3 className="text-xl font-bold text-oxford-blue mb-3 pr-20">
                  {coupon.name}
                </h3>

                {/* Discount Value */}
                <div className="mb-4">
                  <span className="text-3xl font-bold text-vivid-red">
                    {formatValue(coupon)}
                  </span>
                  <span className="text-gray-600 ml-2">off</span>
                </div>

                {/* Coupon Code */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <code className="flex-1 text-lg font-mono font-bold text-oxford-blue">
                      {coupon.code}
                    </code>
                    <button
                      onClick={() => handleCopyCode(coupon.code)}
                      className={`p-2 rounded-lg transition-colors ${
                        copiedCode === coupon.code
                          ? 'bg-green-500 text-white'
                          : isUsed || isExpired
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-vivid-red text-white hover:bg-red-700'
                      }`}
                      disabled={isUsed || isExpired}
                      title={isUsed || isExpired ? 'Cannot copy expired or used coupon' : 'Copy code'}
                    >
                      {copiedCode === coupon.code ? (
                        <FaCheck className="w-4 h-4" />
                      ) : (
                        <FaCopy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Coupon Details */}
                <div className="space-y-2 text-sm text-gray-600">
                  {coupon.minimum_spend && (
                    <div className="flex items-center gap-2">
                      <FaInfoCircle className="w-4 h-4" />
                      <span>Minimum spend: ${coupon.minimum_spend}</span>
                    </div>
                  )}

                  {coupon.free_shipping && (
                    <div className="flex items-center gap-2 text-vivid-red">
                      <FaShippingFast className="w-4 h-4" />
                      <span className="font-semibold">Free Shipping</span>
                    </div>
                  )}

                  {(coupon.start_date || coupon.end_date) && (
                    <div className={`flex items-center gap-2 ${isExpired ? 'text-orange-600' : ''}`}>
                      <FaCalendarAlt className="w-4 h-4" />
                      <span>
                        {coupon.start_date && coupon.end_date
                          ? `${formatDate(coupon.start_date)} - ${formatDate(coupon.end_date)}`
                          : coupon.start_date
                          ? `Starts: ${formatDate(coupon.start_date)}`
                          : `Expires: ${formatDate(coupon.end_date)}`}
                      </span>
                      {isExpired && (
                        <FaClock className="w-3 h-3 ml-1 text-orange-500" title="Expired" />
                      )}
                    </div>
                  )}

                  {isUsed && usedAt && (
                    <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                      Used on: {formatDate(usedAt)}
                    </div>
                  )}

                  {isExpired && !isUsed && (
                    <div className="text-xs text-orange-600 mt-2 pt-2 border-t border-orange-200">
                      This coupon has expired
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

