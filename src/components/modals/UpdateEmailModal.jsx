//src/components/modals/UpdateEmailModal.jsx
'use client';
import React, { useState } from 'react';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import UpdateEmailVerifyCodeModal from './UpdateEmailVerifyCodeModal';

export default function UpdateEmailModal({ isOpen, onClose, error }) {
    const [newEmail, setNewEmail] = useState('');
    const [isVerifyCodeModalOpen, setIsVerifyCodeModalOpen] = useState(false);

    const handleUpdateClick = () => {
        if (newEmail) {
            onClose(); // Close current modal
            setIsVerifyCodeModalOpen(true); // Open Verify Code Modal
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Email"
                className="max-w-md p-0 pb-4"
                showCloseButton={true}
                titleClassName="py-4"
            >
                <div className="grid h-full items-center gap-2">
                    <div className="flex">
                        <p className=" text-baltic-black font-medium">
                            You’ll use this email to receive messages, sign in, and recover your account.
                        </p>
                    </div>
                    <div className="flex justify-between gap-2">
                        <Input
                            name="newEmail"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="Enter Email"
                            className="w-full h-14 border bg-ghost-white border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-vivid-red/60"
                            inputClassName="pr-20 h-14 border-0"
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm mt-1 text-center">{error}</p>}
                    <p className="text-oxford-blue/60 text-[10px] mb-4 text-start">
                        You’ll use this email to receive messages, sign in, and recover your account.
                    </p>

                    <div className="">
                        <Button fullWidth variant="primary" className="rounded-md h-[60px]" onClick={handleUpdateClick}>
                            Update
                        </Button>
                    </div>
                </div>
            </Modal>

            <UpdateEmailVerifyCodeModal
                isOpen={isVerifyCodeModalOpen}
                onClose={() => setIsVerifyCodeModalOpen(false)}
                code={newEmail ? newEmail.split('').slice(0, 4) : ["", "", "", ""]} // Pass first 4 chars as initial code
                onCodeChange={(newCode) => console.log(newCode)} // Example handler
            />
        </>
    );
}