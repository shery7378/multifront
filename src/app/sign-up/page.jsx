"use client";

import React, { useState, useEffect } from "react";
import BackButton from "@/components/UI/BackButton";
import EnterEmail from "@/components/signUp/EnterEmail";
import MobileNumber from "@/components/signUp/MobileNumber";
import NameScreen from "@/components/signUp/NameScreen";
import TermsAcceptance from "@/components/signUp/TermsAcceptance";
import VerifyCode from "@/components/signUp/VerifyCode";
import { useSignUp } from "@/controller/SignUpController";
import { useEmailVerification } from "@/controller/useEmailVerification"; // Import new hook
import { useRouter, useSearchParams } from "next/navigation";
import PasswordScreen from "@/components/signUp/PasswordScreen";
import ReferralCodeInput from "@/components/Referral/ReferralCodeInput";
 
import ResponsiveText from "@/components/UI/ResponsiveText";
import Button from "@/components/UI/Button";


const providerLogoPath = 'https://authjs.dev/img/providers';

// Main Sign-up Page Component
export default function SignUpPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const { formData, response, error, setFormData, handleSignUp } = useSignUp();
  const { verificationResponse, verificationError, sendVerificationCode, verifyCode } = useEmailVerification();
  const [errors, setErrors] = useState({});
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for referral code in URL
  useEffect(() => {
    const refCode = searchParams?.get('ref');
    if (refCode) {
      setFormData({ ...formData, referralCode: refCode.toUpperCase() });
    }
  }, [searchParams]);

  // Handle navigation to the next step
  const handleNext = async () => {
    const stepError = validateStep(currentStep);
    console.log("Validating step", currentStep, "with mobileNumber:", formData.mobileNumber, "Error:", stepError); // Debug log
    if (stepError) {
      setErrors({ [currentStep]: stepError });
    } else {
      if (currentStep === 0) {
        // Send verification code on email step
        const success = await sendVerificationCode(formData.email);
        if (success) {
          setCurrentStep(currentStep + 1);
          setErrors({});
        } else {
          setErrors({ [currentStep]: verificationError });
        }
      } else if (currentStep === 1) {
        // Verify code on verify step
        const success = await verifyCode(formData.email, formData.code);
        if (success) {
          setCurrentStep(currentStep + 1);
          setErrors({});
        } else {
          // Set error with the verification error message
          const errorMsg = verificationError || "Invalid or expired verification code.";
          console.log("Setting verification error:", errorMsg);
          setErrors({ [currentStep]: errorMsg });
        }
      } else if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        setErrors({}); // Clear errors on successful next
      } else if (currentStep === steps.length - 1) {
        handleSubmit();
      }
    }
  };

  // Handle navigation to the previous step
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setErrors({}); // Clear errors on back
    }
  };

  // Handle skip for applicable steps
  const handleSkip = () => {
    if (currentStep === 2) {
      setFormData({ ...formData, mobileNumber: "" });
      setCurrentStep(currentStep + 1);
      setErrors({});
    }
  };

  // Validation functions for each step
  const validateStep = (stepIndex) => {
    switch (stepIndex) {
      case 0: // Enter Email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          return "Please enter a valid email address.";
        }
        return "";
      case 1: // Verify Code
        if (!formData.code.every((digit) => digit.length === 1)) {
          return "Please enter all 4 digits of the code.";
        }
        return "";
      case 2: // Mobile Number
        // Mobile number is optional, but if provided, it should be valid
        if (formData.mobileNumber && formData.mobileNumber.trim()) {
          const mobile = formData.mobileNumber.trim();
          // Check if it starts with + and has at least 7 digits after the country code
          // This allows for various country codes (1-4 digits) followed by phone number (7-15 digits)
          if (!/^\+\d{1,4}\d{7,15}$/.test(mobile)) {
            return "Please enter a valid mobile number with country code (e.g., +923001234567, +447459140362).";
          }
        }
        return "";
      case 3: // Name Screen
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
          return "Both first name and last name are required.";
        }
        return "";
      case 4: // Password Screen
        if (!formData.password.trim() || !formData.confirmPassword.trim()) {
          return "Both password and confirm password are required.";
        } else if (formData.password !== formData.confirmPassword) {
          return "Passwords do not match.";
        }
        return "";
      case 5: // Terms Acceptance
        if (!formData.agreedToTerms) {
          return "You must agree to the terms and privacy notice.";
        }
        return "";
      default:
        return "";
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    const stepError = validateStep(currentStep);
    if (stepError) {
      setErrors({ [currentStep]: stepError });
    } else {
      await handleSignUp();
    }
  };

  const steps = [
    {
      id: "enter-email",
      component: (
        <EnterEmail
          email={formData.email}
          onNext={handleNext}
          onEmailChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors[0]}
        />
      ),
    },
    {
      id: "verify-code",
      component: (
        <VerifyCode
          code={formData.code}
          onNext={handleNext}
          onBack={handleBack}
          onCodeChange={(newCode) => setFormData({ ...formData, code: newCode })}
          error={errors[1]}
          sendVerificationCode={sendVerificationCode} // Pass the function
          email={formData.email} // Pass the email
        />
      ),
    },
    {
      id: "mobile-number",
      component: (
        <MobileNumber
          mobileNumber={formData.mobileNumber}
          onNext={handleNext}
          onBack={handleBack}
          onMobileChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
          onSkip={handleSkip}
          error={errors[2]}
        />
      ),
    },
    {
      id: "name-screen",
      component: (
        <NameScreen
          firstName={formData.firstName}
          lastName={formData.lastName}
          onNext={handleNext}
          onBack={handleBack}
          onFirstNameChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          onLastNameChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          error={errors[3]}
        />
      ),
    },
    {
      id: "password-screen",
      component: (
        <PasswordScreen
          password={formData.password || ""}
          confirmPassword={formData.confirmPassword || ""}
          onNext={handleNext}
          onBack={handleBack}
          onPasswordChange={(e) => setFormData({ ...formData, password: e.target.value })}
          onConfirmPasswordChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          error={errors[4]}
        />
      ),
    },
    {
      id: "terms-acceptance",
      component: (
        <div>
          <TermsAcceptance
            agreedToTerms={formData.agreedToTerms}
            onNext={handleNext}
            onBack={handleBack}
            onTermsChange={(value) => setFormData({ ...formData, agreedToTerms: value })}
            error={errors[5]}
          />
          <div className="mt-4">
            <ReferralCodeInput
              value={formData.referralCode || ''}
              onChange={(code) => setFormData({ ...formData, referralCode: code })}
              error={errors.referralCode}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-[420px]">
        <div className="mx-auto p-6 md:p-8 bg-white rounded-2xl border border-gray-200">
          <div className="text-center relative">
            {/* Header with back button and logo */}
            <div className="flex items-center justify-center mb-5 relative">
              {currentStep !== 0 && (
                <button
                  onClick={handleBack}
                  className="absolute left-0 flex items-center justify-center w-10 h-10 rounded-lg bg-bright-gray hover:bg-gray-200"
                  aria-label="Back"
                >
                  <svg
                    className="w-5 h-5 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )}
              <ResponsiveText
                as="h1"
                minSize="18px"
                maxSize="18px"
                className="font-bold font-[bricle] text-vivid-red"
              >
                MultiKonnect
              </ResponsiveText>
            </div>
            {currentStep !== 1 && (
              <>
                {currentStep === 2 ? (
                  <>
                    <ResponsiveText as="h2" minSize="21px" maxSize="21px" className="font-bold leading-[1.25] tracking-tight text-left">
                      Enter your Mobile Number (optional)
                    </ResponsiveText>
                    <ResponsiveText as="p" minSize="0.75rem" maxSize="0.875rem" className="mt-2 text-left text-gray-500">
                      Add your Mobile to aid in account recovery
                    </ResponsiveText>
                  </>
                ) : currentStep === 3 ? (
                  <>
                    <ResponsiveText as="h2" minSize="21px" maxSize="21px" className="font-bold leading-[1.25] tracking-tight text-left">
                      What’s your Name?
                    </ResponsiveText>
                    <ResponsiveText as="p" minSize="0.75rem" maxSize="0.875rem" className="mt-2 text-left text-gray-500">
                      Let us know how we properly address you
                    </ResponsiveText>
                  </>
                ) : currentStep === 4 ? (
                  <>
                    <ResponsiveText as="h2" minSize="21px" maxSize="21px" className="font-bold leading-[1.25] tracking-tight text-left">
                      Create your Password
                    </ResponsiveText>
                    <ResponsiveText as="p" minSize="0.75rem" maxSize="0.875rem" className="mt-2 text-left text-gray-500">
                      Choose a strong password to secure your account
                    </ResponsiveText>
                  </>
                ) : currentStep === 5 ? (
                  <>
                    <ResponsiveText as="h2" minSize="21px" maxSize="21px" className="font-bold leading-[1.25] tracking-tight text-left">
                      Accept Multikonnect Terms & Review Privacy Notice
                    </ResponsiveText>
                    <ResponsiveText as="p" minSize="0.75rem" maxSize="0.875rem" className="mt-2 text-left text-gray-500">
                      Please review and agree to continue
                    </ResponsiveText>
                  </>
                ) : (
                  <>
                    <ResponsiveText as="h2" minSize="21px" maxSize="21px" className="font-bold leading-[1.25] tracking-tight text-left">
                      What your Phone Number or Email?
                    </ResponsiveText>
                    <ResponsiveText as="p" minSize="0.75rem" maxSize="0.875rem" className="mt-2 text-left text-gray-500">
                      Get food, drinks, groceries, and more delivered.
                    </ResponsiveText>
                  </>
                )}
              </>
            )}

            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`${currentStep === index ? "opacity-100" : "opacity-0 absolute hidden"}`}
              >
                {React.cloneElement(step.component, {
                  onNext: handleNext,
                  onBack: handleBack,
                })}
              </div>
            ))}

            {currentStep === 0 && (
              <>
                <div className="w-full mt-4">
                  <div className="flex items-center mb-4">
                    <div className="flex-auto border-t border-gray-200" />
                    <span className="mx-2 text-sm text-gray-500">Or continue with</span>
                    <div className="flex-auto border-t border-gray-200" />
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      fullWidth
                      variant="outline"
                      className="rounded-full h-[46px] px-6 text-[0.95rem] !justify-start !font-medium hover:bg-gray-50 hover:border-gray-300"
                      iconLeft={
                        <div className="flex items-center justify-center w-5 h-5">
                          <img className="w-5 h-5" src={`${providerLogoPath}/google.svg`} alt="Google" />
                        </div>
                      }
                    >
                      Continue with Google
                    </Button>

                    <Button
                      fullWidth
                      variant="outline"
                      className="rounded-full h-[46px] px-6 text-[0.95rem] !justify-start !font-medium hover:bg-gray-50 hover:border-gray-300"
                      iconLeft={
                        <div className="flex items-center justify-center w-5 h-5">
                          <img className="w-5 h-5" src={`${providerLogoPath}/apple.svg`} alt="Apple" />
                        </div>
                      }
                    >
                      Continue with Apple
                    </Button>

                    <Button
                      fullWidth
                      variant="outline"
                      className="rounded-full h-[46px] px-6 text-[0.95rem] !justify-start !font-medium hover:bg-gray-50 hover:border-gray-300"
                      iconLeft={
                        <div className="flex items-center justify-center w-5 h-5">
                          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                            <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"></path>
                          </svg>
                        </div>
                      }
                    >
                      Login with QR Code
                    </Button>
                  </div>
                </div>
              </>
            )}

            {currentStep === 0 && (
              <div className="mt-4 text-left">
                <p className="text-xs text-gray-500 leading-relaxed">
                  By proceeding, you consent to get calls, WhatsApp or SMS/ RCS messages, including by automated means, from Uber and its affiliates to the number provided.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}