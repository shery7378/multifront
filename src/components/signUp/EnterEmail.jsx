//src/components/signUp/EnterEmail.jsx
"use client";
import { useState, useEffect } from "react";
import ResponsiveText from "../UI/ResponsiveText";
import Button from "../UI/Button";
import Input from "../UI/Input";
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
                <Input
                    label="Enter phone or Email"
                    id="email"
                    type="text"
                    autoComplete="off"
                    placeholder="Your email"
                    value={localEmail}
                    onChange={(e) => {
                        setLocalEmail(e.target.value);
                        onEmailChange(e);
                    }}
                    error={error}
                    inputClassName="h-14"
                />
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