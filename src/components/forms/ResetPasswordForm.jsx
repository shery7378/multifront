// src/components/forms/ResetPasswordForm.jsx
"use client";

import React from "react";
import Button from "@/components/UI/Button";
import ResponsiveText from "../UI/ResponsiveText";
import Link from "next/link";

export default function ResetPasswordForm({
    password,
    confirmPassword,
    onPasswordChange,
    onConfirmPasswordChange,
    onSubmit,
    loading,
    error,
    successMessage,
}) {

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl shadow-sm w-full max-w-md">
                <h1 className="text-2xl font-bold text-center">Set New Password</h1>
                <ResponsiveText
                    as="p"
                    minSize="12px"
                    maxSize="12px"
                    className="text-xs mb-6 text-center text-gray-600"
                >
                    Enter your new password below.
                </ResponsiveText>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700"
                        >
                            New Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={onPasswordChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="********"
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={onConfirmPasswordChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="********"
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        fullWidth
                        variant="primary"
                        className="rounded-lg text-sm"
                        disabled={loading}
                    >
                        {loading ? "Resetting..." : "Reset Password"}
                    </Button>
                </form>

                {/* ✅ Success message */}
                {successMessage && (
                    <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                        {successMessage}
                    </div>
                )}

                {/* ❌ Error message */}
                {error && (
                    <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
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
