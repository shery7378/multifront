'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ReferralCodeInput({ value, onChange, error }) {
  const [validating, setValidating] = useState(false);
  const [isValid, setIsValid] = useState(null);
  const [referrerName, setReferrerName] = useState('');

  useEffect(() => {
    if (value && value.length >= 3) {
      validateCode(value);
    } else {
      setIsValid(null);
      setReferrerName('');
    }
  }, [value]);

  const validateCode = async (code) => {
    if (!code || code.trim().length < 3) {
      setIsValid(null);
      setReferrerName('');
      return;
    }

    try {
      setValidating(true);
      // Normalize code: trim, uppercase, remove special characters
      const normalizedCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/referrals/validate`,
        { code: normalizedCode },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status === 200 && response.data.valid) {
        setIsValid(true);
        setReferrerName(response.data.data.referrer_name);
      } else {
        setIsValid(false);
        setReferrerName('');
      }
    } catch (err) {
      console.error('Referral code validation error:', err);
      setIsValid(false);
      setReferrerName('');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Referral Code (Optional)
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const code = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            onChange(code);
          }}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F44422] focus:border-transparent ${
            isValid === true
              ? 'border-green-300 bg-green-50'
              : isValid === false
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300'
          }`}
          placeholder="Enter referral code"
          maxLength={20}
        />
        {validating && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[#F44422] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {isValid === true && !validating && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        {isValid === false && !validating && value && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      {isValid === true && referrerName && (
        <p className="mt-1 text-sm text-green-600">
          ✓ Valid code from {referrerName}
        </p>
      )}
      {isValid === false && value && (
        <p className="mt-1 text-sm text-red-600">
          Invalid referral code
        </p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      <p className="mt-1 text-xs text-gray-500">
        Enter a friend's referral code to earn bonus points when you sign up
      </p>
    </div>
  );
}

