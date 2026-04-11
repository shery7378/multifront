//src/components/modals/UpdateNumberVerifyCodeModal.jsx
'use client';
import React, { useState, useEffect } from 'react';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import { usePostRequest } from '@/controller/postRequests';
import { useSelector } from 'react-redux';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

export default function UpdateNumberVerifyCodeModal({ phone, isOpen, onClose, onSuccess }) {
    const [localCode, setLocalCode] = useState(["", "", "", ""]);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const { sendPostRequest, loading } = usePostRequest();
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        if (!isOpen) {
            setLocalCode(["", "", "", ""]);
            setErrorMessage('');
            setSuccessMessage('');
        }
    }, [isOpen]);

    const handleChange = (index, value) => {
        if (errorMessage) setErrorMessage('');
        
        // Handle pasting full code
        if (value.length > 1 && value.length <= 4) {
            const pastedCode = value.split('').slice(0, 4);
            const newCode = [...localCode];
            pastedCode.forEach((char, i) => {
                newCode[i] = char;
            });
            setLocalCode(newCode);
            // Focus last input
            const nextIndex = pastedCode.length < 4 ? pastedCode.length : 3;
            document.getElementById(`code-input-${nextIndex}`)?.focus();
            return;
        }

        const newCode = [...localCode];
        newCode[index] = value.slice(-1); // Take last character if multiple typed rapidly
        setLocalCode(newCode);
        
        // Auto advance to next input
        if (value && index < 3) {
            document.getElementById(`code-input-${index + 1}`)?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Backspace handling
        if (e.key === 'Backspace') {
            if (!localCode[index] && index > 0) {
                // If current is empty, focus previous and clear it
                const newCode = [...localCode];
                newCode[index - 1] = '';
                setLocalCode(newCode);
                document.getElementById(`code-input-${index - 1}`)?.focus();
            } else {
                // Just clear current
                const newCode = [...localCode];
                newCode[index] = '';
                setLocalCode(newCode);
            }
        }
    };

    const handleVerify = async () => {
        const fullCode = localCode.join('');
        if (fullCode.length !== 4) {
            setErrorMessage('Please enter all 4 digits');
            return;
        }

        setErrorMessage('');
        setSuccessMessage('');

        try {
            const profileId = user?.profile?.id;
            if (!profileId) {
                setErrorMessage('Profile not found.');
                return;
            }

            await sendPostRequest(`/profiles/${profileId}/verify-phone-update`, {
                phone: phone,
                code: fullCode
            }, true);

            setSuccessMessage('Phone number updated successfully!');

            if (onSuccess) {
                setTimeout(() => {
                    onSuccess(phone);
                    onClose();
                }, 1500);
            }
        } catch (err) {
            setErrorMessage(err.message || 'Verification failed. Please try again.');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Verify Number"
            className="max-w-md p-0 pb-4"
            showCloseButton={true}
            titleClassName="py-4 text-oxford-blue font-bold"
        >
            <div className="grid h-full items-center gap-4">
                <div className="flex">
                    <p className="text-baltic-black font-medium">
                        Enter the 4-digit code sent via SMS to <span className="font-bold">{phone}</span>.
                    </p>
                </div>
                
                <div className="flex justify-center gap-3">
                    {localCode.map((digit, index) => (
                        <input
                            key={index}
                            id={`code-input-${index}`}
                            type="text"
                            inputMode="numeric"
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="w-16 h-16 text-2xl font-bold text-center rounded-md bg-ghost-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-vivid-red/60"
                            maxLength="4" // Allows pasting
                            autoFocus={index === 0}
                        />
                    ))}
                </div>

                {errorMessage && (
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
                        <p className="text-red-500 text-sm">{errorMessage}</p>
                    </div>
                )}
                
                {successMessage && (
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        <p className="text-green-500 text-sm font-medium">{successMessage}</p>
                    </div>
                )}

                <p className="text-oxford-blue/60 text-sm text-center mb-4 mt-2">
                    <span className="font-bold">Tip</span>: Check your messages app
                </p>

                <div className="">
                    <Button 
                        fullWidth 
                        variant="primary" 
                        className="rounded-md h-[60px] bg-vivid-red text-white"
                        onClick={handleVerify}
                        disabled={loading || localCode.join('').length !== 4}
                    >
                        {loading ? "Verifying..." : "Verify & Update"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}