// src/components/signUp/PasswordScreen.jsx
"use client";
import { useState } from "react";
import ResponsiveText from "../UI/ResponsiveText";
import Button from "../UI/Button";
import Input from "../UI/Input";

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

    const evaluate = (pw) => {
        const length = pw.length;
        let score = 0;
        const suggestions = [];
        if (length >= 12) score += 2;
        else if (length >= 8) score += 1;
        if (/[a-z]/.test(pw)) score += 1; else suggestions.push('Add lowercase letters');
        if (/[A-Z]/.test(pw)) score += 1; else suggestions.push('Add uppercase letters');
        if (/[0-9]/.test(pw)) score += 1; else suggestions.push('Add numbers');
        if (/[^a-zA-Z0-9]/.test(pw)) score += 1; else suggestions.push('Add symbols');
        if (length < 6) { score = Math.max(0, score - 1); suggestions.push('Make it longer (8+ chars)'); }
        let level = 'weak';
        if (score <= 2) level = 'weak'; else if (score <= 4) level = 'medium'; else level = 'strong';
        return { length, score, level, suggestions };
    };

    // Validate if passwords match and meet length requirement
    const isValid = localPassword === localConfirmPassword && localPassword.length >= 6;
    const loading = false; // Assuming no loading state is passed; adjust if needed

    return (
        <>

            <div className="text-start">
                <Input
                    label="Password"
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={localPassword}
                    onChange={(e) => {
                        setLocalPassword(e.target.value);
                        onPasswordChange(e);
                    }}
                    error={error && error.toLowerCase().includes('password') && !error.toLowerCase().includes('confirm') ? error : ''}
                    inputClassName="h-14"
                />
                {/* Strength indicator */}
                {localPassword.length > 0 && (
                    (() => {
                        const s = evaluate(localPassword);
                        const pct = Math.min(100, (s.score / 6) * 100);
                        const color = s.level === 'weak' ? '#ef4444' : s.level === 'medium' ? '#f59e0b' : '#10b981';
                        return (
                            <div className="mt-2">
                                <div className="w-full bg-[#F3F4F6] rounded-full h-2 overflow-hidden">
                                    <div style={{ width: pct + '%', background: color, height: '100%', transition: 'width 150ms ease' }} />
                                </div>
                                <div className="mt-1 text-sm font-semibold" style={{ color }}>{s.level.charAt(0).toUpperCase() + s.level.slice(1)}</div>
                                <div className="mt-1 text-xs text-gray-600">{s.suggestions.slice(0, 3).map((sg, i) => (<div key={i}>• {sg}</div>))}</div>
                            </div>
                        )
                    })()
                )}
                <Input
                    label="Confirm Password"
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm password"
                    value={localConfirmPassword}
                    onChange={(e) => {
                        setLocalConfirmPassword(e.target.value);
                        onConfirmPasswordChange(e);
                    }}
                    className="mt-4"
                    error={(error && error.toLowerCase().includes('confirm')) || (localPassword && localConfirmPassword && localPassword !== localConfirmPassword) ? (error && error.toLowerCase().includes('confirm') ? error : "Passwords do not match.") : ''}
                    inputClassName="h-14"
                />
                {error && !error.toLowerCase().includes('password') && !error.toLowerCase().includes('confirm') && (
                    <p className="text-red-500 text-xs mb-2 mt-2">{error}</p>
                )}
                {localPassword.length > 0 && localPassword.length < 6 && (
                    <p className="text-red-500 text-xs mb-2 mt-2">Password must be at least 6 characters.</p>
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