// src/app/forgot-password/page.jsx
"use client";

import { useState } from "react";
import ForgotPasswordForm from "@/components/forms/ForgotPasswordForm";
import { usePostRequest } from "@/controller/postRequests";

export default function ForgotPasswordPage() {
  const { data, error, loading, sendPostRequest } = usePostRequest();
  const [email, setEmail] = useState("");

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      await sendPostRequest("/forgot-password", { email, flag: true }, false);
      // success is reflected in `data`
    } catch (err) {
      console.log("Password reset failed:", err.message);
    }
  };

  return (
    <ForgotPasswordForm
      email={email}
      onEmailChange={(e) => setEmail(e.target.value)}
      onSubmit={handleForgotPassword}
      loading={loading}
      error={error}
      successMessage={
        data && !error
          ? `Password reset email has been sent to ${email}. Please check your inbox.`
          : ""
      }
    />
  );
}
