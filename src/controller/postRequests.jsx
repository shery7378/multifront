'use client';
// src/controller/postRequests.jsx
import { useState } from 'react';
import axios from 'axios';

export function usePostRequest() {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const sendPostRequest = async (endpoint, payload = {}, withAuth = false) => {
        setLoading(true);
        setError('');
        setData(null);

        try {
            // Check if payload contains FormData (for file uploads)
            const isFormData = payload instanceof FormData;
            
            const headers = {
                // Don't set Content-Type for FormData, let browser set it with boundary
                ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
                ...(withAuth && {
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                }),
            };

            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api${endpoint}`,
                isFormData ? payload : payload,
                {
                    withCredentials: true,
                    headers,
                }
            );

            setData(res.data);
            return res.data; // <-- return response data here
        } catch (err) {
            let message = err.response?.data?.message || 'Failed to send data. Please try again.';
            
            // Handle Laravel validation errors (422)
            if (err.response?.status === 422 && err.response?.data?.errors) {
                const errors = err.response.data.errors;
                // Extract first error message from validation errors
                const firstError = Object.values(errors).find(v => Array.isArray(v) && v.length > 0);
                if (firstError) {
                    message = firstError[0];
                } else {
                    // Fallback: format all errors
                    const errorMessages = Object.entries(errors)
                        .map(([field, messages]) => {
                            const msg = Array.isArray(messages) ? messages.join(', ') : String(messages);
                            return `${field}: ${msg}`;
                        })
                        .join('; ');
                    message = errorMessages || message;
                }
            }
            
            setError(message);
            console.error('Post request error:', err.response?.data || err);
            // Throw error with full response data for better error handling
            const error = new Error(message);
            error.response = err.response;
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        data,
        error,
        loading,
        sendPostRequest, // Call with endpoint + payload
    };
}
