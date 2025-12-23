'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import QRCode from 'qrcode.react';

export default function TwoFactorSetup({ onComplete, onCancel }) {
  const [step, setStep] = useState(1); // 1: Setup, 2: Verify, 3: Success
  const [secret, setSecret] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    initializeSetup();
  }, []);

  const initializeSetup = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/2fa/setup`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status === 200) {
        setSecret(response.data.data.secret);
        setQrCodeUrl(response.data.data.qr_code_url);
      } else {
        setError(response.data.message || 'Failed to initialize 2FA setup');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initialize 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/2fa/confirm`,
        { code: verificationCode },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status === 200) {
        setRecoveryCodes(response.data.data.recovery_codes);
        setStep(3);
      } else {
        setError(response.data.message || 'Invalid verification code');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRecoveryCodes = () => {
    const codesText = recoveryCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    alert('Recovery codes copied to clipboard!');
  };

  if (loading && step === 1) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F44422] mx-auto mb-4"></div>
          <p>Initializing 2FA setup...</p>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Set Up Two-Factor Authentication</h2>
        <p className="text-gray-600 mb-6">
          Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {qrCodeUrl && (
          <div className="mb-6 text-center">
            <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
              <QRCode value={qrCodeUrl} size={256} />
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Or enter this code manually: <code className="font-mono bg-gray-100 px-2 py-1 rounded">{secret}</code>
            </p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => setStep(2)}
            className="flex-1 bg-[#F44422] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#d6391a] transition-colors"
          >
            I've Scanned the Code
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Verify Setup</h2>
        <p className="text-gray-600 mb-6">
          Enter the 6-digit code from your authenticator app to confirm setup
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setVerificationCode(value);
                setError('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F44422] focus:border-transparent text-center text-2xl tracking-widest font-mono"
              placeholder="000000"
              maxLength={6}
              autoFocus
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="flex-1 bg-[#F44422] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#d6391a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify & Enable'}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">2FA Enabled Successfully!</h2>
          <p className="text-gray-600">
            Two-factor authentication has been enabled for your account.
          </p>
        </div>

        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-900 mb-2">Save Your Recovery Codes</h3>
          <p className="text-sm text-yellow-800 mb-3">
            These codes can be used to access your account if you lose your authenticator device.
            Save them in a safe place.
          </p>
          <div className="bg-white p-3 rounded border border-yellow-200 font-mono text-sm space-y-1">
            {recoveryCodes.map((code, index) => (
              <div key={index}>{code}</div>
            ))}
          </div>
          <button
            onClick={handleCopyRecoveryCodes}
            className="mt-3 w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
          >
            Copy Recovery Codes
          </button>
        </div>

        <button
          onClick={onComplete}
          className="w-full bg-[#F44422] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#d6391a] transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  return null;
}

