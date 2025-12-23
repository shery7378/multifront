'use client';

import { useState } from 'react';
import Button from '@/components/UI/Button';

export default function CheckoutSubscriptionSelector({ 
  product, 
  onSubscriptionChange,
  defaultEnabled = false 
}) {
  const [isEnabled, setIsEnabled] = useState(defaultEnabled);
  const [frequency, setFrequency] = useState('monthly');
  const [numDeliveries, setNumDeliveries] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Available subscription frequencies
  const frequencies = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-weekly (Every 2 weeks)' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'bimonthly', label: 'Bi-monthly (Every 2 months)' },
    { value: 'quarterly', label: 'Quarterly (Every 3 months)' },
  ];

  const handleToggle = (enabled) => {
    setIsEnabled(enabled);
    if (!enabled) {
      // Clear subscription when disabled
      onSubscriptionChange(null);
    } else {
      // Notify parent with initial subscription data (use 'enabled' parameter, not state)
      handleSubscriptionUpdate(frequency, numDeliveries, quantity, enabled);
    }
  };

  const handleSubscriptionUpdate = (newFrequency, newNumDeliveries, newQuantity, enabledOverride = null) => {
    // Use enabledOverride if provided (for immediate updates), otherwise use state
    const enabledValue = enabledOverride !== null ? enabledOverride : isEnabled;
    
    const subscriptionData = {
      product_id: product?.id || product?.product?.id,
      enabled: enabledValue,
      frequency: newFrequency || frequency,
      quantity: newQuantity || quantity,
      num_deliveries: newNumDeliveries || numDeliveries || null, // null = unlimited
    };
    
    // Debug logging
    if (typeof window !== 'undefined') {
      console.log('📝 CheckoutSubscriptionSelector - Updating subscription data:', {
        productId: subscriptionData.product_id,
        enabled: subscriptionData.enabled,
        frequency: subscriptionData.frequency,
        quantity: subscriptionData.quantity,
        num_deliveries: subscriptionData.num_deliveries,
      });
    }
    
    onSubscriptionChange(subscriptionData);
  };

  const handleFrequencyChange = (e) => {
    const newFrequency = e.target.value;
    setFrequency(newFrequency);
    if (isEnabled) {
      handleSubscriptionUpdate(newFrequency, numDeliveries, quantity);
    }
  };

  const handleNumDeliveriesChange = (e) => {
    const value = e.target.value;
    // Allow empty string, numbers only
    if (value === '' || /^\d+$/.test(value)) {
      setNumDeliveries(value);
      if (isEnabled) {
        handleSubscriptionUpdate(frequency, value, quantity);
      }
    }
  };

  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value) || 1;
    setQuantity(newQuantity);
    if (isEnabled) {
      handleSubscriptionUpdate(frequency, numDeliveries, newQuantity);
    }
  };

  // Check if product supports subscriptions
  const subscriptionEnabled = product?.subscription_enabled || 
                              product?.product?.subscription_enabled || 
                              false;

  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('🔍 CheckoutSubscriptionSelector:', {
      productId: product?.id || product?.product?.id,
      productName: product?.name || product?.product?.name,
      subscription_enabled: product?.subscription_enabled || product?.product?.subscription_enabled,
      subscriptionEnabled,
      product
    });
  }

  // TEMPORARY: Always show for testing (comment out the return null below)
  // if (!subscriptionEnabled) {
  //   console.log('❌ Subscription selector hidden - subscription not enabled for product:', product?.id || product?.product?.id);
  //   return null;
  // }

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      {/* Toggle Subscription */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`subscribe-${product?.id || product?.product?.id}`}
            checked={isEnabled}
            onChange={(e) => handleToggle(e.target.checked)}
            className="w-4 h-4 text-vivid-red border-gray-300 rounded focus:ring-vivid-red focus:ring-2"
          />
          <label 
            htmlFor={`subscribe-${product?.id || product?.product?.id}`}
            className="text-sm font-medium text-oxford-blue cursor-pointer"
          >
            Subscribe to this product
          </label>
        </div>
        <span className="text-xs text-gray-500">Automatic deliveries</span>
      </div>

      {/* Subscription Options (shown when enabled) */}
      {isEnabled && (
        <div className="space-y-3 mt-3 pt-3 border-t border-gray-200">
          {/* Frequency Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Delivery Frequency
            </label>
            <select
              value={frequency}
              onChange={handleFrequencyChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-vivid-red focus:border-vivid-red"
            >
              {frequencies.map((freq) => (
                <option key={freq.value} value={freq.value}>
                  {freq.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Quantity per delivery
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={handleQuantityChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-vivid-red focus:border-vivid-red"
            />
          </div>

          {/* Number of Deliveries */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Number of deliveries (leave empty for unlimited)
            </label>
            <input
              type="text"
              placeholder="e.g., 12 (or leave empty for unlimited)"
              value={numDeliveries}
              onChange={handleNumDeliveriesChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-vivid-red focus:border-vivid-red"
            />
            <p className="text-xs text-gray-500 mt-1">
              {numDeliveries 
                ? `Subscription will end after ${numDeliveries} deliveries`
                : 'Subscription will continue until you cancel it'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

