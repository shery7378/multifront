'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useGetRequest } from '@/controller/getRequests';
import { FaCoins, FaCheckCircle } from 'react-icons/fa';

export default function LoyaltyPointsRedemption({ onPointsChange, orderTotal }) {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { data: userData, loading: userLoading, sendGetRequest: getUserData } = useGetRequest();
  const [pointsBalance, setPointsBalance] = useState(0);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [pointsValue, setPointsValue] = useState(0); // Discount amount in currency
  const [isApplied, setIsApplied] = useState(false);
  
  // Points conversion rate (1 point = $0.01, adjust as needed)
  const POINTS_TO_CURRENCY_RATE = 0.01;
  const MIN_ORDER_AMOUNT_FOR_REDEMPTION = 10; // Minimum order amount to use points

  // Refresh balance function
  const refreshBalance = useCallback(() => {
    if (isAuthenticated) {
      getUserData('/customer-profile', true);
    }
  }, [isAuthenticated, getUserData]);

  useEffect(() => {
    refreshBalance();
  }, [isAuthenticated, refreshBalance]);

  // Update balance from user data
  useEffect(() => {
    if (userData?.data?.user?.loyalty_points_balance !== undefined) {
      const balance = userData.data.user.loyalty_points_balance || 0;
      setPointsBalance(balance);
      
      // If balance becomes 0 and we had points redeemed, reset the redemption state
      if (balance === 0 && pointsToRedeem > 0) {
        setPointsToRedeem(0);
        setPointsValue(0);
        setIsApplied(false);
        onPointsChange(0, 0);
      }
      
      // If balance is less than pointsToRedeem, adjust it
      if (balance < pointsToRedeem) {
        const adjustedPoints = balance;
        setPointsToRedeem(adjustedPoints);
        setPointsValue(adjustedPoints * POINTS_TO_CURRENCY_RATE);
        setIsApplied(adjustedPoints > 0);
        onPointsChange(adjustedPoints, adjustedPoints * POINTS_TO_CURRENCY_RATE);
      }
    }
  }, [userData]);

  // Listen for order placement events to refresh balance
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOrderPlaced = () => {
      // Refresh balance after order is placed
      setTimeout(() => {
        refreshBalance();
      }, 1000); // Delay to ensure backend has processed
    };

    window.addEventListener('orderPlaced', handleOrderPlaced);
    
    return () => {
      window.removeEventListener('orderPlaced', handleOrderPlaced);
    };
  }, [refreshBalance]);

  // Calculate remaining balance after redemption
  const remainingBalance = Math.max(0, pointsBalance - pointsToRedeem);

  // Calculate maximum redeemable points (can't exceed order total)
  const maxRedeemablePoints = Math.min(
    pointsBalance,
    Math.floor(orderTotal / POINTS_TO_CURRENCY_RATE)
  );

  const handlePointsInput = (value) => {
    const points = parseInt(value) || 0;
    
    // Validate points
    if (points < 0) {
      setPointsToRedeem(0);
      setPointsValue(0);
      setIsApplied(false);
      onPointsChange(0, 0);
      return;
    }

    if (points > maxRedeemablePoints) {
      setPointsToRedeem(maxRedeemablePoints);
      setPointsValue(maxRedeemablePoints * POINTS_TO_CURRENCY_RATE);
      setIsApplied(true);
      onPointsChange(maxRedeemablePoints, maxRedeemablePoints * POINTS_TO_CURRENCY_RATE);
      return;
    }

    setPointsToRedeem(points);
    setPointsValue(points * POINTS_TO_CURRENCY_RATE);
    setIsApplied(points > 0);
    onPointsChange(points, points * POINTS_TO_CURRENCY_RATE);
  };

  const handleUseAllPoints = () => {
    handlePointsInput(maxRedeemablePoints);
  };

  const handleRemovePoints = () => {
    setPointsToRedeem(0);
    setPointsValue(0);
    setIsApplied(false);
    onPointsChange(0, 0);
  };

  // Don't show if user is not authenticated or loading
  if (!isAuthenticated || userLoading) {
    return null;
  }

  // Hide if no points available at all
  if (pointsBalance === 0) {
    return null;
  }

  // Hide if all available points are being redeemed
  if (isApplied && pointsToRedeem >= pointsBalance) {
    return null;
  }

  if (orderTotal < MIN_ORDER_AMOUNT_FOR_REDEMPTION) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 mb-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <FaCoins className="text-purple-600 dark:text-purple-400 text-xl" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Use Loyalty Points
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {pointsToRedeem > 0 
                ? `Using ${pointsToRedeem.toLocaleString()} points, ${remainingBalance.toLocaleString()} remaining`
                : `You have ${pointsBalance.toLocaleString()} points available`
              }
            </p>
          </div>
        </div>
        {isApplied && (
          <button
            onClick={handleRemovePoints}
            className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
          >
            Remove
          </button>
        )}
      </div>

      {!isApplied ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max={maxRedeemablePoints}
              value={pointsToRedeem}
              onChange={(e) => handlePointsInput(e.target.value)}
              placeholder="Enter points to redeem"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
            />
            <button
              onClick={handleUseAllPoints}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Use All
            </button>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Maximum: {maxRedeemablePoints.toLocaleString()} points 
            (${(maxRedeemablePoints * POINTS_TO_CURRENCY_RATE).toFixed(2)} discount)
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-300 dark:border-purple-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {pointsToRedeem.toLocaleString()} points applied
              </span>
            </div>
            <span className="text-sm font-bold text-green-600 dark:text-green-400">
              -${pointsValue.toFixed(2)} discount
            </span>
          </div>
          {remainingBalance > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Remaining balance: {remainingBalance.toLocaleString()} points
            </p>
          )}
        </div>
      )}
    </div>
  );
}
