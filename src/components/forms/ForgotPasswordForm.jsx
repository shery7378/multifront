// src/components/forms/ForgotPasswordForm.jsx
"use client";

import React from "react";
import Button from "@/components/UI/Button";
import Link from "next/link";
import ResponsiveText from "../UI/ResponsiveText";

export default function ForgotPasswordForm({ email, onEmailChange, onSubmit, loading, error, successMessage, }) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl shadow-sm w-full max-w-md">
                <h1 className="text-2xl font-bold text-center">Forgot Password</h1>
                <ResponsiveText as="p" minSize="12px" maxSize="12px" className="text-xs mb-6 text-center text-gray-600">Fill the email to reset your password</ResponsiveText>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={onEmailChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="vendor@multikonnect.test"
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        fullWidth
                        variant="primary"
                        className="rounded-lg"
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
                    <p className="text-sm text-gray-500">
                        Back to
                        <Link href="/login" className="text-vivid-red hover:underline ms-1">
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
