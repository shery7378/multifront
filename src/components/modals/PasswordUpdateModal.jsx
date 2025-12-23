//src/components/modals/PasswordUpdateModal.jsx
'use client';
import React, { useState } from 'react';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import { usePutRequest } from '@/controller/putRequests';

export default function PasswordUpdateModal({ isOpen, onClose }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { sendPutRequest, loading: updating, error: updateError } = usePutRequest();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const validatePassword = (password) => {
        const minLength = password.length >= 8;
        const hasDigit = /\d/.test(password);
        const hasNonDigit = /\D/.test(password);
        return minLength && hasDigit && hasNonDigit;
    };

    const handleUpdateClick = async () => {
        if (!currentPassword) {
            setError('Current password is required.');
            return;
        }
        if (!newPassword || !confirmPassword) {
            setError('Both new password and confirmation password are required.');
            return;
        }
        if (!validatePassword(newPassword)) {
            setError('Password must be at least 8 characters long, and contain at least one digit and one non-digit character.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('New passwords and confirmation passwords do not match.');
            return;
        }
        setSuccess('');

        try {
            const payload = {
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: confirmPassword,
            };

            const response = await sendPutRequest(`/auth/update-password`, payload, true);

            if (response.status === 200) {
                setError('');
                setSuccess('Password updated successfully!');
                // Close after 1.5s delay
                setTimeout(handleClose, 1500);
            } else {
                setError(response.message || 'Failed to update password.');
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'An error occurred while updating the password.');
        }
    };

    const handleClose = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess('');
        onClose();
    };


    return (
        <Modal
            isOpen={isOpen}
            // onClose={onClose}
            onClose={handleClose}
            title="Password Update"
            className="max-w-md p-0 pb-4"
            showCloseButton={true}
            titleClassName="py-4 text-oxford-blue font-bold"
        >
            <div className="grid h-full items-center gap-4">
                <div className="flex">
                    <p className="text-baltic-black font-medium">
                        Your password must be at least 8 characters long, and contain at least one digit and one non-digit character.
                    </p>
                </div>
                <div className="space-y-2">
                    <Input
                        name="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Current password"
                        label="Current password"
                        className="w-full"
                        inputClassName="h-14 p-2 border bg-ghost-white border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-vivid-red/60"
                        labelClassName="text-black font-medium text-sm mb-1"
                    />

                    <Input
                        name="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password"
                        label="New password"
                        className="w-full"
                        inputClassName="h-14 p-2 border bg-ghost-white border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-vivid-red/60"
                        labelClassName="text-black font-medium text-sm mb-1"
                    />
                    <Input
                        name="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        label="Confirm new password"
                        className="w-full mt-4"
                        inputClassName="h-14 p-2 border bg-ghost-white border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-vivid-red/60"
                        labelClassName="text-black font-medium text-sm mb-1"
                    />
                </div>
                {error && <p className="text-vivid-red text-sm mt-1 text-center">{error}</p>}
                {success && <p className="text-green-500 text-sm mt-1 text-center">{success}</p>}
                <div className="">
                    <Button
                        fullWidth
                        variant="primary"
                        className={`rounded-md h-[60px] bg-vivid-red text-white flex items-center justify-center ${updating ? 'opacity-70 cursor-not-allowed' : ''}`}
                        onClick={handleUpdateClick}
                        disabled={updating}
                    >
                        {updating ? 'Updating...' : 'Update'}
                    </Button>

                </div>
            </div>
        </Modal>
    );
}