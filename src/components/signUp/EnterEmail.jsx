//src/components/signUp/EnterEmail.jsx
"use client";
import { useState, useEffect } from "react";
import ResponsiveText from "../UI/ResponsiveText";
import Button from "../UI/Button";
import Link from "next/link";

export default function EnterEmail({ email, userType, onNext, onEmailChange, onUserTypeChange, error }) {
    const [localEmail, setLocalEmail] = useState(email || "");
    const [isValid, setIsValid] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Basic email regex validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setIsValid(emailRegex.test(localEmail));
    }, [localEmail]);

    const handleNext = async () => {
        if (!isValid || loading) return;
        try {
            setLoading(true);
            await onNext(); // supports async functions
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="text-start">
                <label
                    htmlFor="email"
                    className="mb-[9px] inline-block text-base font-normal text-[#000000]"
                >
                    Enter phone (e.g. 7700 900123) or Email
                </label>
                <input
                    type="text"
                    autoComplete="off"
                    id="email"
                    placeholder="Your email"
                    value={localEmail}
                    onChange={(e) => {
                        setLocalEmail(e.target.value);
                        onEmailChange(e);
                    }}
                    className="email-input w-full px-4 py-4.5 bg-[#F4F4F4] border-0 text-[#00000080] text-base font-normal placeholder:text-[#00000080] rounded-[6px] shadow-none focus:outline-none focus:ring-0  focus:border-0"
                />
                {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
            </div>
            <div className="my-3" />
            <Button
                onClick={handleNext}
                fullWidth
                variant="primary"
                disabled={!isValid || loading} // disable while loading
                className={`flex-1 lg:h-[60px] h-[46px] !rounded-[6px] ${!isValid || loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
            >
                {loading ? "Sending..." : "Continue"}
            </Button>
        </>
    );
}