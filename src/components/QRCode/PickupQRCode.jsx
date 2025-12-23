'use client';

import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import axios from 'axios';
import Button from '@/components/UI/Button';
import Modal from '@/components/UI/Modal';

export default function PickupQRCode({ orderId, isOpen, onClose }) {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchQRCode();
    }
  }, [isOpen, orderId]);

  const fetchQRCode = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/qr-code/order/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status === 200) {
        setQrData(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load QR code');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrData?.qr_code) return;

    // If it's a base64 image, download it directly
    if (qrData.qr_code.startsWith('data:image')) {
      const link = document.createElement('a');
      link.href = qrData.qr_code;
      link.download = `pickup-qr-${orderId}.png`;
      link.click();
    } else {
      // Fallback: Generate QR code from canvas and download
      const canvas = document.getElementById('qr-code-canvas');
      if (canvas && canvas.tagName === 'CANVAS') {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = `pickup-qr-${orderId}.png`;
        link.click();
      } else if (canvas && canvas.tagName === 'IMG') {
        // If it's an img element, download the src
        const link = document.createElement('a');
        link.href = canvas.src;
        link.download = `pickup-qr-${orderId}.png`;
        link.click();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pickup QR Code"
      className="max-w-md"
      showCloseButton={true}
    >
      <div className="space-y-4">
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#F24E2E] mb-4"></div>
            <p className="text-gray-600">Generating QR code...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {qrData && !loading && (
          <>
            <div className="bg-white p-6 rounded-lg border-2 border-gray-200 flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg mb-4">
                {qrData.qr_code && qrData.qr_code.startsWith('data:image') ? (
                  // Backend-generated PNG image
                  <img
                    id="qr-code-canvas"
                    src={qrData.qr_code}
                    alt="Pickup QR Code"
                    className="w-64 h-64 mx-auto"
                  />
                ) : qrData.qr_data ? (
                  // Fallback: Generate QR code on frontend if backend didn't generate image
                  <QRCodeCanvas
                    id="qr-code-canvas"
                    value={JSON.stringify(qrData.qr_data)}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center text-gray-400">
                    QR code not available
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Order #{orderId}</p>
                <p className="text-xs text-gray-500">
                  Show this QR code at pickup location
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Instructions:</strong> Present this QR code to the vendor when picking up your order. 
                They will scan it to verify and complete your pickup.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleDownload}
                className="flex-1"
              >
                Download QR Code
              </Button>
              <Button
                variant="primary"
                onClick={onClose}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

