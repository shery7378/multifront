// src/components/signUp/MobileNumber.jsx
"use client";
import { useState } from "react";
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
                <label className="mb-2 inline-block text-sm font-medium text-gray-700">Mobile Number</label>
                <div className="flex items-center gap-3 relative">
                    {/* Country Code Selector */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                            className="w-20 h-12 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-vivid-red/60 transition-colors"
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
                                <div className="absolute top-full left-0 mt-1 w-64 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                                    {countryCodes.map((country) => (
                                        <button
                                            key={country.code}
                                            type="button"
                                            onClick={() => handleCountrySelect(country)}
                                            className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between ${
                                                selectedCountry.code === country.code ? 'bg-vivid-red/10' : ''
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
                        className="flex-1 h-12 rounded-lg bg-gray-100 border border-gray-100 px-4 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-vivid-red/60 focus:border-vivid-red/60"
                    />
                </div>
                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                <p className="text-gray-500 text-xs mt-1">
                    Format: {selectedCountry.code} followed by your mobile number
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
                <Button fullWidth variant="secondary" onClick={onSkip} className="rounded-lg h-12">Skip</Button>
                <Button fullWidth variant="primary" onClick={onNext} disabled={loading} className="rounded-lg h-12">
                    {loading ? "Loading" : "Next"}
                </Button>
            </div>
        </>
    );
}