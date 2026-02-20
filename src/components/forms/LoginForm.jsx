"use client";

import React, { useState } from "react";
import Button from "@/components/UI/Button";
import Link from "next/link";
import ResponsiveText from "../UI/ResponsiveText";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
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
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="md:py-[30px] md:px-8 px-5 py-4 bg-white rounded-[13px] border border-[#D8DADC] w-full max-w-[512px]">
                <div className="grid gap-1">
                    <ResponsiveText as="h1" minSize="1rem" maxSize="1.6rem" className="font-bold leading-[1.25] tracking-tight text-center text-vivid-red">
                        MultiKonnect
                    </ResponsiveText>
                    <ResponsiveText as="h2" minSize="21px" maxSize="28px" className="font-medium leading-[1.25] tracking-tight text-[#092E3B] mb-2.5 text-center">
                        Sign In
                    </ResponsiveText>
                    <ResponsiveText as="p" minSize="14px" maxSize="16px" className=" text-left text-[#00000080] my-2.5">
                        Welcome back 👋
                    </ResponsiveText>
                </div>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="mb-[9px] inline-block text-base font-normal text-[#000000]">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={onEmailChange}
                            className="email-input w-full px-4 py-4.5 bg-[#F4F4F4] border-0 text-[#00000080] text-base font-normal placeholder:text-[#00000080] rounded-[6px] shadow-none focus:outline-none focus:ring-0  focus:border-0"
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="mb-[9px] inline-block text-base font-normal text-[#000000]">
                            Password
                        </label>


                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={onPasswordChange}
                                className="email-input w-full px-4 py-4.5 bg-[#F4F4F4] border-0 text-[#00000080] text-base font-normal placeholder:text-[#00000080] rounded-[6px] shadow-none focus:outline-none focus:ring-0  focus:border-0 pr-12"
                                placeholder="Enter your password"
                                required
                            />
                            <button
                                type="button"
                                tabIndex={-1}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-[#6B6B6B] focus:outline-none"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                            </button>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 !bg-[#F34322] !border-[#F34322] accent-[#F34322] focus:!ring-[#F34322] focus:!border-[#F34322] rounded transition-colors"
                                    style={{ backgroundColor: '#F34322' }}
                                    checked
                                    readOnly
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-base text-[##000000B2]">
                                    Remember me
                                </label>
                            </div>
                            <Link
                                href="/forgot-password"
                                className="text-sm text-vivid-red underline"
                            >
                                Forgot your password?
                            </Link>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        fullWidth
                        variant="primary"
                        className="lg:h-[60px] h-[46px] !rounded-[6px] hover:bg-[#F34322] hover:text-white"
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
                            className="!rounded-[24px] lg:h-[56px] h-[46px] border-vivid-red text-vivid-red "
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
                                    className="!rounded-[24px] lg:h-[56px] h-[46px] px-6 text-[1rem] text-[#111111] !justify-center !font-medium hover:bg-transparent active:scale-[0.98] transition-all duration-300"
                                    iconRight={
                                        <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full">
                                            <img
                                                className="w-6 h-6"
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
                    <ResponsiveText as="p" minSize="14px" maxSize="14px" className="mt-2 text-center text-[#000000B2]">
                        Are you a vendor?{" "}  
                        <Link href={`${process.env.NEXT_PUBLIC_DASHBOARD_URL}/sign-in`} className="text-vivid-red !font-semibold">
                            Log in as a vendor
                        </Link>
                    </ResponsiveText>

                </div>
            </div>
        </div>
    );
}