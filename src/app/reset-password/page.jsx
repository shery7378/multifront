// src/app/reset-password/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ResetPasswordForm from "@/components/forms/ResetPasswordForm";
import { usePutRequest } from "@/controller/putRequests";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const { data, error, loading, sendPutRequest } = usePutRequest();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await sendPutRequest(
        "/reset-password",
        { email, token, new_password: password, new_password_confirmation: confirmPassword },
        false
      );
    } catch (err) {
      console.log("Password reset failed:", err.message);
    }
  };

  // ✅ Clear fields on success
  useEffect(() => {
    if (data && !error) {
      setPassword("");
      setConfirmPassword("");
    }
  }, [data, error]);

  return (
    <ResetPasswordForm
      password={password}
      confirmPassword={confirmPassword}
      onPasswordChange={(e) => setPassword(e.target.value)}
      onConfirmPasswordChange={(e) => setConfirmPassword(e.target.value)}
      onSubmit={handleResetPassword}
      loading={loading}
      error={error}
      successMessage={data && !error ? "Your password has been reset successfully!" : ""}
    />
  );
}
