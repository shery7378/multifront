// src/hooks/useLoadAuth.jsx
'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess, logout } from '@/store/slices/authSlice';
import axios from 'axios';

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
      
      // Fetch fresh profile data from API to ensure we have the latest image from profiles table
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      if (baseUrl) {
        const profileUrl = `${baseUrl.replace(/\/$/, '')}/api/customer-profile`;
        
        axios.get(profileUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }).then((response) => {
          const freshUser = response.data;
          if (freshUser?.data) {
            // Extract user data from API response and merge with profile data
            const userData = freshUser.data.user || {};
            const profileData = freshUser.data.profile || {};
            
            // Determine the image - profile image takes highest priority
            const profileImage = profileData?.image || null;
            const userImageFromData = userData?.image || null; // Backend sets this if profile has image
            const currentImage = parsedUser?.image || null;
            const finalImage = profileImage || userImageFromData || currentImage || null;
            
            // Merge: start with parsed user, then API user data, then profile image
            const mergedUser = {
              ...parsedUser,
              ...userData, // This now includes image if profile has one (backend sets it)
              // Explicitly set image (profile takes highest priority)
              image: finalImage,
              // Include profile data for components that need it
              profile: profileData,
              // Also update name from profile if available
              name: userData?.name || parsedUser?.name || (profileData?.first_name && profileData?.last_name 
                ? `${profileData.first_name} ${profileData.last_name}` 
                : parsedUser?.name)
            };
            
            // Update localStorage to persist the merged user
            localStorage.setItem('auth_user', JSON.stringify(mergedUser));
            
            // Update Redux with fresh data
            dispatch(loginSuccess({ token, user: mergedUser }));
          }
        }).catch((err) => {
          // If profile fetch fails, still use the user from localStorage
          // This is expected if the token is invalid or expired
          if (err?.response?.status !== 401 && err?.response?.status !== 403) {
            console.warn('Failed to fetch fresh profile on load:', err);
          }
        });
      }
      
      // Dispatch event to trigger favorite reload in components (for page refreshes)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('userLoggedIn'));
      }
    } else {
      dispatch(logout());
    }
  }, [dispatch]); // Only run once on mount
}

