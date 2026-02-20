// src/components/forms/ForgotPasswordForm.jsx
"use client";

import React from "react";
import Button from "@/components/UI/Button";
import Link from "next/link";
import ResponsiveText from "../UI/ResponsiveText";

export default function ForgotPasswordForm({ email, onEmailChange, onSubmit, loading, error, successMessage, }) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="md:py-[30px] md:px-8 px-5 py-4 bg-white rounded-[13px] border border-[#D8DADC] w-full max-w-[512px]">
                <ResponsiveText as="h2" minSize="21px" maxSize="28px" className="font-medium leading-[1.25] tracking-tight text-center text-[#092E3B] mb-2.5">
                    Forgot Password
                </ResponsiveText>
                <ResponsiveText as="p" minSize="14px" maxSize="16px" className=" text-center text-[#00000080] my-2.5">                        Fill the email to reset your password</ResponsiveText>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email"
                            className="mb-[9px] inline-block text-base font-normal text-[#000000]"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={onEmailChange}
                            className="email-input w-full px-4 py-4.5 bg-[#F4F4F4] border-0 text-[#00000080] text-base font-normal placeholder:text-[#00000080] rounded-[6px] shadow-none focus:outline-none focus:ring-0  focus:border-0"
                            placeholder="vendor@multikonnect.test"
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        fullWidth
                        variant="primary"
                        className="rounded-[6px] lg:h-[60px] h-[46px] !rounded-[6px]"
                        disabled={loading}
                    >
                        {loading ? "Sending..." : "Send Reset Link"}
                    </Button>
                </form>

                {/* ✅ Success message */}
                {successMessage && (
                    <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
                        {successMessage}
                    </div>
                )}

                {/* ❌ Error message */}
                {error && (
                    <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>
                )}

                <div className="mt-4 text-center">
                    <ResponsiveText as="p" minSize="14px" maxSize="14px" className="mt-2 text-center text-[#000000B2]">
                        Back to <Link href="/login" className="text-vivid-red !font-semibold">Log in</Link>
                    </ResponsiveText>

                </div>
            </div>
        </div>
    );
}
