//src/components/modals/StoreReviewModal.jsx
'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePostRequest } from '@/controller/postRequests';
import { useI18n } from '@/contexts/I18nContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

function StarPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="w-8 h-8 relative"
          aria-label={`Rate ${n}`}
        >
          <svg className="w-8 h-8 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.357 2.44a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.357-2.44a1 1 0 00-1.175 0l-3.357 2.44c-.784.57-1.838-.197-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.314 9.397c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.97z" />
          </svg>
          <div className="absolute top-0 left-0 overflow-hidden" style={{ width: value >= n ? '100%' : '0%' }}>
            <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.357 2.44a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.357-2.44a1 1 0 00-1.175 0l-3.357 2.44c-.784.57-1.838-.197-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.314 9.397c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.97z" />
            </svg>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function StoreReviewModal({ isOpen, onClose, store, onSubmitted }) {
  const { t } = useI18n();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');
  
  const { sendPostRequest, loading, error } = usePostRequest();

  if (!isOpen || !store) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (rating === 0) {
      setMessage(t('common.selectRating') || 'Please select a rating');
      return;
    }

    try {
      const payload = {
        rating: Number(rating),
        title: null,
        comment: comment.trim() || null
      };

      await sendPostRequest(`/stores/${store.id}/reviews`, payload, true);
      
      setRating(0);
      setComment('');
      setMessage(t('common.reviewSubmitted') || 'Review submitted successfully!');
      
      setTimeout(() => {
        if (onSubmitted) onSubmitted();
        onClose();
      }, 1500);
    } catch (err) {
      let errorMessage = error;
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const firstError = Object.values(errors).find(v => Array.isArray(v) && v.length > 0);
        if (firstError) errorMessage = firstError[0];
        else if (err.response?.data?.message) errorMessage = err.response.data.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setMessage(errorMessage || t('common.failedToSubmitReview') || 'Failed to submit review');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[20px] max-w-md w-full p-8 relative shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Store Name Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-6">
          {store.name}
        </h2>

        {/* Status Message */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-center text-sm ${
            message.toLowerCase().includes('success')
              ? 'text-green-700 bg-green-50'
              : 'text-red-700 bg-red-50'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div className="flex justify-center mb-6">
             <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <svg 
                    className={`w-10 h-10 ${n <= rating ? 'text-amber-400' : 'text-gray-200'}`} 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Comment Section */}
          <div>
            <label className="block text-slate-700 text-sm mb-3">
              {t('common.writeComment') || 'Do you want write a comment ?'}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('common.reviewPlaceholder') || 'Example:please knock instead of using the doorbell'}
              rows={4}
              className="w-full border border-gray-200 rounded-xl p-4 text-gray-600 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F24E2E]/20 focus:border-[#F24E2E] resize-none text-sm"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F24E2E] hover:bg-[#d63a1e] disabled:opacity-70 disabled:cursor-not-allowed text-white text-lg font-medium py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98]"
          >
            {loading ? (t('common.submitting') || 'Submitting...') : (t('common.submitReview') || 'Submit Review')}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}

