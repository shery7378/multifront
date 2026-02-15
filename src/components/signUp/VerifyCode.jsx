"use client";

//src/components/signUp/VerifyCode.jsx

import { useState, useEffect } from "react";
import ResponsiveText from "../UI/ResponsiveText";
import Button from "../UI/Button";

export default function VerifyCode({
  code,
  onNext,
  onBack,
  onCodeChange,
  error,
  sendVerificationCode, // New prop to handle resending
  email, // New prop to pass the email
}) {
  const [localCode, setLocalCode] = useState(code || ["", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(60); // 1 minute in seconds
  const [isResendDisabled, setIsResendDisabled] = useState(true);

  useEffect(() => {
    if (timeLeft === 0) {
      setIsResendDisabled(false);
      return; // stop here if timer is 0
    }

    setIsResendDisabled(true);
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]); // restart effect whenever timeLeft changes

  const handleResend = async () => {
    if (!isResendDisabled && sendVerificationCode) {
      const success = await sendVerificationCode(email);
      if (success) {
        setTimeLeft(60); // reset timer on resend
      }
    }
  };

  // const handleResend = async () => {
  //     if (!isResendDisabled && sendVerificationCode) {
  //       const success = await sendVerificationCode(email); // Call the prop function with email
  //       if (success) {
  //         setTimeLeft(60); // Reset timer to 1 minute
  //         setIsResendDisabled(true); // Disable button again
  //       } // Error handling is managed by the parent via verificationError
  //     }
  //   };


  const handleChange = (index, value) => {
    // Only allow numeric input
    const numericValue = value.replace(/\D/g, '').slice(0, 1);
    const newCode = [...localCode];
    newCode[index] = numericValue;
    setLocalCode(newCode);
    onCodeChange(newCode);
    if (numericValue && index < 3) document.getElementById(`code-input-${index + 1}`).focus();
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  // Check if all code digits are entered
  const isCodeComplete = localCode.every((digit) => digit.length === 1);

  return (
    <>
      <ResponsiveText as="h2" minSize="21px" maxSize="21px" className="text-oxford-blue mt-5 inline-block font-semibold text-left">
        Enter the 4 Digit code Sent to you
      </ResponsiveText>
      <p className="text-black/50 mb-4 text-start text-sm">{email}</p> {/* Display dynamic email */}
      <div className="flex justify-start gap-8 mb-4">
        {localCode.map((digit, index) => (
          <input
            key={index}
            id={`code-input-${index}`}
            type="text"
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            className="w-14 h-14 text-center rounded-md focus:outline-none focus:ring-2 focus:ring-vivid-red border border-gray-200 bg-gray-100"
            maxLength="1"
            autoFocus={index === 0}
          />
        ))}
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-md">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}
      <p className="text-black/50 mb-4 text-start text-xs">
        <span className="text-black ">Tip</span>: Make Sure to check your inbox and spam folder
      </p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Button
          variant="outline"
          className="h-14 rounded-md !bg-bright-gray text-oxford-blue"
          onClick={handleResend}
          disabled={isResendDisabled}
        >
          Resend
        </Button>
        <Button
          variant="primary"
          className="h-14 rounded-md"
          onClick={onNext}
          disabled={!isCodeComplete} // Disable until code is complete
        >
          Next
        </Button>
      </div>
    </>
  );
}