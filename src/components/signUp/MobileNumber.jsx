// src/components/signUp/MobileNumber.jsx
"use client";
import { useState } from "react";
import Button from "../UI/Button";

export default function MobileNumber({ mobileNumber, onNext, onBack, onMobileChange, onSkip, error }) {
    const [localMobile, setLocalMobile] = useState(mobileNumber || "");

    const isValid = true;
    const loading = false;

    return (
        <>
            <div className="text-left mt-4">
                <label className="mb-2 inline-block text-sm font-medium text-gray-700">Mobile Number</label>
                <div className="flex items-center gap-3">
                    <div className="w-16 h-12 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-sm font-medium text-gray-700">PK</div>
                    <input
                        type="tel"
                        placeholder="+92"
                        value={localMobile}
                        onChange={(e) => {
                            setLocalMobile(e.target.value);
                            onMobileChange(e);
                        }}
                        className="flex-1 h-12 rounded-lg bg-gray-100 border border-gray-100 px-4 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-gray-200"
                    />
                </div>
                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
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