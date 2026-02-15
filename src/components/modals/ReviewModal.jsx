'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePostRequest } from '@/controller/postRequests';
import { useI18n } from '@/contexts/I18nContext';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { FaStar } from 'react-icons/fa';

function StarPicker({ value, onChange }) {
  const stars = [1, 2, 3, 4, 5];
  
  return (
    <div className="flex items-center gap-2">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <FaStar
            className={`w-8 h-8 ${
              star <= value ? 'text-amber-400' : 'text-gray-200'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ReviewModal({ isOpen, onClose, product, onSubmitted }) {
  const { t } = useI18n();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');
  
  const { sendPostRequest, loading, error } = usePostRequest();

  if (!isOpen || !product) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (rating === 0) {
      setMessage('Please select a rating');
      return;
    }

    try {
      const payload = {
        rating,
        comment: comment.trim(),
        // Backend might require these, sending defaults/empties if needed
        title: 'Review', 
      };

      await sendPostRequest(`/products/${product.id}/reviews`, payload, true);
      
      setMessage('Review submitted successfully!');
      
      // Call callback and close after a delay
      setTimeout(() => {
        if (onSubmitted) onSubmitted();
        onClose();
        // Reset form
        setRating(0);
        setComment('');
        setMessage('');
      }, 1500);
    } catch (err) {
      setMessage(error || 'Failed to submit review');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors border border-gray-100"
        >
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>

        <form onSubmit={handleSubmit} className="p-8">
          
          {/* Header */}
          <h2 className="text-2xl font-bold text-slate-900 mb-6 pr-8">
            {product.name}
          </h2>

          {/* Messages */}
          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm text-center ${
              message.toLowerCase().includes('success') 
                ? 'text-green-700 bg-green-50'
                : 'text-red-700 bg-red-50'
            }`}>
              {message}
            </div>
          )}

          {/* Star Rating */}
          <div className="mb-6">
            <StarPicker value={rating} onChange={setRating} />
          </div>

          {/* Comment Section */}
          <div className="mb-6">
            <label className="block text-gray-700 mb-3 text-base">
              Do you want write a comment ?
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Example:please knock instead of using the doorbell"
              rows={4}
              className="w-full border border-gray-200 rounded-xl p-4 text-gray-600 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F44322]/20 focus:border-[#F44322] resize-none text-sm"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#F44322] hover:bg-[#d63a1e] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-orange-200 active:transform active:scale-[0.98]"
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>

        </form>
      </div>
    </div>,
    document.body
  );
}

