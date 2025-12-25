// src/hooks/useLoadAuth.jsx
'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess, logout } from '@/store/slices/authSlice';

export function useLoadAuth() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');

    if (token) {
      // Parse user if saved as JSON
      const parsedUser = user ? JSON.parse(user) : null;
      dispatch(loginSuccess({ token, user: parsedUser }));
      // Dispatch event to trigger favorite reload in components (for page refreshes)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('userLoggedIn'));
      }
    } else {
      dispatch(logout());
    }
  }, [dispatch]);
}

