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
                <label htmlFor="password" className="mb-2 inline-block text-sm font-medium text-gray-700">
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-vivid-red focus:border-vivid-red"
                    minLength="6"
                />
                <label htmlFor="confirmPassword" className="mb-2 inline-block text-sm font-medium text-gray-700 mt-4">
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-vivid-red focus:border-vivid-red"
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
                    className="flex-1 text-vivid-red py-2 rounded-md border border-vivid-red"
                    onClick={onBack}
                >
                    Back
                </Button>
                <Button
                    onClick={onNext}
                    variant="primary"
                    disabled={!isValid || loading}
                    className={`flex-1 py-2 rounded-md ${!isValid || loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    {loading ? "Sending..." : "Continue"}
                </Button>
            </div>
        </>
    );
}