"use client";

import React, { useState, useEffect } from "react";
import { useCurrency } from '@/contexts/CurrencyContext';
import axios from 'axios';

const LoyaltyPointsEarned = ({ orderTotal }) => {
  const { formatPrice, currencySymbol } = useCurrency();
  const [pointsEarned, setPointsEarned] = useState(0);
  const [pointsPerDollar, setPointsPerDollar] = useState(1.0);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/loyalty-points/settings`;
        console.log('🔵 Fetching loyalty points settings from:', apiUrl);
        
        const response = await axios.get(apiUrl);
        
        console.log('🟢 Loyalty points settings response:', response.data);
        
        // Handle both response formats: status === 'success' (from admin API) or status === 200
        if ((response.data?.status === 'success' || response.data?.status === 200) && response.data?.data) {
          const settings = response.data.data;
          // The API returns 'loyalty_points_enabled' and 'loyalty_points_per_dollar'
          const isEnabled = settings.loyalty_points_enabled ?? settings.enabled ?? false;
          const pointsPerDollar = settings.loyalty_points_per_dollar ?? settings.points_per_dollar ?? 1.0;
          console.log('🟡 Settings:', { enabled: isEnabled, points_per_dollar: pointsPerDollar });
          setEnabled(isEnabled);
          setPointsPerDollar(pointsPerDollar);
        }
      } catch (error) {
        console.error('🔴 Failed to fetch loyalty points settings:', error);
        console.error('🔴 Error details:', error.response?.data || error.message);
        setEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    console.log('🟠 Calculating points:', { enabled, orderTotal, pointsPerDollar });
    if (enabled && orderTotal > 0 && pointsPerDollar > 0) {
      const points = Math.floor(orderTotal * pointsPerDollar);
      console.log('🟣 Calculated points:', points);
      setPointsEarned(points);
    } else {
      setPointsEarned(0);
    }
  }, [enabled, orderTotal, pointsPerDollar]);

  console.log('🎨 LoyaltyPointsEarned render:', { loading, enabled, pointsEarned, orderTotal });

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (!enabled) {
    return null; // Don't show if loyalty points are disabled
  }

  if (pointsEarned <= 0) {
    return null; // Don't show if no points will be earned
  }

  return (
    <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
          <span className="text-sm font-semibold text-gray-800">
            You'll earn
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-purple-600">
            {pointsEarned.toLocaleString()}
          </span>
          <span className="text-sm font-medium text-gray-700">points</span>
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-600">
        {pointsPerDollar} point{pointsPerDollar !== 1 ? 's' : ''} per {currencySymbol}1 spent
      </p>
    </div>
  );
};

export default LoyaltyPointsEarned;

