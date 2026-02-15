//src/app/coupons/page.jsx
'use client';
import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { useGetRequest } from '@/controller/getRequests';
import ResponsiveText from "@/components/UI/ResponsiveText";
import { FaTag, FaCopy, FaCheck, FaClock } from 'react-icons/fa6';
import { FaCalendarAlt, FaInfoCircle, FaShippingFast } from 'react-icons/fa';
import CouponEmptyState from '@/components/CouponEmptyState';

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
    return `£${coupon.value}`;
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
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === tab.id
              ? 'border-vivid-red text-vivid-red'
              : 'border-transparent text-gray-600 hover:text-oxford-blue'
              }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id
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
        <CouponEmptyState activeTab={activeTab} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayCoupons.map((coupon) => {
            const isUsed = coupon.pivot?.is_used || false;
            const isExpired = coupon.is_expired || false;
            
            // Visual state handling
            let containerClasses = "bg-white border border-gray-200";
            let badgeBg = "bg-transparent"; // Removed background
            let badgeColor = "text-vivid-red";
            let titleColor = "text-oxford-blue";
            let amountColor = "text-vivid-red";
            
            if (isUsed) {
                containerClasses = "bg-white border border-gray-200 opacity-60"; // Kept white but added opacity
                badgeBg = "bg-transparent";
                badgeColor = "text-gray-500";
                titleColor = "text-gray-600";
                amountColor = "text-gray-500";
            } else if (isExpired) {
                containerClasses = "bg-white border border-orange-200 opacity-70";
                badgeBg = "bg-transparent";
                badgeColor = "text-orange-600";
                amountColor = "text-orange-600";
            }

            return (
              <div
                key={coupon.id}
                className={`${containerClasses} rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group`}
              >
                {/* Header Section */}
                <div className="flex items-start gap-4 mb-5">
                    {/* Badge */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${badgeBg} ${badgeColor}`}>
                       <FaTag className="w-8 h-8 transform -rotate-12" /> {/* Increased size since no bg */}
                    </div>
                    
                    {/* Title & Discount */}
                    <div>
                        <h3 className={`font-bold text-lg leading-tight mb-0.5 ${titleColor}`}>
                          {coupon.name}
                        </h3>
                        <p className={`font-bold text-lg ${amountColor}`}>
                          {formatValue(coupon)} {coupon.is_percent ? 'off' : 'discount'}
                        </p>
                    </div>
                </div>

                {/* Code Box */}
                <div className="bg-transparent rounded-lg p-3.5 flex items-center justify-between mb-5 border border-gray-200 group-hover:border-gray-300 transition-colors">
                    <span className={`font-mono font-semibold text-lg tracking-wide ${isUsed ? 'text-gray-400 line-through' : 'text-oxford-blue'}`}>
                      {coupon.code}
                    </span>
                    <button
                      onClick={() => !isUsed && !isExpired && handleCopyCode(coupon.code)}
                      disabled={isUsed || isExpired}
                      className={`p-1.5 rounded-md transition-colors ${copiedCode === coupon.code ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-oxford-blue hover:bg-white inset-ring-1 inset-ring-gray-200'}`}
                      title={isUsed ? "Used" : isExpired ? "Expired" : "Copy Code"}
                    >
                      {copiedCode === coupon.code ? (
                        <FaCheck className="w-5 h-5" />
                      ) : (
                        <FaCopy className="w-5 h-5" />
                      )}
                    </button>
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between pt-1 text-oxford-blue">
                    <div className="flex items-center gap-2">
                        <FaInfoCircle className="w-4 h-4" />
                        <span className="text-sm font-semibold">
                           Minimum Spend : £{coupon.minimum_spend || '0'}
                        </span>
                    </div>
                    
                    {coupon.end_date && (
                      <div className="flex items-center gap-2">
                          <FaCalendarAlt className="w-4 h-4" />
                          <span className="text-sm font-semibold">
                            {formatDate(coupon.end_date)}
                          </span>
                      </div>
                    )}
                </div>
                
                {/* Visual Status Label for Used/Expired Overlay or Corner (Optional, keeping it clean as per reference, but changing opacity/colors handles it) */}
                {isUsed && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-gray-200 text-gray-600 text-xs font-bold rounded uppercase tracking-wider">Used</div>
                )}
                {isExpired && !isUsed && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-orange-100 text-orange-600 text-xs font-bold rounded uppercase tracking-wider">Expired</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

