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
            const message = err.response?.data?.message || 'Failed to send data. Please try again.';
            setError(message);
            console.error(err);
            throw new Error(message); // optional: re-throw for try/catch outside
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
