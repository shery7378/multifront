'use client';

import { useState, useEffect, useMemo } from 'react';
import Button from '@/components/UI/Button';

export default function CheckoutSubscriptionSelector({ 
  product, 
  onSubscriptionChange,
  defaultEnabled = false,
  initialFrequency = 'monthly',
  initialQuantity = 1,
  initialNumDeliveries = ''
}) {
  const [isEnabled, setIsEnabled] = useState(defaultEnabled);
  const [frequency, setFrequency] = useState(initialFrequency);
  const [numDeliveries, setNumDeliveries] = useState(initialNumDeliveries);
  const [quantity, setQuantity] = useState(initialQuantity);

  // Frequency label mapping
  const frequencyLabels = {
    'weekly': 'Weekly',
    'biweekly': 'Bi-weekly (Every 2 weeks)',
    'monthly': 'Monthly',
    'bimonthly': 'Bi-monthly (Every 2 months)',
    'quarterly': 'Quarterly (Every 3 months)',
    'custom': 'Custom',
  };

  // Default frequencies (fallback if product doesn't have subscription_frequencies)
  const defaultFrequencies = ['weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly'];

  // Get frequencies from product (seller-assigned) or use default
  const getAvailableFrequencies = () => {
    const productFrequencies = product?.subscription_frequencies || product?.product?.subscription_frequencies;
    
    if (!productFrequencies) {
      // No seller-assigned frequencies, use default
      return defaultFrequencies.map(freq => ({
        value: freq,
        label: frequencyLabels[freq] || freq
      }));
    }

    // Parse JSON if it's a string, or handle plain string values
    let frequenciesArray = productFrequencies;
    if (typeof productFrequencies === 'string') {
      // Try to parse as JSON first
      try {
        frequenciesArray = JSON.parse(productFrequencies);
      } catch (e) {
        // If JSON parsing fails, check if it's a single frequency value (e.g., "monthly")
        // or a comma-separated list (e.g., "weekly,monthly")
        if (productFrequencies.includes(',')) {
          // Comma-separated list
          frequenciesArray = productFrequencies.split(',').map(f => f.trim()).filter(f => f);
        } else if (productFrequencies.trim() && defaultFrequencies.includes(productFrequencies.trim())) {
          // Single frequency value
          frequenciesArray = [productFrequencies.trim()];
        } else {
          // Unknown format, use defaults
          console.warn('Failed to parse subscription_frequencies, using defaults:', productFrequencies);
          return defaultFrequencies.map(freq => ({
            value: freq,
            label: frequencyLabels[freq] || freq
          }));
        }
      }
    }

    // Ensure it's an array
    if (!Array.isArray(frequenciesArray)) {
      return defaultFrequencies.map(freq => ({
        value: freq,
        label: frequencyLabels[freq] || freq
      }));
    }

    // Map seller-assigned frequencies to display format
    return frequenciesArray.map(freq => ({
      value: freq,
      label: frequencyLabels[freq] || freq.charAt(0).toUpperCase() + freq.slice(1)
    }));
  };

  const frequencies = useMemo(() => getAvailableFrequencies(), [product?.subscription_frequencies, product?.product?.subscription_frequencies]);

  // Set default frequency to first available frequency when component mounts or frequencies change
  useEffect(() => {
    if (frequencies.length > 0 && !defaultEnabled && !isEnabled) {
      setFrequency(frequencies[0].value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frequencies]);

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

  const productName = product?.name || product?.product?.name || 'Product';

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
      {/* Product Name Header */}
      <div className="mb-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Subscription for {productName}
        </h4>
      </div>

      {/* Toggle Subscription */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`subscribe-${product?.id || product?.product?.id || Math.random()}`}
            checked={isEnabled}
            onChange={(e) => handleToggle(e.target.checked)}
            className="w-4 h-4 text-[#f44322] border-slate-300 rounded focus:ring-[#f44322] focus:ring-2 cursor-pointer"
          />
          <label 
            htmlFor={`subscribe-${product?.id || product?.product?.id || Math.random()}`}
            className="text-sm font-semibold text-slate-800 cursor-pointer"
          >
            Enable subscription
          </label>
        </div>
        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
          Automatic deliveries
        </span>
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
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-[#f44322] focus:border-[#f44322] bg-white text-slate-900"
            >
              {frequencies.length > 0 ? frequencies.map((freq) => (
                <option key={freq.value} value={freq.value}>
                  {freq.label}
                </option>
              )) : (
                <option value="monthly">Monthly</option>
              )}
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
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-[#f44322] focus:border-[#f44322] bg-white text-slate-900"
            />
            <p className="text-[11px] text-slate-500 mt-1">
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

