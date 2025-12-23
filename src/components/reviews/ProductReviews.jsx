'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useGetRequest } from '@/controller/getRequests';
import { usePostRequest } from '@/controller/postRequests';
import { useI18n } from '@/contexts/I18nContext';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';

function Stars({ value = 0, size = 'md' }) {
  const full = Math.floor(value);
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };
  const starSize = sizeClasses[size] || sizeClasses.md;
  
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => {
        const isFilled = i < full;
        return (
          <svg
            key={i}
            className={`${starSize} text-yellow-400`}
            fill={isFilled ? 'currentColor' : 'none'}
            stroke={isFilled ? 'none' : 'currentColor'}
            strokeWidth={isFilled ? 0 : 1.5}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.357 2.44a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.357-2.44a1 1 0 00-1.175 0l-3.357 2.44c-.784.57-1.838-.197-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.314 9.397c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.97z" />
          </svg>
        );
      })}
    </div>
  );
}

function getAvatarColor(name) {
  const colors = [
    'bg-pink-300',
    'bg-yellow-400',
    'bg-blue-300',
    'bg-green-300',
    'bg-purple-300',
    'bg-indigo-300',
  ];
  if (!name) return colors[0];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

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

export default function ProductReviews({ productId, averageRating = 0, reviewCount = 0, onReviewsLoaded }) {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [selectedRating, setSelectedRating] = useState(null); // Filter by rating (1-5 or null for all)
  const [sortBy, setSortBy] = useState('latest'); // 'latest', 'oldest', 'highest', 'lowest'
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const { data, error, loading, sendGetRequest } = useGetRequest();
  
  // Form state
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState('');
  const [formComment, setFormComment] = useState('');
  const [formPhotos, setFormPhotos] = useState([]); // Array of base64 strings
  const [formMessage, setFormMessage] = useState('');
  const formFileInputRef = useRef(null);
  const { sendPostRequest, loading: formLoading, error: formError } = usePostRequest();

  const fetchReviews = useCallback(() => {
    if (!productId) return;
    let url = `/products/${productId}/reviews?page=${page}`;
    if (selectedRating) {
      url += `&rating=${selectedRating}`;
    }
    if (sortBy === 'oldest') {
      url += `&sort=oldest`;
    } else if (sortBy === 'highest') {
      url += `&sort=highest`;
    } else if (sortBy === 'lowest') {
      url += `&sort=lowest`;
    }
    sendGetRequest(url, false, { suppressAuthErrors: true });
  }, [productId, page, selectedRating, sortBy, sendGetRequest]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews, reloadKey]);

  const reviews = data?.data || [];
  const pagination = data?.pagination;

  // Calculate rating distribution
  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(review => {
    const rating = Math.floor(review.rating || 0);
    if (rating >= 1 && rating <= 5) {
      ratingDistribution[rating]++;
    }
  });

  // Calculate percentages
  const totalReviews = reviews.length;
  const getPercentage = (count) => totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

  useEffect(() => {
    if (onReviewsLoaded && reviews.length > 0) {
      onReviewsLoaded(reviews);
    }
  }, [reviews, onReviewsLoaded]);

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

  const handleFormPhotoChange = (e) => {
    const files = Array.from(e.target.files || []);
    const maxPhotos = 5;
    
    if (formPhotos.length + files.length > maxPhotos) {
      setFormMessage(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormPhotos(prev => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleRemoveFormPhoto = (index) => {
    setFormPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormMessage('');
    try {
      const payload = {
        rating: formRating, 
        title: formTitle, 
        comment: formComment
      };
      
      if (formPhotos.length > 0) {
        payload.photos = formPhotos;
      }

      await sendPostRequest(`/products/${productId}/reviews`, payload, true);
      setFormTitle('');
      setFormComment('');
      setFormRating(5);
      setFormPhotos([]);
      setFormMessage(t('common.reviewSubmitted') || 'Review submitted successfully!');
      setIsFormExpanded(false);
      setReloadKey((k) => k + 1);
      // Clear message after 3 seconds
      setTimeout(() => setFormMessage(''), 3000);
    } catch (err) {
      setFormMessage(formError || t('common.failedToSubmitReview') || 'Failed to submit review');
    }
  };

  if (loading && page === 1) {
    return (
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-6">
          {t('common.ratingAndFeedback') || 'Rating and Feedback'}
        </h2>
        <p className="text-gray-500">{t('common.loadingReviews') || 'Loading reviews...'}</p>
      </div>
    );
  }

  if (error && page === 1) {
    return (
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-6">
          {t('common.ratingAndFeedback') || 'Rating and Feedback'}
        </h2>
        <p className="text-red-600">{t('common.error')}: {error}</p>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          {t('common.ratingAndFeedback') || 'Rating and Feedback'}
        </h2>
      </div>

      {/* Rating Summary */}
    
      {/* Sort and Filter Controls */}
    

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">
            {selectedRating 
              ? t('common.noReviewsForRating') || `No ${selectedRating}-star reviews yet`
              : t('common.noReviewsYet') || 'No reviews yet'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-6 mb-6">
            {reviews.map((review) => {
              const reviewerName = review.reviewer_name || review.user?.name || t('common.anonymous') || 'Anonymous';
              const avatarColor = getAvatarColor(reviewerName);
              const initials = getInitials(reviewerName);
              const reviewDate = review.created_at 
                ? new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                : '';

              return (
                <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                      {review.user?.avatar || review.avatar ? (
                        <img
                          src={review.user?.avatar || review.avatar}
                          alt={reviewerName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold text-sm">
                          {initials}
                        </span>
                      )}
                    </div>

                    {/* Review Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-slate-800 text-base mb-1">
                            {reviewerName}
                          </h4>
                          <div className="flex items-center gap-2 mb-2">
                            <Stars value={review.rating || 0} size="sm" />
                            <span className="text-xs text-gray-500">{reviewDate}</span>
                          </div>
                        </div>
                      </div>

                      {review.title && (
                        <h5 className="font-medium text-slate-800 mb-2">{review.title}</h5>
                      )}

                      {review.comment && (
                        <p className="text-sm text-slate-700 leading-relaxed mb-3">
                          {review.comment}
                        </p>
                      )}

                      {/* Review Photos */}
                      {review.photos && review.photos.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          {review.photos.map((photo, photoIndex) => {
                            const photoUrl = photo.startsWith('http') 
                              ? photo 
                              : `${process.env.NEXT_PUBLIC_API_URL}/${photo}`;
                            return (
                              <div key={photoIndex} className="relative group">
                                <img
                                  src={photoUrl}
                                  alt={`Review photo ${photoIndex + 1}`}
                                  className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => {
                                    // Open photo in modal/lightbox (you can implement this)
                                    window.open(photoUrl, '_blank');
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Helpful buttons */}
                      <div className="flex items-center gap-4">
                        <button className="text-xs text-gray-600 hover:text-[#F24E2E] transition-colors flex items-center gap-1">
                          <span>Helpful</span>
                          <span className="text-gray-400">({review.helpful_count || 0})</span>
                        </button>
                        <button className="text-xs text-gray-600 hover:text-gray-800 transition-colors">
                          Report
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.last_page > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-200">
              <button
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                {t('common.previous') || 'Previous'}
              </button>
              <div className="text-sm text-gray-600">
                {t('common.page') || 'Page'} {pagination.current_page} {t('common.of') || 'of'} {pagination.last_page}
              </div>
              <button
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                onClick={() => setPage((p) => p + 1)}
                disabled={pagination.current_page >= pagination.last_page}
              >
                {t('common.next') || 'Next'}
              </button>
            </div>
          )}
        </>
      )}

    </div>
  );
}

