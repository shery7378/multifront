"use client";

import React from "react";
import Button from "@/components/UI/Button";
import Link from "next/link";
import ResponsiveText from "../UI/ResponsiveText";

const providerLogoPath = 'https://authjs.dev/img/providers';

// Mock authJsProviderMap (replace with actual provider map from your Auth.js configuration)
const authJsProviderMap = {
    google: { id: 'google', name: 'Google' },
    facebook: { id: 'facebook', name: 'Facebook' },
    // github: { id: 'github', name: 'GitHub' },
    // Add other providers as needed
};

export default function LoginForm({ email, password, onEmailChange, onPasswordChange, onSubmit, error }) {
    const handleSignIn = (providerId) => {
        // Implement Auth.js sign-in logic here, e.g., using signIn from next-auth
        console.log(`Sign in with ${providerId}`);
    };

    // Disable button if email or password is empty
    const isSubmitDisabled = !email.trim() || !password.trim();

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl shadow-sm w-full max-w-[420px]">
                <div className="grid gap-1">
                    <ResponsiveText as="h1" minSize="1rem" maxSize="1.6rem" className="font-bold leading-[1.25] tracking-tight text-center text-vivid-red">
                        MultiKonnect
                    </ResponsiveText>
                    <ResponsiveText as="h2" minSize="0.875rem" maxSize="1.4rem" className="font-bold leading-[1.25] tracking-tight text-center">
                        Sign In
                    </ResponsiveText>
                    <ResponsiveText as="p" minSize="0.615rem" maxSize="0.70rem" className="mt-2 text-center text-gray-500">
                        Welcome back 👋
                    </ResponsiveText>
                </div>
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
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={onPasswordChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter your password"
                            required
                        />
                        <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-200 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                                    Remember me
                                </label>
                            </div>
                            <Link
                                href="/forgot-password"
                                className="text-xs text-vivid-red underline"
                            >
                                Forgot your password?
                            </Link>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        fullWidth
                        variant="primary"
                        className="rounded-lg"
                        disabled={isSubmitDisabled}
                    >
                        Sign in
                    </Button>
                </form>

                {/* Create Account Button */}
                <div className="mt-4">
                    <Link href="/sign-up">
                        <Button
                            fullWidth
                            variant="outline"
                            className="rounded-lg border-vivid-red text-vivid-red hover:bg-vivid-red hover:text-white"
                        >
                            Create Account
                        </Button>
                    </Link>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>
                )}

                {/* Auth.js Social Login Buttons */}
                <div className="w-full mt-4">
                    {/* Divider */}
                    <div className="flex items-center mb-4">
                        <div className="flex-auto border-t border-gray-200" />
                        <span className="mx-2 text-sm text-gray-500">Or continue with</span>
                        <div className="flex-auto border-t border-gray-200" />
                    </div>

                    {/* Social Login Buttons */}
                    <div className="flex flex-col gap-3">
                        {Object.values(authJsProviderMap)
                            .filter((provider) => provider.id !== 'credentials')
                            .map((provider) => (
                                <Button
                                    key={provider.id}
                                    onClick={() => handleSignIn(provider.id)}
                                    fullWidth
                                    variant="outline"
                                    className="rounded-xl h-[46px] px-6 text-[0.95rem] !justify-between !font-medium hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all duration-300"
                                    iconRight={
                                        <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full">
                                            <img
                                                className="w-5 h-5"
                                                src={`${providerLogoPath}/${provider.id}.svg`}
                                                alt={provider.name}
                                            />
                                        </div>
                                    }
                                >
                                    Sign in with {provider.name}
                                </Button>
                            ))}
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500">
                        Are you a vendor?{" "}
                        <Link
                            href={`${process.env.NEXT_PUBLIC_DASHBOARD_URL}/sign-in`}
                            className="text-vivid-red hover:underline"
                        >
                            Log in as a vendor
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}