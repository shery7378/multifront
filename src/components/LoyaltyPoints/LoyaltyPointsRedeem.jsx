'use client';

import { useState } from 'react';
import axios from 'axios';
import Button from '@/components/UI/Button';

export default function LoyaltyPointsRedeem({ onRedeem, currentBalance }) {
  const [points, setPoints] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [calculating, setCalculating] = useState(false);

  const handleCalculate = async () => {
    const pointsValue = parseInt(points);
    if (!pointsValue || pointsValue <= 0) {
      setDiscount(0);
      return;
    }

    if (pointsValue > currentBalance) {
      setError('Insufficient points');
      setDiscount(0);
      return;
    }

    try {
      setCalculating(true);
      setError('');
      
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/loyalty-points/calculate-discount`,
        { points: pointsValue },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status === 200) {
        setDiscount(response.data.data.discount_amount);
        if (!response.data.data.can_redeem) {
          setError('Insufficient points');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to calculate discount');
      setDiscount(0);
    } finally {
      setCalculating(false);
    }
  };

  const handleRedeem = async () => {
    const pointsValue = parseInt(points);
    if (!pointsValue || pointsValue <= 0) {
      setError('Please enter valid points');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/loyalty-points/redeem`,
        { points: pointsValue },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status === 200) {
        if (onRedeem) {
          onRedeem(response.data.data);
        }
        setPoints('');
        setDiscount(0);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to redeem points');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (points) {
      const timer = setTimeout(() => {
        handleCalculate();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setDiscount(0);
      setError('');
    }
  }, [points]);

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3 className="font-semibold mb-3">Redeem Loyalty Points</h3>
      <p className="text-sm text-gray-600 mb-4">
        Your balance: <strong>{currentBalance.toLocaleString()} points</strong>
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Points to Redeem
          </label>
          <input
            type="number"
            value={points}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              setPoints(value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F44422] focus:border-transparent"
            placeholder="Enter points"
            min="1"
            max={currentBalance}
          />
        </div>

        {discount > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Discount:</strong> ${discount.toFixed(2)}
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <Button
          onClick={handleRedeem}
          disabled={loading || !points || parseInt(points) <= 0 || discount <= 0}
          className="w-full"
          variant="primary"
        >
          {loading ? 'Redeeming...' : 'Redeem Points'}
        </Button>
      </div>
    </div>
  );
}

