// src/components/signUp/PasswordScreen.jsx
"use client";
import { useState } from "react";
import ResponsiveText from "../UI/ResponsiveText";
import Button from "../UI/Button";

export default function PasswordScreen({
    password,
    confirmPassword,
    onNext,
    onBack,
    onPasswordChange,
    onConfirmPasswordChange,
    error,
}) {
    const [localPassword, setLocalPassword] = useState(password || "");
    const [localConfirmPassword, setLocalConfirmPassword] = useState(confirmPassword || "");

    // Validate if passwords match and meet length requirement
    const isValid = localPassword === localConfirmPassword && localPassword.length >= 6;
    const loading = false; // Assuming no loading state is passed; adjust if needed

    return (
        <>

            <div className="text-start">
                <label htmlFor="password" className="mb-[9px] inline-block text-base font-normal text-[#000000]">
                    Password
                </label>
                <input
                    type="password"
                    id="password"
                    placeholder="Enter password"
                    value={localPassword}
                    onChange={(e) => {
                        setLocalPassword(e.target.value);
                        onPasswordChange(e);
                    }}
                    className="email-input w-full px-4 py-4.5 bg-[#F4F4F4] border-0 text-[#00000080] text-base font-normal placeholder:text-[#00000080] rounded-[6px] shadow-none focus:outline-none focus:ring-0  focus:border-0"
                    minLength="6"
                />
                <label htmlFor="confirmPassword" className="mb-[9px] inline-block text-base font-normal text-[#000000] mt-4">
                    Confirm Password
                </label>
                <input
                    type="password"
                    id="confirmPassword"
                    placeholder="Confirm password"
                    value={localConfirmPassword}
                    onChange={(e) => {
                        setLocalConfirmPassword(e.target.value);
                        onConfirmPasswordChange(e);
                    }}
                    className="email-input w-full px-4 py-4.5 bg-[#F4F4F4] border-0 text-[#00000080] text-base font-normal placeholder:text-[#00000080] rounded-[6px] shadow-none focus:outline-none focus:ring-0  focus:border-0"
                    minLength="6"
                />
                {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
                {localPassword && localConfirmPassword && localPassword !== localConfirmPassword && (
                    <p className="text-red-500 text-xs mb-2">Passwords do not match.</p>
                )}
                {localPassword.length > 0 && localPassword.length < 6 && (
                    <p className="text-red-500 text-xs mb-2">Password must be at least 6 characters.</p>
                )}
            </div>
            <div className="grid gap-2 mt-4">
                <Button
                    variant="outline"
                    className="flex-1 text-vivid-red !rounded-[6px] lg:h-[60px] h-[46px] border border-vivid-red"
                    onClick={onBack}
                >
                    Back
                </Button>
                <Button
                    onClick={onNext}
                    variant="primary"
                    disabled={!isValid || loading}
                    className={`flex-1 !rounded-[6px] lg:h-[60px] h-[46px] ${!isValid || loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    {loading ? "Sending..." : "Continue"}
                </Button>
            </div>
        </>
    );
}