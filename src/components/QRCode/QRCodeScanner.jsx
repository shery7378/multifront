'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Button from '@/components/UI/Button';
import Modal from '@/components/UI/Modal';

export default function QRCodeScanner({ isOpen, onClose, onScanSuccess }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      setError(null);
      setScanning(true);

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      setError('Failed to access camera. Please allow camera permissions.');
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const handleManualInput = async (e) => {
    e.preventDefault();
    const token = e.target.token.value.trim();
    
    if (!token) {
      setError('Please enter a QR code token');
      return;
    }

    await verifyToken(token);
  };

  const verifyToken = async (token) => {
    try {
      setError(null);
      const authToken = localStorage.getItem('auth_token');
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/qr-code/verify`,
        { token },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status === 200) {
        setResult(response.data.data);
        if (onScanSuccess) {
          onScanSuccess(response.data.data);
        }
      } else {
        setError(response.data.message || 'Invalid QR code');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify QR code');
    }
  };

  const handleCompletePickup = async () => {
    if (!result?.order) return;

    try {
      setError(null);
      const authToken = localStorage.getItem('auth_token');
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/qr-code/complete-pickup`,
        { token: result.order.pickup_qr_token },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status === 200) {
        alert('Pickup completed successfully!');
        if (onScanSuccess) {
          onScanSuccess(response.data.data);
        }
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete pickup');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopScanner();
        onClose();
      }}
      title="Scan QR Code"
      className="max-w-md"
      showCloseButton={true}
    >
      <div className="space-y-4">
        {/* Camera View */}
        {scanning && !result && (
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-64 object-cover"
              playsInline
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-white border-dashed w-48 h-48 rounded-lg"></div>
            </div>
          </div>
        )}

        {/* Manual Input */}
        {!result && (
          <form onSubmit={handleManualInput} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or enter QR code token manually:
              </label>
              <input
                type="text"
                name="token"
                placeholder="Enter QR code token"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F24E2E]"
              />
            </div>
            <Button type="submit" variant="primary" className="w-full">
              Verify Token
            </Button>
          </form>
        )}

        {/* Scan Result */}
        {result && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">QR Code Verified!</h3>
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>Order ID:</strong> #{result.order.id}</p>
                <p><strong>Customer:</strong> {result.order.customer_first_name} {result.order.customer_last_name}</p>
                <p><strong>Total:</strong> ${result.order.total}</p>
                {result.already_scanned && (
                  <p className="text-yellow-700 font-medium">
                    ⚠️ This QR code was already scanned at {new Date(result.scanned_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {!result.already_scanned && (
              <Button
                onClick={handleCompletePickup}
                variant="primary"
                className="w-full"
              >
                Complete Pickup
              </Button>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Close Button */}
        <Button
          onClick={() => {
            stopScanner();
            onClose();
          }}
          variant="outline"
          className="w-full"
        >
          Close
        </Button>
      </div>
    </Modal>
  );
}

