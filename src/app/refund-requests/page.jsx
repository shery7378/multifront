//src/app/refund-requests/page.jsx
'use client';
import { useEffect, useRef } from 'react';
import { useGetRequest } from '@/controller/getRequests';
import { useI18n } from '@/contexts/I18nContext';
import Button from '@/components/UI/Button';
import Link from 'next/link';
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaClock, 
  FaSpinner, 
  FaBan,
  FaShieldAlt,
  FaCalendarAlt,
  FaComment,
} from 'react-icons/fa';
import {
  FaFileInvoice,
  FaTag,
  FaArrowRotateLeft,
} from 'react-icons/fa6';
import { motion } from 'framer-motion';

export default function RefundRequestsPage() {
  const { t } = useI18n();
  const hasLoadedRef = useRef(false);

  const {
    data,
    error,
    loading,
    sendGetRequest: getData
  } = useGetRequest();

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      getData('/refunds/my-requests', true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refundRequests = data?.data?.data || [];

  const getStatusConfig = (status) => {
    const statusLower = status?.toLowerCase();
    const configs = {
      pending: {
        icon: FaClock,
        label: t('refund.status.pending'),
        bg: '',
        text: 'text-amber-700',
        border: '',
        iconColor: 'text-amber-600',
        badge: 'text-amber-800 border border-amber-300'
      },
      approved: {
        icon: FaCheckCircle,
        label: t('refund.status.approved'),
        bg: '',
        text: 'text-emerald-700',
        border: '',
        iconColor: 'text-emerald-600',
        badge: 'text-emerald-800 border border-emerald-300'
      },
      rejected: {
        icon: FaTimesCircle,
        label: t('refund.status.rejected'),
        bg: '',
        text: 'text-red-700',
        border: '',
        iconColor: 'text-red-600',
        badge: 'text-red-800 border border-red-300'
      },
      processing: {
        icon: FaSpinner,
        label: t('refund.status.processing'),
        bg: '',
        text: 'text-blue-700',
        border: '',
        iconColor: 'text-blue-600',
        badge: 'text-blue-800 border border-blue-300'
      },
      completed: {
        icon: FaCheckCircle,
        label: t('refund.status.completed'),
        bg: '',
        text: 'text-green-700',
        border: '',
        iconColor: 'text-green-600',
        badge: 'text-green-800 border border-green-300'
      },
      cancelled: {
        icon: FaBan,
        label: t('refund.status.cancelled'),
        bg: '',
        text: 'text-gray-700',
        border: '',
        iconColor: 'text-gray-600',
        badge: 'text-gray-800 border border-gray-300'
      }
    };
    return configs[statusLower] || configs.pending;
  };

  const getReasonLabel = (reason) => {
    const reasonMap = {
      defective: t('refund.reasons.defective'),
      wrong_item: t('refund.reasons.wrongItem'),
      damaged: t('refund.reasons.damaged'),
      not_as_described: t('refund.reasons.notAsDescribed'),
      late_delivery: t('refund.reasons.lateDelivery'),
      other: t('refund.reasons.other'),
    };
    return reasonMap[reason] || reason;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-vivid-red mb-4"></div>
            <p className="text-gray-600 text-lg">{t('common.loading') || 'Loading...'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border-2 border-red-200 rounded-xl p-6 text-center"
          >
            <p className="text-red-700 font-semibold text-lg mb-2">
              {t('common.error') || 'Error'}
            </p>
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              variant="primary"
              onClick={() => {
                hasLoadedRef.current = false;
                getData('/refunds/my-requests', true);
              }}
            >
              Retry
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="p-4 rounded-2xl">
              <FaArrowRotateLeft className="w-8 h-8 text-vivid-red" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-oxford-blue mb-2">
                {t('refund.myRefundRequests') || 'My Refund Requests'}
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                Track and manage all your refund requests in one place
              </p>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        {refundRequests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-8 md:p-12 text-center"
          >
            <div className="max-w-md mx-auto">
              <div className="mb-6 flex justify-center">
                <div className="p-6 rounded-full">
                  <FaClock className="w-12 h-12 text-vivid-red" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-oxford-blue mb-3">
                {t('refund.noRefundRequests') || 'No Refund Requests'}
              </h2>
              <p className="text-gray-600 mb-6 text-lg">
                {t('refund.noRefundRequestsMessage') || 'You haven\'t submitted any refund requests yet.'}
              </p>
              <Link href="/orders">
                <Button variant="primary" className="inline-flex items-center gap-2">
                  <FaFileInvoice className="w-5 h-5" />
                  View Orders
                </Button>
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {refundRequests.map((request, index) => {
              const statusConfig = getStatusConfig(request.status);
              const StatusIcon = statusConfig.icon;
              const isSpinning = request.status?.toLowerCase() === 'processing';

              return (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200"
                >
                  {/* Status Header */}
                  <div className="border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${statusConfig.iconColor}`}>
                          {isSpinning ? (
                            <StatusIcon className="w-5 h-5 animate-spin" />
                          ) : (
                            <StatusIcon className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <span className={`inline-flex items-center px-4 py-1.5 rounded-lg text-sm font-semibold ${statusConfig.badge}`}>
                            {statusConfig.label}
                          </span>
                          {request.id && (
                            <span className="ml-3 text-sm text-sonic-silver">
                              Request #{request.id}
                            </span>
                          )}
                        </div>
                      </div>
                      {request.refund_amount && (
                        <div className="text-right">
                          <p className="text-xs text-sonic-silver mb-1 font-medium">Refund Amount</p>
                          <p className="text-2xl font-bold text-vivid-red">
                            £{parseFloat(request.refund_amount).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6">
                    {/* Order Details */}
                    <div className="grid sm:grid-cols-2 gap-6 mb-6">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center">
                          <FaFileInvoice className="text-blue-600 w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-sonic-silver uppercase tracking-wide mb-1">
                            Order Number
                          </p>
                          <Link 
                            href={`/orders/${request.order_id}`}
                            className="text-base font-bold text-oxford-blue hover:text-vivid-red transition-colors"
                          >
                            {request.order_number}
                          </Link>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center">
                          <FaCalendarAlt className="text-purple-600 w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-sonic-silver uppercase tracking-wide mb-1">
                            Requested On
                          </p>
                          <p className="text-sm font-semibold text-oxford-blue">
                            {formatDate(request.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Reason & Description */}
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <FaTag className="text-sonic-silver w-4 h-4" />
                          <p className="text-sm font-semibold text-oxford-blue">
                            Reason for Refund
                          </p>
                        </div>
                        <div className="px-4 py-3 rounded-lg border border-gray-200">
                          <p className="text-sm text-oxford-blue font-medium">
                            {getReasonLabel(request.reason)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <FaComment className="text-sonic-silver w-4 h-4" />
                          <p className="text-sm font-semibold text-oxford-blue">
                            Description
                          </p>
                        </div>
                        <div className="px-4 py-3 rounded-lg border border-gray-200 min-h-[60px]">
                          <p className="text-sm text-oxford-blue leading-relaxed">
                            {request.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Admin Request for More Details */}
                    {request.needs_more_details && request.admin_question && (
                      <div className="mb-6 p-4 rounded-lg border border-amber-200 bg-amber-50">
                        <div className="flex items-center gap-2 mb-2">
                          <FaComment className="text-amber-600 w-4 h-4" />
                          <p className="text-sm font-semibold text-amber-800">
                            Admin Request for More Information
                          </p>
                        </div>
                        <p className="text-sm text-amber-700 leading-relaxed mb-3">
                          {request.admin_question}
                        </p>
                        {request.customer_additional_info ? (
                          <div className="mt-3 p-3 bg-white rounded border border-amber-200">
                            <p className="text-xs font-semibold text-amber-800 mb-1">Your Response:</p>
                            <p className="text-sm text-oxford-blue">{request.customer_additional_info}</p>
                          </div>
                        ) : (
                          <Link href={`/refund-requests/${request.id}/provide-info`}>
                            <Button variant="primary" className="mt-2">
                              Provide Additional Information
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}

                    {/* Customer Additional Info (if provided) */}
                    {request.customer_additional_info && !request.needs_more_details && (
                      <div className="mb-6 p-4 rounded-lg border border-green-200 bg-green-50">
                        <div className="flex items-center gap-2 mb-2">
                          <FaComment className="text-green-600 w-4 h-4" />
                          <p className="text-sm font-semibold text-green-800">
                            Additional Information Provided
                          </p>
                        </div>
                        <p className="text-sm text-oxford-blue leading-relaxed">
                          {request.customer_additional_info}
                        </p>
                        {request.customer_responded_at && (
                          <p className="text-xs text-gray-500 mt-2">
                            Provided on: {formatDate(request.customer_responded_at)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Admin Notes */}
                    {request.admin_notes && (
                      <div className="mb-6 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <FaShieldAlt className="text-blue-600 w-4 h-4" />
                          <p className="text-sm font-semibold text-oxford-blue">
                            Admin Notes
                          </p>
                        </div>
                        <p className="text-sm text-oxford-blue leading-relaxed">
                          {request.admin_notes}
                        </p>
                      </div>
                    )}

                    {/* Processed Info */}
                    {request.processed_at && (
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <FaCheckCircle className="text-green-600 w-4 h-4" />
                          <p className="text-xs text-sonic-silver">
                            Processed on: <span className="font-semibold text-oxford-blue">{formatDate(request.processed_at)}</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
