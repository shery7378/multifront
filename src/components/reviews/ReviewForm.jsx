'use client';

import { useState, useRef } from 'react';
import { usePostRequest } from '@/controller/postRequests';
import { useI18n } from '@/contexts/I18nContext';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';

function StarPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="w-6 h-6 relative"
          aria-label={`Rate ${n}`}
        >
          <svg className="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.357 2.44a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.357-2.44a1 1 0 00-1.175 0l-3.357 2.44c-.784.57-1.838-.197-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.314 9.397c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.97z" />
          </svg>
          <div className="absolute top-0 left-0 overflow-hidden" style={{ width: value >= n ? '100%' : '0%' }}>
            <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.357 2.44a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.357-2.44a1 1 0 00-1.175 0l-3.357 2.44c-.784.57-1.838-.197-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.314 9.397c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.97z" />
            </svg>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function ReviewForm({ productId, onSubmitted, reviews = [] }) {
  const { t } = useI18n();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]); // Array of base64 strings
  const { data, error, loading, sendPostRequest } = usePostRequest();
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  // Check if current user has already reviewed this product
  const hasUserReviewed = () => {
    if (typeof window === 'undefined') return false;
    if (!reviews || reviews.length === 0) return false;
    
    try {
      const authUser = localStorage.getItem('auth_user');
      if (!authUser) return false;
      
      const user = JSON.parse(authUser);
      const userId = user?.id || user?.user_id;
      
      if (!userId) return false;
      
      // Check if any review has this user's ID as reviewer_id
      return reviews.some(review => {
        const reviewerId = review.reviewer_id || review.user?.id || review.user_id;
        return reviewerId && String(reviewerId) === String(userId);
      });
    } catch (error) {
      console.error('Error checking user review:', error);
      return false;
    }
  };

  const userHasReviewed = hasUserReviewed();

  // Don't render form if user has already reviewed
  if (userHasReviewed) {
    return null;
  }

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files || []);
    const maxPhotos = 5;
    
    if (photos.length + files.length > maxPhotos) {
      setMessage(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotos(prev => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleRemovePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const payload = { rating, title, comment };
      if (photos.length > 0) {
        payload.photos = photos;
      }
      
      await sendPostRequest(`/products/${productId}/reviews`, payload, true);
      setTitle('');
      setComment('');
      setRating(5);
      setPhotos([]);
      setMessage(t('common.reviewSubmitted'));
      if (onSubmitted) onSubmitted();
    } catch (err) {
      setMessage(error || t('common.failedToSubmitReview'));
    }
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      {/* Section Title */}
      <h3 className="text-base font-bold text-slate-900 mb-5">
        {t('common.writeReview') || 'Write a review'}
      </h3>

      {/* Success/Error Messages */}
      {message && (
        <div className={`text-sm mb-4 p-3 rounded-lg ${
          message.toLowerCase().includes('verified') || message.toLowerCase().includes('success')
            ? 'text-green-700 bg-green-50 border border-green-200'
            : 'text-red-700 bg-red-50 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Rating Section */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-sm text-gray-700">{t('common.yourRating') || 'Your rating'}</span>
        <StarPicker value={rating} onChange={setRating} />
        <span className="text-sm text-gray-700">{rating}/5</span>
      </div>

      {/* Title Input */}
      <div className="mb-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('common.titleOptional') || 'Title (optional)'}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F24E2E]/20 focus:border-[#F24E2E] transition-colors"
        />
      </div>

      {/* Experience Textarea */}
      <div className="mb-5">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('common.shareExperience') || 'Share your experience'}
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#F24E2E]/20 focus:border-[#F24E2E] transition-colors"
        />
      </div>

      {/* Photo Upload */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('common.photos') || 'Photos'} ({t('common.optional') || 'Optional'})
        </label>
        
        {/* Photo Preview Grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-3">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={photo}
                  alt={`Review photo ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {photos.length < 5 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#F24E2E] hover:bg-[#F24E2E]/5 transition-colors"
          >
            <PhotoIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              {t('common.addPhotos') || 'Add Photos'} ({photos.length}/5)
            </span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handlePhotoChange}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#F24E2E] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#E03E1E] text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
      >
        {loading ? (t('common.submitting') || 'Submitting...') : (t('common.submitReview') || 'Submit Review')}
      </button>
    </form>
  );
}
