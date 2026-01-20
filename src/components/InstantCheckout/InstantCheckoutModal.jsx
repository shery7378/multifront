'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import axios from 'axios';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useSelector } from 'react-redux';

export default function InstantCheckoutModal({ isOpen, onClose, onConfirm, product, quantity = 1, items = null }) {
  const [addresses, setAddresses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(null);
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [useSavedPayment, setUseSavedPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Get currency context for proper price formatting
  const { formatPrice, currency: selectedCurrency, currencyRates, defaultCurrency } = useCurrency();
  
  // Get cart data to match shipping fees and calculations
  const cartItems = useSelector((state) => state.cart?.items || []);
  const appliedCoupon = useSelector((state) => state.cart?.appliedCoupon);
  const hasFreeShipping = Boolean(appliedCoupon?.free_shipping || appliedCoupon?.type === 'free_shipping');

  useEffect(() => {
    if (isOpen) {
      fetchSavedData();
    }
  }, [isOpen]);

  const fetchSavedData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const [addressRes, paymentRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/addresses`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/payment-methods`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: { data: [] } })),
      ]);

      const addressData = addressRes.data?.data || [];
      setAddresses(addressData);
      
      // Set default address
      const defaultAddress = addressData.find(addr => addr.is_default) || addressData[0];
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      }

      // Handle different response structures for payment methods
      let paymentData = [];
      if (paymentRes.data) {
        console.log('Payment methods API response:', paymentRes.data);
        
        // Check for payment_methods array directly
        if (Array.isArray(paymentRes.data.payment_methods)) {
          paymentData = paymentRes.data.payment_methods;
        } 
        // Check for nested data.payment_methods
        else if (paymentRes.data.data && Array.isArray(paymentRes.data.data.payment_methods)) {
          paymentData = paymentRes.data.data.payment_methods;
        }
        // Check for data array
        else if (Array.isArray(paymentRes.data.data)) {
          paymentData = paymentRes.data.data;
        }
      }
      
      console.log('Parsed payment methods:', paymentData);

      // Format payment methods to match expected structure
      const formattedPaymentMethods = paymentData.map(method => ({
        id: method.id, // Stripe payment method ID (pm_xxx)
        stripe_payment_method_id: method.id,
        card_brand: method.card?.brand || method.card_brand || 'Card',
        last_four: method.card?.last4 || method.last_four || method.card_last4 || '****',
        exp_month: method.card?.exp_month || method.exp_month || method.card_exp_month,
        exp_year: method.card?.exp_year || method.exp_year || method.card_exp_year,
        type: method.type || 'card',
      }));

      setPaymentMethods(formattedPaymentMethods);
      
      if (formattedPaymentMethods.length > 0) {
        setUseSavedPayment(true);
        setSelectedPaymentMethodId(formattedPaymentMethods[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch saved data:', err);
    }
  };

  const handleConfirm = () => {
    if (!selectedAddressId) {
      alert('Please select a shipping address');
      return;
    }

    if (onConfirm) {
      onConfirm({
        useSavedAddress,
        useSavedPayment,
        addressId: selectedAddressId,
        paymentMethodId: selectedPaymentMethodId,
      });
    }
  };

  const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
  
  // Calculate totals - support both single product and cart items
  // Use the same dynamic calculation as CheckOutModal to ensure consistency
  let price, shippingFee, total;
  
  // Calculate shipping fees dynamically (same logic as CheckOutModal)
  const calculateShippingFees = (itemsToCalculate) => {
    if (!itemsToCalculate || itemsToCalculate.length === 0) {
      return { deliveryFee: 0, fees: 0 };
    }
    
    let totalDeliveryFee = 0;
    let totalFees = 0;
    const processedStores = new Set();
    
    // Group items by store
    const itemsByStore = {};
    itemsToCalculate.forEach(item => {
      // Get store ID from multiple possible sources
      const storeId = item.store_id || 
                     item.product?.store_id || 
                     item.store?.id || 
                     item.product?.store?.id ||
                     'unknown';
      if (!itemsByStore[storeId]) {
        itemsByStore[storeId] = [];
      }
      itemsByStore[storeId].push(item);
    });
    
    // Calculate fees per store
    Object.keys(itemsByStore).forEach(storeId => {
      if (storeId === 'unknown' || processedStores.has(storeId)) return;
      processedStores.add(storeId);
      
      const storeItems = itemsByStore[storeId];
      if (storeItems.length === 0) {
        totalDeliveryFee += 2.29;
        totalFees += 2.09;
        return;
      }
      
      const firstItem = storeItems[0];
      // Get store from multiple possible sources
      const store = firstItem.store || 
                   firstItem.product?.store || 
                   (firstItem.product?.store_id ? { id: firstItem.product.store_id } : null);
      
      // Get delivery fee (priority: item > product > store > default)
      // Check multiple possible field names
      let shippingCharge = firstItem?.shipping_charge_regular || 
                          firstItem?.shipping_charge_same_day ||
                          firstItem?.shipping_charge ||
                          firstItem?.product?.shipping_charge_regular || 
                          firstItem?.product?.shipping_charge_same_day || 
                          firstItem?.product?.shipping_charge ||
                          store?.shipping_charge_regular ||
                          store?.shipping_charge_same_day ||
                          store?.shipping_charge ||
                          store?.delivery_fee ||
                          store?.delivery_charge ||
                          2.29; // Default
      
      // Apply free shipping if coupon applies
      if (hasFreeShipping) {
        shippingCharge = 0;
      }
      
      // Calculate fees - commission, platform fees, etc.
      const storeSubtotal = storeItems.reduce((sum, item) => 
        sum + (item.price || item.product?.price || 0) * (item.quantity || 1), 0
      );
      
      let calculatedFees = 0;
      // Get commission rate from multiple sources
      const commissionRate = firstItem?.commission_rate ||
                            firstItem?.product?.commission_rate || 
                            store?.commission_rate || 
                            0.02; // Default 2%
      
      // Calculate fees: fixed amount or percentage
      // Check multiple possible fee fields
      if (firstItem?.fees && typeof firstItem.fees === 'number') {
        calculatedFees = firstItem.fees;
      } else if (firstItem?.product?.fees && typeof firstItem.product.fees === 'number') {
        calculatedFees = firstItem.product.fees;
      } else if (store?.fees && typeof store.fees === 'number') {
        calculatedFees = store.fees;
      } else if (commissionRate > 0) {
        calculatedFees = storeSubtotal * commissionRate;
      } else {
        calculatedFees = Math.max(storeSubtotal * 0.02, 2.09);
      }
      
      totalDeliveryFee += shippingCharge;
      totalFees += calculatedFees;
    });
    
    return { deliveryFee: totalDeliveryFee, fees: totalFees };
  };
  
  if (items && items.length > 0) {
    // For cart items, use the prices from items (already in selected currency)
    price = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Calculate shipping fees dynamically
    const shippingFees = calculateShippingFees(items);
    const currencyRate = currencyRates[selectedCurrency] || 1;
    const deliveryFee = shippingFees.deliveryFee * currencyRate;
    const fees = shippingFees.fees * currencyRate;
    shippingFee = deliveryFee + fees;
    
    total = price + shippingFee;
  } else {
    // For single product, get price and convert if needed
    const basePrice = product?.selling_price || product?.price || 0;
    
    // Convert price to selected currency if needed
    if (selectedCurrency !== defaultCurrency && currencyRates[selectedCurrency]) {
      price = basePrice * currencyRates[selectedCurrency] * quantity;
    } else {
      price = basePrice * quantity;
    }
    
    // Create a single-item array for shipping calculation
    const singleItem = [{
      ...product,
      price: basePrice,
      quantity: quantity,
      product: product,
      store: product?.store,
      store_id: product?.store_id || product?.store?.id,
    }];
    
    // Calculate shipping fees dynamically
    const shippingFees = calculateShippingFees(singleItem);
    const currencyRate = currencyRates[selectedCurrency] || 1;
    const deliveryFee = shippingFees.deliveryFee * currencyRate;
    const fees = shippingFees.fees * currencyRate;
    shippingFee = deliveryFee + fees;
    
    total = price + shippingFee;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Instant Checkout"
      className="max-w-md"
      showCloseButton={true}
    >
      <div className="space-y-4">
        {/* Product/Cart Summary */}
        <div className="p-3 bg-gray-50 rounded-lg">
          {items && items.length > 0 ? (
            <>
              <div className="font-medium mb-2">Cart Items ({items.length})</div>
              {items.slice(0, 3).map((item, idx) => (
                <div key={idx} className="text-sm text-gray-600 mb-1">
                  {item.product?.name || 'Product'} × {item.quantity}
                </div>
              ))}
              {items.length > 3 && (
                <div className="text-xs text-gray-500">+{items.length - 3} more items</div>
              )}
            </>
          ) : (
            <div className="flex justify-between items-center">
              <span className="font-medium">{product?.name}</span>
              <span className="text-sm text-gray-600">Qty: {quantity}</span>
            </div>
          )}
          <div className="mt-2 flex justify-between text-sm">
            <span>Subtotal:</span>
            <span className="font-semibold">{formatPrice(price)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping:</span>
            <span>{formatPrice(shippingFee)}</span>
          </div>
          <div className="mt-2 pt-2 border-t flex justify-between font-semibold">
            <span>Total:</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        {/* Address Selection */}
        {addresses.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shipping Address
            </label>
            <div className="space-y-2">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={`flex items-start p-3 border rounded-lg cursor-pointer ${
                    selectedAddressId === address.id
                      ? 'border-[#F44422] bg-red-50'
                      : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    value={address.id}
                    checked={selectedAddressId === address.id}
                    onChange={() => setSelectedAddressId(address.id)}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{address.name || address.label}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {address.address_line_1}
                      {address.address_line_2 && `, ${address.address_line_2}`}
                      <br />
                      {address.city}, {address.state} {address.postal_code}
                    </div>
                    {address.is_default && (
                      <span className="text-xs text-[#F44422] font-medium">Default</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Payment Method Selection */}
        {paymentMethods.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <div className="space-y-2">
              {paymentMethods.map((method) => (
                <label
                  key={method.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                    selectedPaymentMethodId === method.id
                      ? 'border-[#F44422] bg-red-50'
                      : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method.id}
                    checked={selectedPaymentMethodId === method.id}
                    onChange={() => {
                      setSelectedPaymentMethodId(method.id);
                      setUseSavedPayment(true);
                    }}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {method.card_brand || 'Card'} •••• {method.last_four || '****'}
                    </div>
                    <div className="text-xs text-gray-600">
                      Expires {method.exp_month}/{method.exp_year}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {paymentMethods.length === 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            No saved payment methods. You'll be redirected to payment page.
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleConfirm}
            className="flex-1"
            disabled={loading || !selectedAddressId}
          >
            {loading ? 'Processing...' : 'Complete Order'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

