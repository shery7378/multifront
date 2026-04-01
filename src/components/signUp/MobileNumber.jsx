// src/components/signUp/MobileNumber.jsx
"use client";
import { useState, useEffect } from "react";
import Button from "../UI/Button";

const UK_COUNTRY_CODE = "+44";

export default function MobileNumber({ mobileNumber, onNext, onBack, onMobileChange, onSkip, error }) {
    const [localMobile, setLocalMobile] = useState(mobileNumber || "");
    const loading = false;

    // Set default UK phone code on component mount
    useEffect(() => {
        localStorage.setItem('phoneCode', UK_COUNTRY_CODE);
    }, []);

    const handleMobileChange = (e) => {
        const value = e.target.value;
        // Allow digits, spaces, and dashes only (no + sign needed, code is shown separately)
        const cleaned = value.replace(/[^\d\s\-]/g, "");
        setLocalMobile(cleaned);
        if (onMobileChange) {
            // Prepend +44 to the value so the full number is stored
            const fullNumber = UK_COUNTRY_CODE + cleaned.replace(/[\s\-]/g, "");
            onMobileChange({ ...e, target: { ...e.target, value: fullNumber } });
        }
    };

    return (
        <>
            <div className="text-left mt-4">
                <label className="mb-[9px] inline-block text-base font-normal text-[#000000]">Mobile Number</label>
                <div className="flex items-center gap-3 relative">
                    {/* Fixed UK Country Code */}
                    <div className="flex items-center justify-center px-4 py-4.5 bg-[#F4F4F4] text-[#000000] text-base font-medium rounded-[6px] select-none whitespace-nowrap">
                        {UK_COUNTRY_CODE}
                    </div>

                    {/* Phone Number Input */}
                    <input
                        type="tel"
                        placeholder="7700 900123"
                        value={localMobile}
                        onChange={handleMobileChange}
                        className="email-input w-full px-4 py-4.5 bg-[#F4F4F4] border-0 text-[#00000080] text-base font-normal placeholder:text-[#00000080] rounded-[6px] shadow-none focus:outline-none focus:ring-0 focus:border-0"
                    />
                </div>
                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                <p className="text-[#00000080] text-xs mt-2">
                    Enter your UK mobile number without the country code
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
                <Button fullWidth variant="secondary" onClick={onSkip} className="!rounded-[6px] lg:h-[60px] h-[46px]">Skip</Button>
                <Button fullWidth variant="primary" onClick={onNext} disabled={loading} className="!rounded-[6px] lg:h-[60px] h-[46px]">
                    {loading ? "Loading" : "Next"}
                </Button>
            </div>
        </>
    );
}