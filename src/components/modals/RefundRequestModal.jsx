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

  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const now = new Date();
    // Format: d/MM/yyyy (e.g., 5/02/2026)
    const formatted = `${now.getDate()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    setCurrentDate(formatted);
  }, []);

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
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-100">
        {/* Header */}
        <div className="bg-white px-6 pt-6 pb-2 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-oxford-blue">
            {needsMoreDetails 
              ? t('refund.provideAdditionalInfo') || 'Provide Additional Information'
              : t('refund.requestRefund') || 'Request Refund'
            }
          </h2>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-gray-500 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                <span>{currentDate}</span>
             </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
          </div>
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
            <form onSubmit={handleProvideAdditionalInfo} className="space-y-5">
              {orderNumber && (
                <div>
                   <label className="block text-sm font-medium text-oxford-blue mb-2">
                    Order Number
                  </label>
                  <div className="w-full px-4 py-3 bg-gray-50 rounded-lg text-gray-700 border-none">
                     {orderNumber}
                  </div>
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
                <label className="block text-sm font-medium text-oxford-blue mb-2">
                  {t('refund.additionalInfo') || 'Additional Information'} *
                </label>
                <textarea
                  value={customerAdditionalInfo}
                  onChange={(e) => setCustomerAdditionalInfo(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg border-none focus:ring-1 focus:ring-gray-200 resize-none placeholder-gray-400"
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

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 rounded-lg border-gray-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || customerAdditionalInfo.length < 10}
                  className="flex-1 rounded-lg"
                >
                  {loading ? 'Submitting...' : 'Submit Information'}
                </Button>
              </div>
            </form>
          ) : (
            // Initial refund request form
            <form onSubmit={handleSubmit} className="space-y-5">
              {orderNumber && (
                 <div>
                   <label className="block text-sm font-medium text-oxford-blue mb-2">
                    Order Number
                  </label>
                  <div className="w-full px-4 py-3 bg-gray-50 rounded-lg text-gray-500 border-none">
                     {orderNumber}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-oxford-blue mb-2">
                  {t('refund.reason') || 'Reason for Refund'}
                </label>
                <div className="relative">
                    <select
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-lg border-none focus:ring-1 focus:ring-gray-200 appearance-none text-gray-700"
                      required
                    >
                      <option value="">{t('refund.selectReason') || 'Select a reason'}</option>
                      {refundReasons.map((reason) => (
                        <option key={reason.value} value={reason.value}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-oxford-blue mb-2">
                  {t('refund.description') || 'Description'}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg border-none focus:ring-1 focus:ring-gray-200 resize-none placeholder-gray-400"
                  placeholder={t('refund.descriptionPlaceholder') || 'Please provide details...'}
                  required
                  minLength={10}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                 {/* Removed Cancel Button from here to match clean look or keep it? The screenshot doesn't show buttons but a form needs submission. 
                     I'll keep the buttons but style them cleanly. */}
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || !formData.reason || formData.description.length < 10}
                  className="w-full rounded-lg py-3 font-semibold"
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
