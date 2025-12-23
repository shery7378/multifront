//src/components/modals/ReviewModal.jsx
'use client';

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
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

export default function ReviewModal({ isOpen, onClose, product, onSubmitted }) {
  const { t } = useI18n();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]); // Array of base64 strings
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);
  
  const { sendPostRequest, loading, error } = usePostRequest();

  if (!isOpen || !product) return null;

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    try {
      const payload = {
        rating,
        title: title.trim(),
        comment: comment.trim(),
        photos: photos.length > 0 ? photos : undefined
      };

      await sendPostRequest(`/products/${product.id}/reviews`, payload, true);
      
      // Reset form
      setRating(5);
      setTitle('');
      setComment('');
      setPhotos([]);
      setMessage(t('common.reviewSubmitted') || 'Review submitted successfully!');
      
      // Call callback and close after a delay
      setTimeout(() => {
        if (onSubmitted) onSubmitted();
        onClose();
      }, 1500);
    } catch (err) {
      setMessage(error || t('common.failedToSubmitReview') || 'Failed to submit review');
    }
  };

  const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
  const productImgSrc = product.image
    ? `${base}/${String(product.image).replace(/^\/+/, '')}`
    : '/images/products-image/controller3.png';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            {t('common.writeReview') || 'Write a Review'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Product Info */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={productImgSrc}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">{product.name}</h3>
              <p className="text-sm text-gray-500">Order: {product.orderNumber}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          {/* Success/Error Messages */}
          {message && (
            <div className={`mb-4 p-3 rounded-lg ${
              message.toLowerCase().includes('success') || message.toLowerCase().includes('submitted')
                ? 'text-green-700 bg-green-50 border border-green-200'
                : 'text-red-700 bg-red-50 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          {/* Rating Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('common.yourRating') || 'Your Rating'} *
            </label>
            <StarPicker value={rating} onChange={setRating} />
            <span className="ml-3 text-sm text-gray-600">{rating}/5</span>
          </div>

          {/* Title Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.reviewTitle') || 'Review Title'} ({t('common.optional') || 'Optional'})
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('common.titleOptional') || 'Title (optional)'}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F24E2E]/20 focus:border-[#F24E2E] transition-colors"
            />
          </div>

          {/* Comment Textarea */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.yourReview') || 'Your Review'} ({t('common.optional') || 'Optional'})
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('common.shareExperience') || 'Share your experience'}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#F24E2E]/20 focus:border-[#F24E2E] transition-colors"
            />
          </div>

          {/* Photo Upload */}
          <div className="mb-6">
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

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel') || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-[#F24E2E] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#E03E1E] text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? (t('common.submitting') || 'Submitting...') : (t('common.submitReview') || 'Submit Review')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

