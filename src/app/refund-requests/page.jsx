'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  FaArrowLeft,
  FaEye,
  FaChevronRight
} from 'react-icons/fa';
import {
  FaFileInvoice,
  FaTag,
  FaArrowRotateLeft,
  FaCircleInfo
} from 'react-icons/fa6';
import { AnimatePresence, motion } from 'framer-motion';
import axios from 'axios';
import RefundEmptyState from '@/components/RefundEmptyState';
import SectionLoader from '@/components/UI/SectionLoader';

// Helper for status config
const getStatusConfig = (status, t) => {
  const statusLower = status?.toLowerCase();
  const configs = {
    pending: {
      icon: FaClock,
      label: t('refund.status.pending') || 'Pending',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      iconColor: 'text-amber-600',
      badge: 'bg-amber-100 text-amber-800'
    },
    approved: {
      icon: FaCheckCircle,
      label: t('refund.status.approved') || 'Approved',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      iconColor: 'text-emerald-600',
      badge: 'bg-emerald-100 text-emerald-800'
    },
    rejected: {
      icon: FaTimesCircle,
      label: t('refund.status.rejected') || 'Rejected',
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      iconColor: 'text-red-600',
      badge: 'bg-red-100 text-red-800'
    },
    processing: {
      icon: FaSpinner,
      label: t('refund.status.processing') || 'Processing',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      iconColor: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-800'
    },
    completed: {
      icon: FaCheckCircle,
      label: t('refund.status.completed') || 'Completed',
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      iconColor: 'text-green-600',
      badge: 'bg-green-100 text-green-800'
    },
    cancelled: {
      icon: FaBan,
      label: t('refund.status.cancelled') || 'Cancelled',
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-200',
      iconColor: 'text-gray-600',
      badge: 'bg-gray-100 text-gray-800'
    }
  };
  return configs[statusLower] || configs.pending;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-GB', {
    book: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Modal Component
const RefundDetailsModal = ({ request, onClose, t, onUpdate }) => {
  const statusConfig = getStatusConfig(request.status, t);
  const StatusIcon = statusConfig.icon;
  const isSpinning = request.status?.toLowerCase() === 'processing';
  
  // State for providing additional info
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleProvideInfo = async (e) => {
      e.preventDefault();
      if (!additionalInfo || additionalInfo.length < 10) return;
      
      setSubmitting(true);
      setSubmitError('');

      try {
        const token = localStorage.getItem('auth_token');
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
        
        await axios.post(
            `${baseUrl}/api/refunds/${request.id}/provide-additional-info`, 
            { customer_additional_info: additionalInfo },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        onUpdate(); 
        onClose();
      } catch (err) {
        setSubmitError('Failed to submit information. Please try again.');
        console.error(err);
      } finally {
        setSubmitting(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-xl font-bold text-oxford-blue">Refund Request Details</h3>
            <p className="text-sm text-gray-500">ID: #{request.id}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaTimesCircle className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Section */}
          <div className={`p-4 rounded-xl border ${statusConfig.border} ${statusConfig.bg} flex items-center gap-4`}>
             <div className={`p-3 rounded-full bg-white shadow-sm ${statusConfig.iconColor}`}>
               {isSpinning ? <StatusIcon className="w-6 h-6 animate-spin" /> : <StatusIcon className="w-6 h-6" />}
             </div>
             <div>
               <p className={`font-bold text-lg ${statusConfig.text}`}>{statusConfig.label}</p>
               <p className={`text-sm opacity-80 ${statusConfig.text}`}>
                 Updated on {formatDate(request.updated_at)}
               </p>
             </div>
             {request.refund_amount && (
                 <div className="ml-auto text-right">
                     <p className="text-xs text-gray-500 uppercase font-semibold">Amount</p>
                     <p className="text-xl font-bold text-gray-900">£{parseFloat(request.refund_amount).toFixed(2)}</p>
                 </div>
             )}
          </div>

          {/* Details Grid */}
          <div className="grid sm:grid-cols-2 gap-6">
             <div className="space-y-1">
               <label className="text-xs font-bold text-gray-400 uppercase">Order Number</label>
               <Link href={`/orders/${request.order_id}`} className="flex items-center gap-2 text-blue-600 font-semibold hover:underline bg-blue-50 px-3 py-2 rounded-lg w-fit">
                 <FaFileInvoice /> {request.order_number}
               </Link>
             </div>
             <div className="space-y-1">
               <label className="text-xs font-bold text-gray-400 uppercase">Requested On</label>
               <p className="flex items-center gap-2 text-gray-700 font-medium px-3 py-2 bg-gray-50 rounded-lg w-fit">
                 <FaCalendarAlt className="text-gray-400" /> {formatDate(request.created_at)}
               </p>
             </div>
          </div>

          {/* Reason & Descr */}
          <div className="space-y-4">
             <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Reason for Refund</label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 font-medium text-gray-800">
                    {request.reason ? request.reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}
                </div>
             </div>
             <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Description</label>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-gray-700 leading-relaxed">
                    {request.description}
                </div>
             </div>
          </div>

          {/* Admin Interactions */}
          {request.needs_more_details && request.admin_question && (
             <div className="border border-amber-200 bg-amber-50 rounded-xl p-5">
                 <h4 className="flex items-center gap-2 font-bold text-amber-800 mb-2">
                    <FaComment /> Admin Question
                 </h4>
                 <p className="text-amber-900 mb-4">{request.admin_question}</p>
                 
                 {request.customer_additional_info ? (
                    <div className="bg-white/60 p-3 rounded-lg border border-amber-200">
                       <p className="text-xs font-bold text-amber-800 uppercase mb-1">Your Response</p>
                       <p className="text-amber-900">{request.customer_additional_info}</p>
                    </div>
                 ) : (
                    <form onSubmit={handleProvideInfo}>
                       <label className="block text-sm font-semibold text-amber-800 mb-2">Provide Additional Information</label>
                       <textarea 
                          value={additionalInfo}
                          onChange={(e) => setAdditionalInfo(e.target.value)}
                          className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent min-h-[100px]"
                          placeholder="Type your response here..."
                          required
                          minLength={10}
                       ></textarea>
                       {submitError && <p className="text-red-600 text-sm mt-2">{submitError}</p>}
                       <div className="mt-3 flex justify-end">
                          <Button variant="primary" type="submit" disabled={submitting || additionalInfo.length < 10}>
                             {submitting ? 'Submitting...' : 'Submit Response'}
                          </Button>
                       </div>
                    </form>
                 )}
             </div>
          )}

          {/* Other Info Display */}
          {request.customer_additional_info && !request.needs_more_details && (
             <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                 <h4 className="flex items-center gap-2 font-bold text-green-800 mb-2">
                    <FaCircleInfo /> Additional Information Sent
                 </h4>
                 <p className="text-green-900">{request.customer_additional_info}</p>
             </div>
          )}

          {request.admin_notes && (
             <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                 <h4 className="flex items-center gap-2 font-bold text-blue-800 mb-2">
                    <FaShieldAlt /> Admin Notes
                 </h4>
                 <p className="text-blue-900">{request.admin_notes}</p>
             </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default function RefundRequestsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const hasLoadedRef = useRef(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

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

  const refreshData = () => {
     getData('/refunds/my-requests', true);
  };

  const refundRequests = data?.data?.data || [];

  if (loading) {
    return <SectionLoader />;
  }

  if (error) {
    return (
      <div className="px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border-2 border-red-200 rounded-xl p-6 text-center bg-red-50"
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
    <div className="container mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => router.back()}
              className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
            >
              <FaArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-oxford-blue">
              {t('refund.myRefundRequests') || 'My Refund Requests'}
            </h1>
        </div>

        {/* Content */}
        {refundRequests.length === 0 ? (
          <RefundEmptyState t={t} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {refundRequests.map((request, index) => {
              const statusConfig = getStatusConfig(request.status, t);
              const StatusIcon = statusConfig.icon;
              const isSpinning = request.status?.toLowerCase() === 'processing';

              return (
                <motion.div
                  key={request.id}
                  layoutId={`card-${request.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedRequest(request)}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-5 cursor-pointer group flex flex-col h-full relative overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="flex items-start gap-4 mb-5">
                      {/* Status Badge (mimicking the Sale seal) */}
                      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                          {isSpinning ? (
                             <StatusIcon className={`w-8 h-8 animate-spin ${statusConfig.iconColor}`} />
                          ) : (
                             <StatusIcon className={`w-8 h-8 ${statusConfig.iconColor}`} />
                          )}
                      </div>
                      
                      {/* Title & Amount/Status */}
                      <div>
                          <h3 className="text-oxford-blue font-bold text-lg leading-tight mb-0.5">
                            Refund #{request.id}
                          </h3>
                          <div className="flex items-center gap-2">
                             <p className={`font-bold text-sm ${statusConfig.text}`}>
                               {statusConfig.label}
                             </p>
                             {request.refund_amount && (
                                <span className="text-vivid-red font-bold text-sm">
                                  • £{parseFloat(request.refund_amount).toFixed(2)}
                                </span>
                             )}
                          </div>
                      </div>
                  </div>

                  {/* Order Number Box (mimicking code box) */}
                  <div className="bg-transparent rounded-lg p-3 flex items-center justify-between mb-5 border border-gray-200 group-hover:border-gray-300 transition-colors">
                      <span className="text-oxford-blue font-medium font-mono text-sm tracking-wide">
                        {request.order_number}
                      </span>
                  </div>
                  
                  {/* Card Body */}
                  <div className="space-y-3 flex-1">
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Refund Amount</span>
                        <span className="font-bold text-gray-900">
                           {request.refund_amount ? `£${parseFloat(request.refund_amount).toFixed(2)}` : 'N/A'}
                        </span>
                     </div>
                     
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Order Number</span>
                        <span className="font-semibold text-blue-600">#{request.order_number}</span>
                     </div>

                     <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Date</span>
                        <span className="font-medium text-gray-700">{formatDate(request.created_at).split(',')[0]}</span>
                     </div>
                     
                     {request.reason && (
                        <div className="pt-2 mt-2 border-t border-gray-50">
                           <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Reason</span>
                           <p className="text-sm text-gray-700 line-clamp-1">
                             {request.reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                           </p>
                        </div>
                     )}
                  </div>
                  
                  {/* Card Footer */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-400 italic">Tap to view details</span>
                      <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-vivid-red/10 group-hover:text-vivid-red transition-colors">
                         <FaChevronRight className="w-3 h-3 text-gray-400 group-hover:text-vivid-red" />
                      </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Details Modal */}
        <AnimatePresence>
            {selectedRequest && (
                <RefundDetailsModal 
                    request={selectedRequest} 
                    onClose={() => setSelectedRequest(null)}
                    t={t}
                    onUpdate={refreshData}
                />
            )}
        </AnimatePresence>
    </div>
  );
}
