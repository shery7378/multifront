//src/components/modals/UpdateNumberModal.jsx
'use client';
import React, { useState } from 'react';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import { usePostRequest } from '@/controller/postRequests';
import { useSelector } from 'react-redux';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

export default function UpdateNumberModal({ isOpen, onClose, onSuccess }) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const { sendPostRequest, loading } = usePostRequest();
    const { user } = useSelector((state) => state.auth);

    const handleUpdateClick = async () => {
        // Validate
        const errors = {};
        if (!phoneNumber.trim()) {
            errors.phoneNumber = "Phone number is required";
        } else if (!/^\d[\d\s\-]*$/.test(phoneNumber.trim())) {
            errors.phoneNumber = "Invalid phone number format";
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});
        setErrorMessage('');
        setSuccessMessage('');

        try {
            // Get profile ID from current user
            const profileId = user?.profile?.id;
            if (!profileId) {
                setErrorMessage('Profile not found. Please refresh the page and try again.');
                return;
            }

            const fullNumber = '+44' + phoneNumber.replace(/[\s\-]/g, '');

            await sendPostRequest(`/profiles/${profileId}/send-phone-otp`, {
                phone: fullNumber,
            }, true);

            setSuccessMessage('OTP sent successfully!');

            // Notify parent to open verification modal
            if (onSuccess) {
                setTimeout(() => {
                    onSuccess(fullNumber);
                    setPhoneNumber('');
                    setSuccessMessage('');
                }, 1000);
            }
        } catch (err) {
            setErrorMessage(err.message || 'Failed to send OTP. Please try again.');
        }
    };

    const handleClose = () => {
        setPhoneNumber('');
        setFieldErrors({});
        setSuccessMessage('');
        setErrorMessage('');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Update Number"
            className="max-w-md p-0 pb-4"
            showCloseButton={true}
            titleClassName="py-4 text-oxford-blue font-bold"
        >
            <div className="grid h-full items-center gap-4">
                <div className="flex">
                    <p className="text-baltic-black font-medium">
                        You'll use this number to get notifications, sign in, and recover your account.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Fixed UK Country Code Label */}
                    <div className="flex items-center justify-center px-4 h-14 bg-ghost-white border border-gray-200 text-baltic-black text-base font-medium rounded-md select-none whitespace-nowrap min-w-[64px]">
                        +44
                    </div>

                    <Input
                        name="phoneNumber"
                        value={phoneNumber}
                        onChange={(e) => {
                            setPhoneNumber(e.target.value);
                            if (fieldErrors.phoneNumber) setFieldErrors(prev => ({ ...prev, phoneNumber: '' }));
                            if (errorMessage) setErrorMessage('');
                        }}
                        placeholder="Enter Phone Number"
                        className="flex-1"
                        error={fieldErrors.phoneNumber}
                        inputClassName="h-14 border bg-ghost-white border-gray-200 rounded-md"
                        labelClassName="hidden"
                    />
                </div>

                {errorMessage && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <ExclamationCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <p className="text-red-700 text-sm font-medium">{errorMessage}</p>
                    </div>
                )}

                {successMessage && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <p className="text-green-700 text-sm font-medium">{successMessage}</p>
                    </div>
                )}

                <p className="text-oxford-blue/60 text-[10px] mt-1 text-start">
                    We will send a 4-digit code to verify this number.
                </p>

                <div className="">
                    <Button
                        fullWidth
                        variant="primary"
                        className="rounded-md h-[60px] bg-vivid-red text-white"
                        onClick={handleUpdateClick}
                        disabled={loading}
                    >
                        {loading ? "Sending Code..." : "Send Verification Code"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}