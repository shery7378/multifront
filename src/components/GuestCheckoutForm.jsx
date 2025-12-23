'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setGuestInfo } from '@/store/slices/checkoutSlice';

export default function GuestCheckoutForm({ onInfoCollected }) {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    customer_email: '',
    customer_phone: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    
    if (!formData.customer_email) {
      newErrors.customer_email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      newErrors.customer_email = 'Please enter a valid email';
    }
    
    if (!formData.customer_phone) {
      newErrors.customer_phone = 'Phone number is required';
    } else if (!/^[0-9+\-\s()]+$/.test(formData.customer_phone)) {
      newErrors.customer_phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      dispatch(setGuestInfo(formData));
      if (onInfoCollected) {
        onInfoCollected(formData);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-5">
      <h3 className="text-base font-semibold text-oxford-blue mb-4">Contact Information</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="customer_email" className="block text-sm font-medium text-oxford-blue mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="customer_email"
            value={formData.customer_email}
            onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-vivid-red ${
              errors.customer_email ? 'border-red-500' : 'border-slate-300'
            }`}
            placeholder="your.email@example.com"
            aria-label="Email address"
            aria-required="true"
            aria-invalid={!!errors.customer_email}
            aria-describedby={errors.customer_email ? 'email-error' : undefined}
          />
          {errors.customer_email && (
            <p id="email-error" className="mt-1 text-sm text-red-500" role="alert">
              {errors.customer_email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="customer_phone" className="block text-sm font-medium text-oxford-blue mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="customer_phone"
            value={formData.customer_phone}
            onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-vivid-red ${
              errors.customer_phone ? 'border-red-500' : 'border-slate-300'
            }`}
            placeholder="+44 123 456 7890"
            aria-label="Phone number"
            aria-required="true"
            aria-invalid={!!errors.customer_phone}
            aria-describedby={errors.customer_phone ? 'phone-error' : undefined}
          />
          {errors.customer_phone && (
            <p id="phone-error" className="mt-1 text-sm text-red-500" role="alert">
              {errors.customer_phone}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-vivid-red text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
        >
          Continue
        </button>
      </form>
    </div>
  );
}

