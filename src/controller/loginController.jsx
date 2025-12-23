// src/controller/loginController.jsx
"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import {
    loginStart,
    loginSuccess,
    loginFailure,
} from "@/store/slices/authSlice";

export function useLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams(); // For reading ?redirect=...
    const dispatch = useDispatch();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        dispatch(loginStart());

        try {
            // Basic client-side validation to avoid 422 from empty fields
            if (!email || !password) {
                throw new Error("Email and password are required.");
            }
            // Get CSRF token for Laravel Sanctum
            await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/sanctum/csrf-cookie`, {
                withCredentials: true,
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            // Call login API
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/login`,
                { email, password },
                {
                    withCredentials: true,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    }
                }
            );

            // Check if 2FA is required
            if (res.data.requires_2fa && res.data.temp_token) {
                // Return 2FA requirement info instead of completing login
                return {
                    requires2FA: true,
                    tempToken: res.data.temp_token,
                    user: res.data.user,
                };
            }

            const { token, user } = res.data;
            if (!token || !user) {
                throw new Error("Invalid login response: missing token or user");
            }

            // Save to LocalStorage
            localStorage.setItem("auth_token", token);
            localStorage.setItem("auth_user", JSON.stringify(user));

            // Save to cookie for Middleware
            const isLocal =
                window.location.hostname === "localhost" ||
                window.location.hostname.endsWith(".test");

            // Set expiration 7 days from now
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 7);

            document.cookie = `auth_token=${token}; path=/; samesite=lax${isLocal ? "" : "; secure"
                }; expires=${expiryDate.toUTCString()}`;

            // Update Redux
            dispatch(loginSuccess({ token, user }));

            // ✅ Redirect to original page if ?redirect= exists, otherwise home
            const redirectPath = searchParams.get("redirect") || "/home";
            router.replace(redirectPath);
            
            return { success: true, token, user };
        } catch (err) {
            const status = err?.response?.status;
            let msg = err?.response?.data?.message || err?.message || "Login failed. Please check your credentials.";
            if (status === 422) {
                // Laravel validation error
                const errors = err?.response?.data?.errors;
                if (errors && typeof errors === 'object') {
                    // Prefer first error string
                    const first = Object.values(errors).find(v => Array.isArray(v) && v.length > 0);
                    if (first) msg = first[0];
                } else {
                    // Fallback generic for invalid credentials
                    msg = 'Invalid email or password.';
                }
            }
            console.warn("Login failed:", status, err?.response?.data || err);
            setError(msg);
            dispatch(loginFailure(msg));
        }
    };

    return {
        email,
        password,
        error,
        setEmail,
        setPassword,
        handleLogin,
    };
}
