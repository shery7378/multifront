// src/controller/useEmailVerification.jsx
"use client";

import { useState } from "react";
import axios from "axios";

export function useEmailVerification() {
    const [verificationResponse, setVerificationResponse] = useState(null);
    const [verificationError, setVerificationError] = useState("");

    const sendVerificationCode = async (email) => {
        setVerificationError("");
        setVerificationResponse(null);

        try {
            // Fetch CSRF cookie
            await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/sanctum/csrf-cookie`, {
                withCredentials: true,
            });

            // Send request to get verification code
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/send-code`,
                { email },
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                }
            );

            setVerificationResponse(res.data);
            return true; // Indicate success
        } catch (err) {
            // Handle validation errors (422)
            if (err.response?.status === 422) {
                const errors = err.response?.data?.errors;
                if (errors) {
                    // Extract first validation error message
                    const firstError = Object.values(errors)[0];
                    const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
                    setVerificationError(errorMessage || "Validation failed. Please check your input.");
                } else {
                    setVerificationError(
                        err.response?.data?.message || "Validation failed. Please check your input."
                    );
                }
            } else {
                setVerificationError(
                    err.response?.data?.message || "Failed to send verification code."
                );
            }
            console.error("Verification error:", err.response?.data || err.message);
            return false; // Indicate failure
        }
    };

    const verifyCode = async (email, code) => {
        setVerificationError("");
        setVerificationResponse(null);

        try {
            // Fetch CSRF cookie
            await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/sanctum/csrf-cookie`, {
                withCredentials: true,
            });

            // Verify the code
            // Ensure code is a string and filter out any empty values
            // The backend stores code as integer (1000-9999), so we need to ensure it's a clean numeric string
            let codeString = "";
            if (Array.isArray(code)) {
                codeString = code.filter(c => c && String(c).trim()).join("").trim();
            } else {
                codeString = String(code || "").trim();
            }
            
            // Ensure it's exactly 4 digits
            if (codeString.length !== 4 || !/^\d{4}$/.test(codeString)) {
                setVerificationError("Please enter a valid 4-digit code.");
                return false;
            }
            
            console.log("Verifying code:", {
                email,
                codeArray: code,
                codeString,
                codeLength: codeString.length,
                isNumeric: /^\d{4}$/.test(codeString)
            });
            
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/verify-code`,
                { email, code: codeString },
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                }
            );

            setVerificationResponse(res.data);
            return true; // Indicate success
        } catch (err) {
            // Handle validation errors (422)
            if (err.response?.status === 422) {
                const errors = err.response?.data?.errors;
                if (errors) {
                    // Extract first validation error message
                    const firstError = Object.values(errors)[0];
                    const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
                    setVerificationError(errorMessage || "Validation failed. Please check your input.");
                } else {
                    setVerificationError(
                        err.response?.data?.message || "Validation failed. Please check your input."
                    );
                }
            } else if (err.response?.status === 400) {
                // Handle 400 Bad Request (invalid code, expired, etc.)
                const errorMessage = err.response?.data?.message || "Invalid or expired verification code.";
                setVerificationError(errorMessage);
            } else {
                // Handle other errors (500, network errors, etc.)
                setVerificationError(
                    err.response?.data?.message || "An error occurred. Please try again."
                );
            }
            console.error("Verification error:", {
                status: err.response?.status,
                data: err.response?.data,
                message: err.message,
            });
            return false; // Indicate failure
        }
    };

    return {
        verificationResponse,
        verificationError,
        sendVerificationCode,
        verifyCode,
    };
}