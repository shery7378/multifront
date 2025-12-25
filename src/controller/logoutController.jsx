// src/controller/logoutController.jsx
'use client';

import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { logout } from '@/store/slices/authSlice';

export function useLogout() {
  const router = useRouter();
  const pathname = usePathname(); // ✅ Get current page path
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      // Call backend logout API
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/logout`,
        {},
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );

      console.log('Logout successful');

      // Remove token and user from localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      
      // Clear favorites from localStorage
      localStorage.removeItem('favorites');
      localStorage.removeItem('favoriteProducts');
      localStorage.removeItem('favoriteStores');
      
      // Clear personalized feed/recommendations from localStorage
      localStorage.removeItem('personalizedFeed');
      localStorage.removeItem('recommendations');
      
      // Note: We do NOT clear the cart on logout - it should persist across login/logout sessions
      // The cart is stored locally via Redux Persist and is not tied to a specific user account

      // Clear cookie
      document.cookie = 'auth_token=; Max-Age=0; path=/';

      // Update Redux auth state
      dispatch(logout());
      
      // Dispatch event to refresh favorite icons in UI
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('favoritesCleared'));
      }

      // ✅ Redirect to login with ?redirect=<currentPath>
      const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.replace(loginUrl);

    } catch (err) {
      console.error('Logout failed:', err);
      // Optional: show error to user
    }
  };

  return { handleLogout };
}
