/**
 * Cart Tracking Utility
 * Tracks cart changes and sends to backend for abandoned cart recovery
 */

let trackingTimeout = null;
let lastCartData = null;

/**
 * Track cart changes and save to backend
 */
export async function trackCart(cartItems, total, userId = null, email = null, phone = null) {
  // Clear existing timeout
  if (trackingTimeout) {
    clearTimeout(trackingTimeout);
  }

  // Debounce tracking (wait 2 seconds after last change)
  trackingTimeout = setTimeout(async () => {
    try {
      const cartData = {
        items: cartItems.map(item => ({
          id: item.id || item.product?.id,
          product_id: item.product?.id || item.id,
          product: item.product || {},
          name: item.product?.name || item.name,
          price: item.price,
          quantity: item.quantity,
          color: item.color,
          size: item.size,
          battery_life: item.batteryLife,
          storage: item.storage,
          ram: item.ram,
        })),
        total: total || cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        item_count: cartItems.length,
      };

      // Only track if cart has items and data has changed
      if (cartData.items.length > 0 && JSON.stringify(cartData) !== JSON.stringify(lastCartData)) {
        lastCartData = cartData;

        const token = localStorage.getItem('auth_token');
        const sessionId = getSessionId();

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/abandoned-carts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            'X-Session-ID': sessionId,
          },
          body: JSON.stringify({
            cart_data: cartData,
            email: email,
            phone: phone,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // Store recovery token if provided
          if (data.data?.recovery_token) {
            localStorage.setItem('cart_recovery_token', data.data.recovery_token);
            console.log('✅ Cart tracked successfully, recovery token:', data.data.recovery_token);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Failed to track cart:', response.status, errorData);
        }
      }
    } catch (error) {
      console.error('Failed to track cart:', error);
    }
  }, 2000); // 2 second debounce
}

/**
 * Get or create session ID
 */
function getSessionId() {
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('session_id', sessionId);
  }
  return sessionId;
}

/**
 * Generate unique session ID
 */
function generateSessionId() {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
}

/**
 * Clear cart tracking
 */
export function clearCartTracking() {
  if (trackingTimeout) {
    clearTimeout(trackingTimeout);
  }
  lastCartData = null;
  localStorage.removeItem('cart_recovery_token');
}

/**
 * Mark cart as converted (order placed)
 */
export async function markCartAsConverted(recoveryToken, orderId = null) {
  try {
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/abandoned-carts/${recoveryToken}/converted`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          order_id: orderId,
        }),
      }
    );

    if (response.ok) {
      clearCartTracking();
      return true;
    }
  } catch (error) {
    console.error('Failed to mark cart as converted:', error);
  }
  return false;
}

