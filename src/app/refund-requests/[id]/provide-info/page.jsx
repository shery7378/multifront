//src/app/refund-requests/[id]/provide-info/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGetRequest } from '@/controller/getRequests';
import { usePostRequest } from '@/controller/postRequests';
import { useI18n } from '@/contexts/I18nContext';
import Button from '@/components/UI/Button';
import Link from 'next/link';
import { FaComment, FaArrowLeft, FaCheckCircle, FaExclamationTriangle, FaImage, FaTimes } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function ProvideInfoPage() {
  const { t } = useI18n();
  const params = useParams();
  const router = useRouter();
  const refundRequestId = params.id;

  const [additionalInfo, setAdditionalInfo] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);

  const {
    data: refundData,
    error: refundError,
    loading: refundLoading,
    sendGetRequest: getRefundRequest
  } = useGetRequest();

  const {
    data: submitData,
    error: submitError,
    loading: submitLoading,
    sendPostRequest: submitAdditionalInfo
  } = usePostRequest();

  useEffect(() => {
    if (refundRequestId) {
      // Debug: Check if user is authenticated
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (typeof window !== 'undefined') {
        console.log('[ProvideInfo] Fetching refund request:', {
          refundRequestId,
          hasToken: !!token,
          tokenLength: token?.length,
        });
      }
      getRefundRequest(`/refunds/${refundRequestId}`, true);
    }
  }, [refundRequestId]);

  useEffect(() => {
    if (submitData?.status === 200 || submitData?.status === 201) {
      setSubmitted(true);
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/refund-requests');
      }, 2000);
    }
  }, [submitData, router]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isValidType && isValidSize;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);

    // Create previews for images
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreviews(prev => [...prev, {
          file,
          preview: reader.result
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (additionalInfo.trim().length < 10) {
      return;
    }

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('customer_additional_info', additionalInfo.trim());
      
      // Append files
      selectedFiles.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });

      await submitAdditionalInfo(
        `/refunds/${refundRequestId}/provide-additional-info`,
        formData,
        true
      );
    } catch (error) {
      console.error('Failed to submit additional info:', error);
    }
  };

  // Parse refund request from response
  // API response structure: { status: 200, message: "...", data: { ...refundRequest } }
  const refundRequest = refundData?.data?.data || refundData?.data;

  // Debug logging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (refundData) {
        console.log('[ProvideInfo] Full refund data response:', refundData);
        console.log('[ProvideInfo] Refund data received:', {
          status: refundData?.data?.status,
          message: refundData?.data?.message,
          hasData: !!refundRequest,
          refundRequestId: refundRequest?.id,
          refundRequestStatus: refundRequest?.status,
          needsMoreDetails: refundRequest?.needs_more_details,
        });
      }
      if (refundError) {
        console.error('[ProvideInfo] Error fetching refund request:', refundError);
        console.error('[ProvideInfo] Error details:', {
          error: refundError,
          refundData: refundData,
        });
      }
    }
  }, [refundData, refundError, refundRequest]);

  if (refundLoading) {
    return (
      <div className="px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-vivid-red mb-4"></div>
            <p className="text-gray-600 text-lg">{t('common.loading') || 'Loading...'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Check response status
  const responseStatus = refundData?.data?.status;
  const isSuccessResponse = responseStatus === 200;
  
  // Only show error if:
  // 1. We have an explicit error message, OR
  // 2. Response status indicates error (400+), OR  
  // 3. We got a successful response but no refund request data (data structure issue)
  const shouldShowError = !refundLoading && (
    refundError || 
    (refundData && responseStatus && responseStatus >= 400) ||
    (refundData && isSuccessResponse && !refundRequest)
  );

  if (shouldShowError) {
    // Check if it's an authentication error
    const isAuthError = refundError?.toLowerCase().includes('unauthorized') || 
                       refundError?.toLowerCase().includes('log in') ||
                       refundData?.data?.status === 401;
    
    // Check if it's a permission error
    const isPermissionError = refundError?.toLowerCase().includes('permission') ||
                             refundData?.data?.status === 403;

    return (
      <div className="px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`border-2 rounded-xl p-6 text-center ${
              isAuthError ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'
            }`}
          >
            <FaExclamationTriangle className={`w-12 h-12 mx-auto mb-4 ${
              isAuthError ? 'text-amber-600' : 'text-red-600'
            }`} />
            <p className={`font-semibold text-lg mb-2 ${
              isAuthError ? 'text-amber-700' : 'text-red-700'
            }`}>
              {isAuthError ? 'Authentication Required' : (isPermissionError ? 'Access Denied' : t('common.error') || 'Error')}
            </p>
            <p className={`mb-4 ${isAuthError ? 'text-amber-600' : 'text-red-600'}`}>
              {isAuthError 
                ? 'Please log in to view this refund request.'
                : isPermissionError
                ? 'You do not have permission to view this refund request.'
                : refundError || 'Refund request not found. Please check the URL and try again.'}
            </p>
            {isAuthError && (
              <div className="mb-4">
                <Link href="/login">
                  <Button variant="primary" className="mr-2">
                    Log In
                  </Button>
                </Link>
              </div>
            )}
            <Link href="/refund-requests">
              <Button variant={isAuthError ? "secondary" : "primary"}>
                <FaArrowLeft className="w-4 h-4 mr-2" />
                Back to Refund Requests
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  // Check if refund request exists and needs more details
  if (refundRequest && !refundRequest.needs_more_details) {
    return (
      <div className="px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border-2 border-amber-200 rounded-xl p-6 text-center"
          >
            <FaExclamationTriangle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
            <p className="text-amber-700 font-semibold text-lg mb-2">
              No Additional Information Required
            </p>
            <p className="text-amber-600 mb-4">
              This refund request does not require additional information at this time.
            </p>
            <Link href="/refund-requests">
              <Button variant="primary">
                <FaArrowLeft className="w-4 h-4 mr-2" />
                Back to Refund Requests
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  // If we don't have refund request data yet, show loading or wait
  if (!refundRequest) {
    return (
      <div className="px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-vivid-red mb-4"></div>
            <p className="text-gray-600 text-lg">{t('common.loading') || 'Loading refund request...'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border-2 border-green-200 rounded-xl p-8 text-center"
          >
            <FaCheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-700 mb-2">
              Information Submitted Successfully!
            </h2>
            <p className="text-green-600 mb-4">
              Your additional information has been submitted. You will be redirected shortly...
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/refund-requests" className="inline-flex items-center text-vivid-red hover:text-red-700 mb-4">
            <FaArrowLeft className="w-4 h-4 mr-2" />
            Back to Refund Requests
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-oxford-blue mb-2">
            Provide Additional Information
          </h1>
          <p className="text-gray-600">
            Please provide the additional information requested by our team for refund request #{refundRequest.id}
          </p>
        </motion.div>

        {/* Admin Question */}
        {refundRequest.admin_question && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-6 rounded-xl border border-amber-200 bg-amber-50"
          >
            <div className="flex items-center gap-2 mb-3">
              <FaComment className="text-amber-600 w-5 h-5" />
              <h2 className="text-lg font-semibold text-amber-800">
                Admin Request
              </h2>
            </div>
            <p className="text-amber-700 leading-relaxed">
              {refundRequest.admin_question}
            </p>
          </motion.div>
        )}

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 md:p-8"
        >
          <div className="mb-6">
            <label htmlFor="additionalInfo" className="block text-sm font-semibold text-oxford-blue mb-2">
              Additional Information <span className="text-red-600">*</span>
            </label>
            <textarea
              id="additionalInfo"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Please provide detailed information to help us process your refund request..."
              rows={8}
              minLength={10}
              maxLength={2000}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vivid-red focus:border-transparent resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                Minimum 10 characters required
              </p>
              <p className="text-xs text-gray-500">
                {additionalInfo.length} / 2000 characters
              </p>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="mb-6">
            <label htmlFor="attachments" className="block text-sm font-semibold text-oxford-blue mb-2">
              <FaImage className="inline w-4 h-4 mr-2" />
              Attach Images (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-vivid-red transition-colors">
              <input
                type="file"
                id="attachments"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="attachments"
                className="cursor-pointer flex flex-col items-center justify-center py-4"
              >
                <FaImage className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF, WEBP up to 5MB each
                </p>
              </label>
            </div>

            {/* File Previews */}
            {filePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                {filePreviews.map((preview, index) => (
                  <div
                    key={index}
                    className="relative group border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <img
                      src={preview.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 truncate">
                      {preview.file.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {submitError && (
            <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50">
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Link href="/refund-requests" className="flex-1">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              disabled={submitLoading || additionalInfo.trim().length < 10}
              className="flex-1"
            >
              {submitLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                'Submit Information'
              )}
            </Button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}

