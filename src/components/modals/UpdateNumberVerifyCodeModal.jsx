//src/components/modals/UpdateNumberVerifyCodeModal.jsx
'use client';
import React, { useState } from 'react';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';

export default function UpdateNumberVerifyCodeModal({ code, isOpen, onClose, error }) {
    const [localCode, setLocalCode] = useState(code || ["", "", "", ""]);

    const handleChange = (index, value) => {
        const newCode = [...localCode];
        newCode[index] = value.slice(0, 1);
        setLocalCode(newCode);
        onCodeChange(newCode);
        if (value && index < 3) document.getElementById(`code-input-${index + 1}`).focus();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Update Number"
            className="max-w-md p-0 pb-4"
            showCloseButton={true}
            titleClassName="py-4"
        >
            <div className="grid h-full items-center gap-2">
                <div className="flex">
                    <p className=" text-baltic-black font-medium">You’ll use this number to get notifications, sign in, and recover your account.</p>
                </div>
                <div className="flex justify-between gap-2">
                    {localCode.map((digit, index) => (
                        <input
                            key={index}
                            id={`code-input-${index}`}
                            type="text"
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            className="w-15 h-15 text-center rounded-md bg-bright-gray focus:outline-none focus:ring-2 focus:ring-vivid-red"
                            maxLength="1"
                            autoFocus={index === 0}
                        />
                    ))}
                </div>
                {error && <p className="text-red-500 text-sm mt-1 text-center">{error}</p>}
                <p className="text-black/50 mb-4 text-start">
                    <span className="text-black">Tip</span>: Make Sure to check your inbox
                </p>

                <div className="">
                    <Button fullWidth variant="primary" className="rounded-md h-[60px]">
                        Update
                    </Button>
                </div>
            </div>
        </Modal>
    );
}