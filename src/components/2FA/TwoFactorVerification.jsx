'use client';

import { useState } from 'react';
import axios from 'axios';

export default function TwoFactorVerification({ tempToken, userEmail, onSuccess, onCancel }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    
    const verificationCode = code.replace(/\s+/g, '').toUpperCase();
    
    if (!useRecoveryCode && verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    if (useRecoveryCode && verificationCode.length < 8) {
      setError('Please enter a valid recovery code');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/2fa/verify`,
        { 
          code: verificationCode,
          temp_token: tempToken 
        },
        {
          headers: {
            Authorization: `Bearer ${tempToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status === 200) {
        // Save the permanent token
        localStorage.setItem('auth_token', response.data.token);
        onSuccess(response.data);
      } else {
        setError(response.data.message || 'Invalid verification code');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Two-Factor Authentication</h2>
        <p className="text-gray-600">
          Enter the {useRecoveryCode ? 'recovery' : '6-digit'} code from your authenticator app
        </p>
        {userEmail && (
          <p className="text-sm text-gray-500 mt-1">{userEmail}</p>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleVerify}>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {useRecoveryCode ? 'Recovery Code' : 'Verification Code'}
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => {
              const value = useRecoveryCode 
                ? e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')
                : e.target.value.replace(/\D/g, '').slice(0, 6);
              setCode(value);
              setError('');
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F44422] focus:border-transparent text-center text-2xl tracking-widest font-mono"
            placeholder={useRecoveryCode ? "XXXX-XXXX" : "000000"}
            autoFocus
          />
        </div>

        <div className="mb-6">
          <button
            type="button"
            onClick={() => {
              setUseRecoveryCode(!useRecoveryCode);
              setCode('');
              setError('');
            }}
            className="text-sm text-[#F44422] hover:underline"
          >
            {useRecoveryCode ? 'Use authenticator code instead' : 'Use a recovery code instead'}
          </button>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || (!useRecoveryCode && code.length !== 6) || (useRecoveryCode && code.length < 8)}
            className="flex-1 bg-[#F44422] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#d6391a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Need help?</strong> If you've lost access to your authenticator app, use a recovery code.
          Contact support if you don't have recovery codes.
        </p>
      </div>
    </div>
  );
}

