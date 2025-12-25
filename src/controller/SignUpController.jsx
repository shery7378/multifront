// src/controller/SignUpController.jsx
"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { loginSuccess } from "@/store/slices/authSlice";

export function useSignUp() {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    email: "",
    code: ["", "", "", ""],
    mobileNumber: "",
    firstName: "",
    lastName: "",
    agreedToTerms: false,
    password: "", // ✅ password field add kiya
    referralCode: "", // Referral code from URL or input
  });
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignUp = async (e) => {
    e?.preventDefault();
    setError("");
    setResponse(null);

    try {
      // Step 1: Fetch CSRF cookie
      await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/sanctum/csrf-cookie`, {
        withCredentials: true,
      });

      // Step 2: Send registration request
      const payload = {
        name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email,
        password: formData.password || formData.code.join(""), // fallback if code used as password
        password_confirmation: formData.confirmPassword,
        role: "customer",
        ...(formData.mobileNumber ? { phone: formData.mobileNumber } : {}), // ✅ optional phone
        agreed_to_terms: formData.agreedToTerms,
        ...(formData.referralCode ? { referral_code: formData.referralCode.trim().toUpperCase() } : {}), // Referral code
      };

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/register`,
        payload,
        { withCredentials: true }
      );

      const { token, user } = res.data;
      if (!token || !user) {
        throw new Error("Invalid registration response: missing token or user");
      }

      // Step 3: Save to LocalStorage
      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_user", JSON.stringify(user));

      // ✅ Step 4: Save to Cookie for middleware
      const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname.endsWith(".test");

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);

      document.cookie = `auth_token=${token}; path=/; samesite=lax${isLocal ? "" : "; secure"
        }; expires=${expiryDate.toUTCString()}`;

      // Step 5: Update Redux
      dispatch(loginSuccess({ token, user }));
      
      // Dispatch event to trigger favorite reload in components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('userLoggedIn'));
      }

      setResponse(res.data);

      // Step 6: Redirect
      router.push("/home");
    } catch (err) {
      // Handle different error types
      let errorMessage = "Registration failed. Please try again.";
      
      if (err.response) {
        // Server responded with an error
        const contentType = err.response.headers?.['content-type'] || '';
        
        if (contentType.includes('application/json')) {
          // JSON error response
          errorMessage = err.response.data?.message || errorMessage;
        } else {
          // HTML or other non-JSON response
          console.error('Non-JSON error response received:', contentType);
          errorMessage = err.response.data?.message || 
                        err.response.statusText || 
                        "Registration failed. Please check your details and try again.";
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = "Network error. Please check your connection and try again.";
      } else {
        // Something else happened
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      console.error("SignUp failed:", err);
    }
  };

  return {
    formData,
    response,
    error,
    setFormData, // Allow updating form data
    handleSignUp,
  };
}
