'use client';
// src/controller/deleteRequests.jsx
import { useState } from 'react';
import axios from 'axios';

export function useDeleteRequest() {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const sendDeleteRequest = async (endpoint, withAuth = false) => {
        setLoading(true);
        setError('');
        setData(null);

        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(withAuth && {
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                }),
            };

            const res = await axios.delete(
                `${process.env.NEXT_PUBLIC_API_URL}/api${endpoint}`,
                {
                    withCredentials: true,
                    headers,
                }
            );

            setData(res.data);
            return res.data;
        } catch (err) {
            // Extract detailed error message
            let message = 'Failed to delete data. Please try again.';
            
            if (err.response?.data) {
                // Check for validation errors
                if (err.response.data.errors) {
                    const firstError = Object.values(err.response.data.errors)[0];
                    message = Array.isArray(firstError) ? firstError[0] : firstError;
                } else if (err.response.data.message) {
                    message = err.response.data.message;
                } else if (err.response.data.error) {
                    message = err.response.data.error;
                }
            } else if (err.message) {
                message = err.message;
            }
            
            setError(message);
            console.error('DELETE Request Error:', {
                status: err.response?.status,
                data: err.response?.data,
                message: err.message,
            });
            
            // Preserve the original error structure so components can access err.response
            const error = new Error(message);
            error.response = err.response;
            error.status = err.response?.status;
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        data,
        error,
        loading,
        sendDeleteRequest,
    };
}

