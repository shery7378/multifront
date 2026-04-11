//src/components/modals/UpdateEmailModal.jsx
'use client';
import React, { useState } from 'react';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import { usePutRequest } from '@/controller/putRequests';
import { useSelector } from 'react-redux';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

export default function UpdateEmailModal({ isOpen, onClose, onSuccess }) {
    const [newEmail, setNewEmail] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const { sendPutRequest, loading } = usePutRequest();
    const { user } = useSelector((state) => state.auth);

    const handleUpdateClick = async () => {
        // Validate
        const errors = {};
        if (!newEmail.trim()) {
            errors.newEmail = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
            errors.newEmail = "Invalid email format";
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const profileId = user?.profile?.id;
            if (!profileId) {
                setErrorMessage('Profile not found. Please refresh the page and try again.');
                return;
            }

            await sendPutRequest(`/profiles/${profileId}`, {
                email: newEmail.trim(),
            }, true);

            setSuccessMessage('Email updated successfully!');
            setNewEmail('');

            // Notify parent to refresh user data
            if (onSuccess) {
                setTimeout(() => {
                    onSuccess(newEmail.trim());
                    onClose();
                    setSuccessMessage('');
                }, 1500);
            }
        } catch (err) {
            setErrorMessage(err.message || 'Failed to update email. Please try again.');
        }
    };

    const handleClose = () => {
        setNewEmail('');
        setFieldErrors({});
        setSuccessMessage('');
        setErrorMessage('');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Update Email"
            className="max-w-md p-0 pb-4"
            showCloseButton={true}
            titleClassName="py-4 text-oxford-blue font-bold"
        >
            <div className="grid h-full items-center gap-2">
                <div className="flex">
                    <p className="text-baltic-black font-medium">
                        You'll use this email to receive messages, sign in, and recover your account.
                    </p>
                </div>
                <div className="flex justify-between gap-2">
                    <Input
                        name="newEmail"
                        type="email"
                        value={newEmail}
                        onChange={(e) => {
                            setNewEmail(e.target.value);
                            if (fieldErrors.newEmail) setFieldErrors(prev => ({ ...prev, newEmail: '' }));
                            if (errorMessage) setErrorMessage('');
                        }}
                        placeholder="Enter Email"
                        className="w-full"
                        error={fieldErrors.newEmail}
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

                <p className="text-oxford-blue/60 text-[10px] mb-4 text-start">
                    Your email will be updated on your account.
                </p>

                <div className="">
                    <Button
                        fullWidth
                        variant="primary"
                        className="rounded-md h-[60px]"
                        onClick={handleUpdateClick}
                        disabled={loading}
                    >
                        {loading ? "Updating..." : "Update"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}