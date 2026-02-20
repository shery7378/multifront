// src/components/signUp/TermsAcceptance.jsx
"use client";
import { useState } from "react";
import ResponsiveText from "../UI/ResponsiveText";
import Button from "../UI/Button";
import CustomCheckbox from "../UI/CustomCheckbox";

export default function TermsAcceptance({ agreedToTerms, onNext, onBack, onTermsChange, error }) {
  const [localAgreed, setLocalAgreed] = useState(agreedToTerms || false);
  const loading = false; // Assuming no loading state is passed; adjust if needed

  return (
    <>
      <div className="text-start my-4">
        <div className="flex items-start gap-3">
          <CustomCheckbox
            id="agree"
            checked={localAgreed}
            onChange={(value) => {
              setLocalAgreed(value);
              onTermsChange(value);
            }}
            className="mt-1"
            checkIcon={<span className="text-white text-xs font-bold">✓</span>}
          />
          <label htmlFor="agree" className="text-base font-normal text-[#00000080]">
            By selecting "I Agree" below, I have reviewed and agree to the{" "}
            <span className="text-[#F34322] hover:underline font-medium">Terms of Use</span> and acknowledge the{" "}
            <span className="text-[#F34322] hover:underline font-medium">Privacy Notice</span>. I am at least 18 years of age.
          </label>
        </div>
        {error && <p className="text-red-500 text-xs mb-2 mt-2">{error}</p>}
      </div>
      <div className="mt-6">
        <Button
          onClick={onNext}
          variant="primary"
          fullWidth
          disabled={!localAgreed || loading}
          className={`!rounded-[6px] lg:h-[60px] h-[46px] ${!localAgreed || loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading ? "Loading..." : "Next"}
        </Button>
      </div>
    </>
  );
}