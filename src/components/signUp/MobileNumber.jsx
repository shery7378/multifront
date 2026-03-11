// src/components/signUp/MobileNumber.jsx
"use client";
import { useState, useEffect } from "react";
import Button from "../UI/Button";

// Common country codes with flags/names
const countryCodes = [
    { code: "+92", country: "PK", name: "Pakistan" },
    { code: "+1", country: "US", name: "United States" },
    { code: "+44", country: "GB", name: "United Kingdom" },
    { code: "+91", country: "IN", name: "India" },
    { code: "+971", country: "AE", name: "UAE" },
    { code: "+966", country: "SA", name: "Saudi Arabia" },
    { code: "+20", country: "EG", name: "Egypt" },
    { code: "+27", country: "ZA", name: "South Africa" },
    { code: "+61", country: "AU", name: "Australia" },
    { code: "+33", country: "FR", name: "France" },
    { code: "+49", country: "DE", name: "Germany" },
    { code: "+86", country: "CN", name: "China" },
    { code: "+81", country: "JP", name: "Japan" },
    { code: "+82", country: "KR", name: "South Korea" },
    { code: "+65", country: "SG", name: "Singapore" },
    { code: "+60", country: "MY", name: "Malaysia" },
];

export default function MobileNumber({ mobileNumber, onNext, onBack, onMobileChange, onSkip, error }) {
    const [localMobile, setLocalMobile] = useState(mobileNumber || "");
    const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]); // Default to Pakistan
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [countryLoading, setCountryLoading] = useState(true);

    // Fetch country code from IP on component mount
    useEffect(() => {
        const fetchCountryCode = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const response = await fetch(`${apiUrl}/api/country-code`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.data && data.data.country_code) {
                        const countryCode = data.data.country_code;
                        const phoneCode = data.data.phone_code;

                        // Save phone code to localStorage for registration submission
                        if (phoneCode) {
                            localStorage.setItem('phoneCode', phoneCode);
                        }

                        // Find matching country in the list
                        const matching = countryCodes.find(
                            c => c.country === countryCode || c.code === phoneCode
                        );

                        if (matching) {
                            setSelectedCountry(matching);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching country code:', error);
                // Silently fail and use default
            } finally {
                setCountryLoading(false);
            }
        };

        fetchCountryCode();
    }, []);

    const isValid = true;
    const loading = false;

    const handleCountrySelect = (country) => {
        setSelectedCountry(country);
        setShowCountryDropdown(false);
        // Update the mobile number with new country code if it starts with old code
        if (localMobile.startsWith(selectedCountry.code)) {
            const numberWithoutCode = localMobile.replace(selectedCountry.code, "").trim();
            const newMobile = country.code + numberWithoutCode;
            setLocalMobile(newMobile);
            if (onMobileChange) {
                const syntheticEvent = {
                    target: { value: newMobile }
                };
                onMobileChange(syntheticEvent);
            }
        }
    };

    const handleMobileChange = (e) => {
        const value = e.target.value;
        // Allow digits, spaces, dashes, and + sign
        const cleaned = value.replace(/[^\d\s\-\+]/g, "");
        setLocalMobile(cleaned);
        if (onMobileChange) {
            onMobileChange({ ...e, target: { ...e.target, value: cleaned } });
        }
    };

    return (
        <>
            <div className="text-left mt-4">
                <label className="mb-[9px] inline-block text-base font-normal text-[#000000]">Mobile Number f</label>
                <div className="flex items-center gap-3 relative">
                    {/* Country Code Selector */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                            className="w-20 email-input w-full px-4 py-4.5 bg-[#F4F4F4] border-0 text-[#00000080] text-base font-normal placeholder:text-[#00000080] rounded-[6px] shadow-none focus:outline-none focus:ring-0  focus:border-0"
                        >
                            <span className="mr-1">{selectedCountry.country}</span>
                            <span className="text-xs text-gray-500">▼</span>
                        </button>

                        {showCountryDropdown && (
                            <>
                                {/* Backdrop to close dropdown */}
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowCountryDropdown(false)}
                                />
                                {/* Dropdown menu */}
                                <div className="absolute top-full left-0 mt-1 w-64 max-h-60 overflow-y-auto bg-[#F4F4F4] border border-gray-200 rounded-lg shadow-lg z-20">
                                    {countryCodes.map((country) => (
                                        <button
                                            key={country.code}
                                            type="button"
                                            onClick={() => handleCountrySelect(country)}
                                            className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between ${selectedCountry.code === country.code ? 'bg-vivid-red/10' : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm">{country.country}</span>
                                                <span className="text-xs text-gray-500">{country.name}</span>
                                            </div>
                                            <span className="text-sm text-gray-700">{country.code}</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Phone Number Input */}
                    <input
                        type="tel"
                        placeholder={`${selectedCountry.code} 3001234567`}
                        value={localMobile}
                        onChange={handleMobileChange}
                        className="email-input w-full px-4 py-4.5 bg-[#F4F4F4] border-0 text-[#00000080] text-base font-normal placeholder:text-[#00000080] rounded-[6px] shadow-none focus:outline-none focus:ring-0  focus:border-0"
                    />
                </div>
                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                <p className="text-[#00000080] text-xs mt-2">
                    Format: {selectedCountry.code} followed by your mobile number
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
                <Button fullWidth variant="secondary" onClick={onSkip} className="!rounded-[6px] lg:h-[60px] h-[46px]">Skip</Button>
                <Button fullWidth variant="primary" onClick={onNext} disabled={loading} className="!rounded-[6px] lg:h-[60px] h-[46px]">
                    {loading ? "Loading" : "Next"}
                </Button>
            </div>
        </>
    );
}