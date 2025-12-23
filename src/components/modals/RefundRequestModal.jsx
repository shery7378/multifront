'use client';

import { useState, useEffect } from 'react';
import { usePostRequest } from '@/controller/postRequests';
import { useI18n } from '@/contexts/I18nContext';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from '@/components/UI/Button';

export default function RefundRequestModal({ isOpen, onClose, orderId, itemId, orderNumber, onRefundSubmitted }) {
  const { t } = useI18n();
  const { loading, error, sendPostRequest } = usePostRequest();
  const [formData, setFormData] = useState({
    reason: '',
    description: '',
  });
  const [success, setSuccess] = useState(false);
  const [needsMoreDetails, setNeedsMoreDetails] = useState(false);
  const [adminQuestion, setAdminQuestion] = useState('');
  const [customerAdditionalInfo, setCustomerAdditionalInfo] = useState('');

  const refundReasons = [
    { value: 'defective', label: t('refund.reasons.defective') || 'Defective Product' },
    { value: 'wrong_item', label: t('refund.reasons.wrongItem') || 'Wrong Item Received' },
    { value: 'damaged', label: t('refund.reasons.damaged') || 'Damaged Product' },
    { value: 'not_as_described', label: t('refund.reasons.notAsDescribed') || 'Not as Described' },
    { value: 'late_delivery', label: t('refund.reasons.lateDelivery') || 'Late Delivery' },
    { value: 'other', label: t('refund.reasons.other') || 'Other' },
  ];

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFormData({ reason: '', description: '' });
      setSuccess(false);
      setNeedsMoreDetails(false);
      setAdminQuestion('');
      setCustomerAdditionalInfo('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.reason || !formData.description || formData.description.length < 10) {
      return;
    }

    try {
      const payload = {
        order_id: orderId,
        reason: formData.reason,
        description: formData.description,
      };

      if (itemId) {
        payload.item_id = itemId;
      }

      await sendPostRequest('/refunds', payload, true);
      setSuccess(true);
      
      // Close modal after 2 seconds and refresh orders
      setTimeout(() => {
        onClose();
        // Call the refresh callback if provided, otherwise reload the page
        if (onRefundSubmitted) {
          onRefundSubmitted();
        } else if (typeof window !== 'undefined') {
          // Fallback: reload the page to show updated status
          window.location.reload();
        }
      }, 2000);
    } catch (err) {
      console.error('Error submitting refund request:', err);
    }
  };

  const handleProvideAdditionalInfo = async (e) => {
    e.preventDefault();

    if (!customerAdditionalInfo || customerAdditionalInfo.length < 10) {
      return;
    }

    try {
      await sendPostRequest(`/refunds/${orderId}/provide-additional-info`, {
        customer_additional_info: customerAdditionalInfo,
      }, true);
      
      setNeedsMoreDetails(false);
      setCustomerAdditionalInfo('');
      setSuccess(true);
      
      setTimeout(() => {
        onClose();
        // Call the refresh callback if provided, otherwise reload the page
        if (onRefundSubmitted) {
          onRefundSubmitted();
        } else if (typeof window !== 'undefined') {
          // Fallback: reload the page to show updated status
          window.location.reload();
        }
      }, 2000);
    } catch (err) {
      console.error('Error submitting additional info:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-oxford-blue">
            {needsMoreDetails 
              ? t('refund.provideAdditionalInfo') || 'Provide Additional Information'
              : t('refund.requestRefund') || 'Request Refund'
            }
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-oxford-blue mb-2">
                {t('refund.requestSubmitted') || 'Refund Request Submitted'}
              </h3>
              <p className="text-gray-600">
                {t('refund.requestSubmittedMessage') || 'Your refund request has been submitted successfully. We will review it and get back to you soon.'}
              </p>
            </div>
          ) : needsMoreDetails ? (
            // Admin requested more details form
            <form onSubmit={handleProvideAdditionalInfo} className="space-y-6">
              {orderNumber && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Order Number:</strong> {orderNumber}
                  </p>
                </div>
              )}

              {adminQuestion && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-amber-800 mb-2">
                    Admin Question:
                  </p>
                  <p className="text-sm text-amber-700">
                    {adminQuestion}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-oxford-blue mb-2">
                  {t('refund.additionalInfo') || 'Additional Information'} *
                </label>
                <textarea
                  value={customerAdditionalInfo}
                  onChange={(e) => setCustomerAdditionalInfo(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vivid-red focus:border-transparent resize-none"
                  placeholder={t('refund.additionalInfoPlaceholder') || 'Please provide the additional information requested by the admin...'}
                  required
                  minLength={10}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 10 characters required
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || customerAdditionalInfo.length < 10}
                  className="flex-1"
                >
                  {loading ? 'Submitting...' : 'Submit Information'}
                </Button>
              </div>
            </form>
          ) : (
            // Initial refund request form
            <form onSubmit={handleSubmit} className="space-y-6">
              {orderNumber && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <strong>Order Number:</strong> {orderNumber}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-oxford-blue mb-2">
                  {t('refund.reason') || 'Reason for Refund'} *
                </label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vivid-red focus:border-transparent"
                  required
                >
                  <option value="">{t('refund.selectReason') || 'Select a reason'}</option>
                  {refundReasons.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-oxford-blue mb-2">
                  {t('refund.description') || 'Description'} *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vivid-red focus:border-transparent resize-none"
                  placeholder={t('refund.descriptionPlaceholder') || 'Please provide details about why you are requesting a refund...'}
                  required
                  minLength={10}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/500 characters (minimum 10 required)
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || !formData.reason || formData.description.length < 10}
                  className="flex-1"
                >
                  {loading ? 'Submitting...' : t('refund.submitRequest') || 'Submit Request'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
