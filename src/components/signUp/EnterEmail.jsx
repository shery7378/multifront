//src/components/signUp/EnterEmail.jsx
"use client";
import { useState, useEffect } from "react";
import ResponsiveText from "../UI/ResponsiveText";
import Button from "../UI/Button";
import Link from "next/link";

export default function EnterEmail({ email, onNext, onEmailChange, error }) {
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
                    className="mb-2 inline-block text-sm font-medium text-gray-700"
                >
                    Enter phone or Email
                </label>
                <input
                    type="text"
                    id="email"
                    placeholder="Your email"
                    value={localEmail}
                    onChange={(e) => {
                        setLocalEmail(e.target.value);
                        onEmailChange(e);
                    }}
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-vivid-red focus:border-vivid-red"
                />
                {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
            </div>
            <div className="my-3" />
            <Button
                onClick={handleNext}
                fullWidth
                variant="primary"
                disabled={!isValid || loading} // disable while loading
                className={`flex-1 h-[46px] rounded-md ${!isValid || loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
            >
                {loading ? "Sending..." : "Continue"}
            </Button>
        </>
    );
}