'use client';
//src/controller/getRequests.jsx
import { useState, useCallback } from 'react';
import axios from 'axios';

export function useGetRequest() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const sendGetRequest = useCallback(async (endpoint, withAuth = false, options = {}) => {
    const { suppressAuthErrors = false, suppressErrors = false, background = false } = options;
    if (!background) {
      setLoading(true);
      setError('');
      setData(null);
    }

    try {
      const headers = withAuth
        ? {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          }
        : {};

      // Resolve final URL
      const isAbsolute = typeof endpoint === 'string' && (/^https?:\/\//i).test(endpoint);
      const base = process.env.NEXT_PUBLIC_API_URL;
      
      if (!base && !isAbsolute) {
        const errorMsg = 'NEXT_PUBLIC_API_URL is not configured. Please set it in your .env file.';
        console.error('[GET] Configuration Error:', errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }
      
      const finalUrl = isAbsolute
        ? endpoint
        : `${base.replace(/\/$/, '')}/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

      if (typeof window !== 'undefined') {
        console.log('[GET] Request URL:', finalUrl);
        console.log('[GET] Base URL:', base);
      }

      const res = await axios.get(finalUrl, {
        withCredentials: withAuth,
        headers,
      });
      if (typeof window !== 'undefined') {
        console.log('[GET] success:', finalUrl, res?.status);
        console.log('[GET] response data:', res?.data);
      }
      if (background) {
        // In background mode, only update data on success, don't clear on error
        setData(res.data);
      } else {
        setData(res.data);
      }
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message
        || (err?.message === 'Network Error' ? 'Network error (CORS/base URL). Check NEXT_PUBLIC_API_URL and server availability.' : err?.message)
        || 'Failed to fetch data. Please try again.';
      if (!background) {
        setError(message);
      }
      if (typeof window !== 'undefined') {
        if (suppressErrors) {
          // Suppress all error logging when suppressErrors is true
          // console.log('[GET] error suppressed:', err?.config?.url);
        } else if ((status === 401 || status === 403) && suppressAuthErrors) {
          // Silent (or minimal) for auth/role errors when requested
          // console.warn('[GET] unauthorized/forbidden (suppressed):', err?.config?.url, message);
        } else if (status === 401 || status === 403) {
          console.warn('[GET] unauthorized/forbidden:', err?.config?.url, message);
        } else {
          console.error('[GET] failed:', err?.config?.url, message);
        }
      } else {
        if (suppressErrors) {
          // Suppress all error logging when suppressErrors is true
        } else if ((status === 401 || status === 403) && suppressAuthErrors) {
          // silent
        } else if (status === 401 || status === 403) {
          console.warn(err);
        } else {
          console.error(err);
        }
      }
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  }, []);

  return {
    data,
    error,
    loading,
    sendGetRequest, // Call this with your endpoint
  };
}
