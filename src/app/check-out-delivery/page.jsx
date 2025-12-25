"use client";

import React, { useMemo, useState, useEffect } from "react";
import Button from "@/components/UI/Button";
import BackButton from "@/components/UI/BackButton";
import DeliveryDetails from "@/components/DeliveryDetails";
import Payment from "@/components/Payment";
import DeliveryOptions from "@/components/DeliveryOptions";
import CartSummary from "@/components/CartSummary";
import { usePostRequest } from "@/controller/postRequests";
import { useRouter } from "next/navigation";
import OrderDetails from "@/components/OrderDetails";
import { MdOutlineArrowOutward } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { clearCart } from "@/store/slices/cartSlice";
import { useGetRequest } from "@/controller/getRequests";
import ResponsiveText from "@/components/UI/ResponsiveText";
import { groupItemsByStore, checkDeliverySlotsMatch, areStoresNearby } from "@/utils/cartUtils";
import StoreDeliverySlotSelector from "@/components/StoreDeliverySlotSelector";
import PersonaVerifyButton from "@/components/Verification/PersonaVerifyButton";
import { markCartAsConverted } from "@/utils/cartTracking";
import LoyaltyPointsRedemption from "@/components/LoyaltyPoints/LoyaltyPointsRedemption";
import LoyaltyPointsEarned from "@/components/LoyaltyPoints/LoyaltyPointsEarned";
import GuestCheckoutForm from "@/components/GuestCheckoutForm";
import SubscriptionButton from "@/components/Subscriptions/SubscriptionButton";
import CheckoutSubscriptionSelector from "@/components/Subscriptions/CheckoutSubscriptionSelector";
import { setCustomerEmail } from "@/store/slices/checkoutSlice";

export default function CheckoutDelivery() {
  const router = useRouter();
  const dispatch = useDispatch();

  // Cart state from Redux
  const { items, total } = useSelector((state) => state.cart);
  const { deliverySlots } = useSelector((state) => state.delivery);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const guestInfo = useSelector((state) => state.checkout?.guestInfo);
  const customerEmail = useSelector((state) => state.checkout?.customerEmail);
  const deliveryOption = useSelector((state) => state.checkout?.deliveryOption);

  // Loyalty points redemption state
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [pointsDiscount, setPointsDiscount] = useState(0);
  
  // Subscription state - store subscription data for each product
  const [subscriptions, setSubscriptions] = useState({});

  // Payment method state
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(null);
  const [selectedPaymentMethodType, setSelectedPaymentMethodType] = useState(null); // 'stripe', 'paypal', 'cod'
  
  // Email state for authenticated users
  const [emailInput, setEmailInput] = useState(user?.email || customerEmail || '');
  
  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({});

  // Initialize email from user data or Redux state
  useEffect(() => {
    if (isAuthenticated) {
      const email = user?.email || customerEmail || '';
      if (email) {
        setEmailInput(email);
        if (!customerEmail) {
          dispatch(setCustomerEmail(email));
        }
      }
    }
  }, [isAuthenticated, user?.email, customerEmail, dispatch]);

  // Destructure from hook
  const { data, error, loading, sendPostRequest } = usePostRequest();
  const { data: storeDetailsData, sendGetRequest: getStoreDetails } = useGetRequest();

  // Group items by store
  const storesGrouped = useMemo(() => groupItemsByStore(items), [items]);
  const storeIds = Object.keys(storesGrouped);
  const stores = Object.values(storesGrouped).map(group => group.store).filter(Boolean);
  
  // State to store enhanced store details
  const [enhancedStores, setEnhancedStores] = useState({});
  
  // Fetch store details if address is missing
  useEffect(() => {
    const fetchMissingStoreDetails = async () => {
      const newEnhancedStores = { ...enhancedStores };
      let hasUpdates = false;
      
      for (const storeId of storeIds) {
        if (storeId === 'unknown') continue;
        
        const storeGroup = storesGrouped[storeId];
        const store = storeGroup?.store;
        
        if (!store || !store.id) continue;
        
        // Check if store needs fetching (no address or minimal info)
        const hasAddress = store.full_address || store.address || store.location || 
                          (store.street && store.city) || (store.address_line_1 && store.city);
        
        if (!hasAddress && !enhancedStores[storeId]) {
          try {
            console.log(`🔄 Fetching store details for store ID: ${store.id}`);
            const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
            const response = await fetch(`${apiBase}/api/stores/${store.id}`);
            if (response.ok) {
              const storeData = await response.json();
              const fullStore = storeData?.data || storeData;
              if (fullStore) {
                newEnhancedStores[storeId] = fullStore;
                hasUpdates = true;
                console.log(`✅ Fetched store details for ${storeId}:`, fullStore);
              }
            }
          } catch (error) {
            console.error(`❌ Error fetching store ${store.id}:`, error);
          }
        }
      }
      
      if (hasUpdates) {
        setEnhancedStores(newEnhancedStores);
      }
    };
    
    if (storeIds.length > 0 && items.length > 0) {
      fetchMissingStoreDetails();
    }
  }, [storeIds, storesGrouped, items, enhancedStores]);

  // Check if stores are nearby
  const storesAreNearby = useMemo(() => areStoresNearby(stores), [stores]);

  // Check if delivery slots match
  const slotValidation = useMemo(() => 
    checkDeliverySlotsMatch(deliverySlots, storeIds), 
    [deliverySlots, storeIds]
  );

  // Get delivery address from delivery slice
  const deliveryAddress = useSelector((state) => state.delivery.deliveryAddress) || "528/32 High Street North";

  // Comprehensive validation function
  const validateCheckout = () => {
    const errors = {};

    // 1. Validate email - required for both authenticated and guest users
    if (!isAuthenticated) {
      // Guest checkout validation
      if (!guestInfo?.customer_email) {
        errors.guest_email = 'Email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.customer_email)) {
        errors.guest_email = 'Please enter a valid email address';
      }

      if (!guestInfo?.customer_phone) {
        errors.guest_phone = 'Phone number is required';
      } else if (!/^[0-9+\-\s()]+$/.test(guestInfo.customer_phone)) {
        errors.guest_phone = 'Please enter a valid phone number';
      } else if (guestInfo.customer_phone.replace(/\D/g, '').length < 10) {
        errors.guest_phone = 'Phone number must be at least 10 digits';
      }
    } else {
      // Authenticated user email validation
      const emailToValidate = emailInput || customerEmail || user?.email;
      if (!emailToValidate || emailToValidate.trim() === '') {
        errors.customer_email = 'Email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToValidate)) {
        errors.customer_email = 'Please enter a valid email address';
      }
    }

    // 2. Validate delivery address
    if (!deliveryAddress || deliveryAddress.trim() === '') {
      errors.delivery_address = 'Delivery address is required';
    }

    // 3. Validate delivery option
    if (!deliveryOption) {
      errors.delivery_option = 'Please select a delivery option';
    }

    // 4. Validate delivery slots for each store
    storeIds.forEach((storeId) => {
      const storeSlot = deliverySlots[storeId];
      if (!storeSlot || !storeSlot.date || !storeSlot.time) {
        errors[`delivery_slot_${storeId}`] = `Please select a delivery date and time for ${storesGrouped[storeId]?.store?.name || 'this store'}`;
      }
    });

    // 5. Validate delivery slots match if multiple stores
    if (storeIds.length > 1) {
      if (!slotValidation.matches) {
        errors.delivery_slots_match = 'Please ensure all stores have matching delivery slots';
      }
      
      if (!storesAreNearby) {
        errors.stores_nearby = 'Stores are too far apart. Please checkout with stores from nearby locations only.';
      }
    }

    // 6. Validate payment method - REQUIRED
    if (!selectedPaymentMethodId && !selectedPaymentMethodType) {
      errors.payment_method = 'Please select a payment method';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOrderNow = async () => {
    // Clear previous errors
    setValidationErrors({});

    // Basic cart validation
    if (!items.length) {
      alert("Your cart is empty!");
      return;
    }

    // Comprehensive validation
    if (!validateCheckout()) {
      // Scroll to first error
      const firstErrorElement = document.querySelector('[data-validation-error]');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorElement.focus();
      } else {
        // Show first error in alert if element not found
        const firstError = Object.values(validationErrors)[0];
        if (firstError) {
          alert(firstError);
        }
      }
      return;
    }

    // Debug: Log subscription data before order
    if (typeof window !== 'undefined') {
      console.log('🛒 Order submission - Subscription state:', {
        subscriptions,
        items: items.map(item => ({
          id: item.id,
          productId: item.product?.id,
          subscriptionData: subscriptions[item.product?.id]
        }))
      });
    }

    // Create orders for each store
    const orderPromises = storeIds.map(async (storeId) => {
      const storeGroup = storesGrouped[storeId];
      const storeItems = storeGroup.items;
      const storeSlot = deliverySlots[storeId] || { date: "", time: "" };

      // Determine payment method type and ID
      // Priority: selectedPaymentMethodType > selectedPaymentMethodId (stripe) > cod
      let paymentMethodType = selectedPaymentMethodType || (selectedPaymentMethodId ? 'stripe' : 'cod');
      const stripePaymentMethodId = selectedPaymentMethodId; // This is the Stripe payment method ID (pm_xxx) or database ID

      const orderPayload = {
        store_id: parseInt(storeId),
        // Include email for both authenticated and guest users
        customer_email: isAuthenticated 
          ? (emailInput || customerEmail || user?.email || '')
          : (guestInfo?.customer_email || ''),
        // Include phone for guest users only
        ...(isAuthenticated ? {} : {
          customer_phone: guestInfo?.customer_phone || '',
        }),
        // Include payment method information
        ...(paymentMethodType === 'paypal' ? {
          payment_method: 'paypal',
        } : selectedPaymentMethodId ? {
          payment_method: paymentMethodType,
          payment_method_id: stripePaymentMethodId,
        } : {
          payment_method: 'cod',
        }),
        items: storeItems.map((item) => {
          const productDetail = {
            name: item.product.name,
            quantity: item.quantity,
            color: item.color,
            description: item.product.description,
          };

          // Add optional fields only if they exist
          if (item.batteryLife) productDetail.batteryLife = item.batteryLife;
          if (item.ram) productDetail.ram = item.ram;
          if (item.storage) productDetail.storage = item.storage;
          if (item.size) productDetail.size = item.size;

          const productId = item.product.id;
          const subscriptionData = subscriptions[productId];
          
          return {
            product_id: productId,
            shipping_fee: "5",
            shipping_address: deliveryAddress,
            delivery_option: "delivery",
            shipping_status: "pending",
            payment_status: "done",
            price: item.price * item.quantity,
            product_detail: {
              ...productDetail,
              delivery_date: storeSlot.date,
              delivery_time: storeSlot.time,
            },
            // Include subscription data if user selected subscription
            ...(subscriptionData && subscriptionData.enabled ? {
              subscription: {
                enabled: true, // Explicitly set enabled flag
                frequency: subscriptionData.frequency,
                quantity: subscriptionData.quantity || item.quantity,
                remaining_deliveries: subscriptionData.num_deliveries ? parseInt(subscriptionData.num_deliveries) : null,
              }
            } : {}),
          };
        }),
        total: storeItems.reduce((sum, item) => sum + item.price * item.quantity, 0) - pointsDiscount,
        status: "pending",
        ...(pointsToRedeem > 0 && {
          loyalty_points_redeemed: pointsToRedeem,
          loyalty_points_discount: pointsDiscount,
        }),
      };

      return sendPostRequest("/orders", orderPayload, true);
    });

    // Send all orders
    try {
      const responses = await Promise.all(orderPromises);
      const allSuccessful = responses.every(response => response.status === 201);
      
      if (allSuccessful) {
        // Extract order IDs from responses
        // API returns: { status: 201, message: "...", data: { id: ..., ... } }
        const orderIds = responses.map(r => {
          // Handle different response structures
          const orderData = r?.data?.data || r?.data || r;
          const orderId = orderData?.id || orderData?.order?.id;
          console.log('Extracted order ID from response:', { 
            response: r?.data, 
            orderData, 
            orderId 
          });
          return orderId;
        }).filter(Boolean);
        
        console.log('All order IDs:', orderIds);
        
        // Mark abandoned cart as converted if recovery token exists
        const recoveryToken = localStorage.getItem('cart_recovery_token');
        if (recoveryToken) {
          const firstOrderId = orderIds[0] || null;
          await markCartAsConverted(recoveryToken, firstOrderId);
        }
        
        // Dispatch event to refresh recommendations
        if (typeof window !== 'undefined') {
          const orderPlacedEvent = new CustomEvent('orderPlaced', {
            detail: { orderIds }
          });
          window.dispatchEvent(orderPlacedEvent);
          console.log('🛒 Order placed event dispatched');
        }
        
        // Clear cart and points redemption state after successful orders
        dispatch(clearCart());
        setPointsToRedeem(0);
        setPointsDiscount(0);
        
        // Check if any response has a redirect URL (for PayPal, etc.)
        let redirectUrl = null;
        for (const response of responses) {
          if (response?.data?.redirectUrl) {
            redirectUrl = response.data.redirectUrl;
            console.log('Found redirect URL in response:', redirectUrl);
            break;
          }
        }
        
        // If redirect URL exists (e.g., PayPal), redirect to it
        if (redirectUrl) {
          console.log('Redirecting to payment gateway:', redirectUrl);
          window.location.href = redirectUrl;
          return; // Don't continue with order details redirect
        }
        
        // Redirect to order details page (use first order if multiple)
        const firstOrderId = orderIds[0];
        if (firstOrderId) {
          console.log('Redirecting to order details:', `/orders/${firstOrderId}`);
          router.push(`/orders/${firstOrderId}`);
        } else {
          console.warn('No order ID found in response, redirecting to home');
          // Fallback to home if order ID not found
        router.push("/home");
        }
      } else {
        alert("Some orders failed. Please try again.");
      }
    } catch (err) {
      console.log("Order failed:", err.message);
      alert("Failed to place orders. Please try again.");
    }
  };

  // Show validation message if slots don't match
  const showSlotWarning = storeIds.length > 1 && !slotValidation.matches;

  // Show loading state immediately while components load
  if (!items.length) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#F24E2E] mb-4"></div>
            <p className="text-gray-600">Loading checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page Container */}
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-6">
        {/* Top nav back */}
        <div className="flex items-center gap-2 mb-6">
          <BackButton iconClasses="!text-black" />
        </div>

        {/* Multi-store notice */}
        {storeIds.length > 1 && (
          <div
            className={`mb-5 p-4 rounded-xl border ${
              showSlotWarning
                ? "bg-yellow-50 border-yellow-200"
                : slotValidation.matches
                ? "bg-green-50 border-green-200"
                : "bg-blue-50 border-blue-200"
            }`}
          >
            <p
              className={`text-sm ${
                showSlotWarning
                  ? "text-yellow-800"
                  : slotValidation.matches
                  ? "text-green-800"
                  : "text-blue-800"
              }`}
            >
              {showSlotWarning
                ? "⚠️ Please select matching delivery slots for all stores to checkout together."
                : slotValidation.matches
                ? "✓ All delivery slots match. You can checkout together!"
                : "ℹ️ You have items from multiple stores. Please ensure delivery slots match."}
            </p>
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            {/* Guest Checkout Form - Show only if not authenticated */}
            {!isAuthenticated && (
              <div data-validation-error={validationErrors.guest_email || validationErrors.guest_phone ? 'true' : undefined}>
                <GuestCheckoutForm />
                {validationErrors.guest_email && (
                  <p className="mt-2 text-sm text-red-500">{validationErrors.guest_email}</p>
                )}
                {validationErrors.guest_phone && (
                  <p className="mt-2 text-sm text-red-500">{validationErrors.guest_phone}</p>
                )}
              </div>
            )}

            {/* Email field for authenticated users */}
            {isAuthenticated && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5" data-validation-error={validationErrors.customer_email ? 'true' : undefined}>
                <h3 className="text-base font-semibold text-oxford-blue mb-4">Contact Information</h3>
                <div>
                  <label htmlFor="customer_email" className="block text-sm font-medium text-oxford-blue mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="customer_email"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      dispatch(setCustomerEmail(e.target.value));
                    }}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-vivid-red ${
                      validationErrors.customer_email ? 'border-red-500' : 'border-slate-300'
                    }`}
                    placeholder="your.email@example.com"
                    aria-label="Email address"
                    aria-required="true"
                    aria-invalid={!!validationErrors.customer_email}
                    aria-describedby={validationErrors.customer_email ? 'email-error' : undefined}
                  />
                  {validationErrors.customer_email && (
                    <p id="email-error" className="mt-1 text-sm text-red-500" role="alert">
                      {validationErrors.customer_email}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Delivery Details Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between px-5 pt-5">
                <h2 className="text-base font-semibold text-oxford-blue">Delivery Details</h2>
                <div className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 text-xs">✎</div>
              </div>
              <div className="px-5 pb-5" data-validation-error={validationErrors.delivery_address ? 'true' : undefined}>
                <DeliveryDetails />
                {validationErrors.delivery_address && (
                  <p className="mt-2 text-sm text-red-500">{validationErrors.delivery_address}</p>
                )}
              </div>
            </div>

            {/* Store-specific selectors */}
            {storeIds.map((storeId) => {
              const storeGroup = storesGrouped[storeId];
              // Use enhanced store details if available, otherwise use the original store
              const store = enhancedStores[storeId] || storeGroup.store;
              if (!store) return null;
              return (
                <div 
                  key={storeId} 
                  className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4"
                  data-validation-error={validationErrors[`delivery_slot_${storeId}`] ? 'true' : undefined}
                >
                  <StoreDeliverySlotSelector storeId={storeId} storeName={store.name} />
                  {validationErrors[`delivery_slot_${storeId}`] && (
                    <p className="mt-2 text-sm text-red-500">{validationErrors[`delivery_slot_${storeId}`]}</p>
                  )}
                </div>
              );
            })}

            {/* Delivery Options Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm" data-validation-error={validationErrors.delivery_option ? 'true' : undefined}>
              <div className="flex items-center justify-between px-5 pt-5">
                <h2 className="text-base font-semibold text-oxford-blue">Delivery Options</h2>
                <div className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 text-xs">i</div>
              </div>
              <div className="px-5 pb-5">
                <DeliveryOptions />
                {validationErrors.delivery_option && (
                  <p className="mt-2 text-sm text-red-500">{validationErrors.delivery_option}</p>
                )}
              </div>
            </div>

            {/* Payment Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm" data-validation-error={validationErrors.payment_method ? 'true' : undefined}>
              <div className="flex items-center justify-between px-5 pt-5">
                <h2 className="text-base font-semibold text-oxford-blue">Payment</h2>
                <div className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 text-xs">＋</div>
              </div>
              <div className="px-5 pb-5">
                <Payment 
                  onPaymentMethodSelect={setSelectedPaymentMethodId}
                  selectedPaymentMethodId={selectedPaymentMethodId}
                  onPaymentMethodTypeSelect={setSelectedPaymentMethodType}
                  selectedPaymentMethodType={selectedPaymentMethodType}
                />
                {validationErrors.payment_method && (
                  <p className="mt-2 text-sm text-red-500">
                    {validationErrors.payment_method}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="pt-2">
              <Button
                fullWidth
                className="bg-vivid-red h-[56px] rounded-md text-white !text-base"
                onClick={handleOrderNow}
                disabled={loading || (storeIds.length > 1 && !slotValidation.matches)}
              >
                {loading ? "Placing Order..." : "Continue to Payment"}
              </Button>
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            {/* Store card(s) */}
            {storeIds.map((storeId) => {
              const storeGroup = storesGrouped[storeId];
              // Use enhanced store details if available, otherwise use the original store
              const store = enhancedStores[storeId] || storeGroup.store;
              if (!store) return null;
              const storeTotal = storeGroup.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
              
              // Normalize store logo URL
              const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
              const storeLogoPath = store?.logo;
              let storeLogoSrc = '/images/stores/default-logo.png';
              
              if (storeLogoPath && String(storeLogoPath).trim()) {
                const logoStr = String(storeLogoPath).trim();
                // If it's already an absolute URL, use it directly
                if (logoStr.startsWith('http://') || logoStr.startsWith('https://')) {
                  storeLogoSrc = logoStr;
                } else if (logoStr.startsWith('/')) {
                  // If it's an absolute path, prepend API base URL
                  storeLogoSrc = base ? `${base}${logoStr}` : logoStr;
                } else {
                  // Relative path, construct full URL
                  storeLogoSrc = base ? `${base}/${logoStr.replace(/^\/+/, '')}` : `/${logoStr}`;
                }
              }
              
              return (
                <div key={storeId} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative w-[64px] h-[64px] overflow-hidden rounded-full bg-gray-200 flex-shrink-0">
                        <img
                          src={storeLogoSrc}
                          alt={store?.name || "Store logo"}
                          className="w-full h-full object-fill"
                          onError={(e) => {
                            e.target.src = '/images/stores/default-logo.png';
                          }}
                        />
                      </div>
                      <div>
                        <ResponsiveText as="h2" minSize="1rem" maxSize="1.375rem" className="font-semibold text-oxford-blue">
                          {store?.name || "Unknown Store"}
                        </ResponsiveText>
                        <p className="text-xs text-sonic-silver">
                          {(() => {
                            // Extract store address - try multiple possible fields
                            return store?.full_address || 
                                   store?.address || 
                                   store?.location || 
                                   (store?.street && store?.city ? `${store.street}, ${store.city}` : null) ||
                                   (store?.address_line_1 && store?.city ? `${store.address_line_1}, ${store.city}` : null) ||
                                   "No address available";
                          })()}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {storeGroup.items.length} item{storeGroup.items.length !== 1 ? "s" : ""} • £{storeTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xl text-vivid-red"><MdOutlineArrowOutward /></span>
                  </div>
                  <div className="mt-3">
                    <Button className="bg-vivid-red h-11 rounded-md text-white !text-sm px-5">Continue to Payment</Button>
                  </div>
                </div>
              );
            })}

            {/* Cart Summary */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-5 py-4 border-b">
                <h3 className="text-sm font-semibold text-oxford-blue">Cart Summary ({items.length} {items.length === 1 ? "Item" : "Items"})</h3>
              </div>
              <div className="px-5 py-4">
                <CartSummary />
              </div>
              {/* Show loyalty points earned - outside accordion for visibility */}
              <div className="px-5 pb-4">
                <LoyaltyPointsEarned orderTotal={total - pointsDiscount} />
              </div>
            </div>

            {/* Subscription Options - Show for products with subscription enabled */}
            {(() => {
              // Debug: Log cart items structure
              if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
                console.log('🔍 Checkout - Cart items:', items);
                console.log('🔍 Checkout - Is authenticated:', isAuthenticated);
                items.forEach((item, idx) => {
                  console.log(`🔍 Item ${idx}:`, {
                    id: item.id,
                    name: item.name,
                    product: item.product,
                    subscription_enabled: item.product?.subscription_enabled,
                    hasProduct: !!item.product
                  });
                });
              }
              
              // Debug logging
              if (typeof window !== 'undefined') {
                console.log('🔍 Subscription Debug:', {
                  isAuthenticated,
                  itemsCount: items.length,
                  items: items.map(item => ({
                    id: item.id,
                    productId: item.product?.id,
                    productName: item.product?.name,
                    subscription_enabled: item.product?.subscription_enabled,
                    hasProduct: !!item.product
                  }))
                });
              }
              
              const hasSubscribableItems = items.some(item => {
                // Check multiple possible paths for subscription_enabled
                const enabled = item.product?.subscription_enabled || 
                                item.subscription_enabled || 
                                (item.product && (item.product.subscription_enabled === true || item.product.subscription_enabled === 1));
                
                if (typeof window !== 'undefined') {
                  console.log('🔍 Checking item:', item.id, 'subscription_enabled:', enabled);
                }
                
                return enabled;
              });
              
              if (typeof window !== 'undefined') {
                console.log('🔍 Will show subscription section:', isAuthenticated && hasSubscribableItems);
              }
              
              // TEMPORARY: Show for all products if authenticated (for testing)
              // Remove this line and uncomment the line below once subscription_enabled is set in database
              return isAuthenticated && items.length > 0; // TEMP: Show for all products
              // return isAuthenticated && hasSubscribableItems; // Original condition
            })() && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-5 py-4 border-b">
                  <h3 className="text-sm font-semibold text-oxford-blue">Subscription Options</h3>
                  <p className="text-xs text-gray-500 mt-1">Select subscription settings for products (optional)</p>
                </div>
                <div className="px-5 py-4 space-y-4">
                  {items
                    // TEMPORARY: Show for all products (for testing)
                    // Uncomment the filter below once subscription_enabled is set in database
                    // .filter(item => {
                    //   // Check multiple possible paths for subscription_enabled
                    //   return item.product?.subscription_enabled || 
                    //          item.subscription_enabled || 
                    //          (item.product && (item.product.subscription_enabled === true || item.product.subscription_enabled === 1));
                    // })
                    .map((item, index) => {
                      // Get product data - try multiple paths
                      const productData = item.product || item;
                      const productId = productData?.id || item.id;
                      
                      return (
                        <div key={`${item.id}-${item.color || 'no-color'}-${item.size || 'no-size'}-${index}`}>
                          <CheckoutSubscriptionSelector
                            product={productData}
                            onSubscriptionChange={(subscriptionData) => {
                              // Debug logging
                              if (typeof window !== 'undefined') {
                                console.log('📥 Checkout page - Subscription changed:', {
                                  productId,
                                  subscriptionData,
                                  currentSubscriptions: subscriptions
                                });
                              }
                              
                              setSubscriptions(prev => {
                                const updated = {
                                  ...prev,
                                  [productId]: subscriptionData
                                };
                                
                                if (typeof window !== 'undefined') {
                                  console.log('📦 Updated subscriptions state:', updated);
                                }
                                
                                return updated;
                              });
                            }}
                          />
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Loyalty Points Redemption */}
            {isAuthenticated && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-5 py-4">
                  <LoyaltyPointsRedemption
                    onPointsChange={(points, discount) => {
                      setPointsToRedeem(points);
                      setPointsDiscount(discount);
                    }}
                    orderTotal={total}
                  />
                </div>
              </div>
            )}

            {/* Order Details */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-5 py-4">
                <OrderDetails pointsDiscount={pointsDiscount} />
                {/* Show loyalty points earned in order details section */}
                <LoyaltyPointsEarned orderTotal={total - pointsDiscount} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
