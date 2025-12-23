//src/components/modals/UpdateNumberModal.jsx
'use client';
import React, { useState } from 'react';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import Select from '@/components/UI/Select';
import UpdateNumberVerifyCodeModal from './UpdateNumberVerifyCodeModal';

export default function UpdateNumberModal({ isOpen, onClose, error }) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('GB');
    const [isVerifyCodeModalOpen, setIsVerifyCodeModalOpen] = useState(false);

    // Sample country options with codes
    const countryOptions = [
        { value: 'GB', label: 'GB' },
        { value: 'US', label: 'US' },
        { value: 'PK', label: 'PK' },
        { value: 'CA', label: 'CA' },
        { value: 'AU', label: 'AU' },
    ];

    const handleUpdateClick = () => {
        if (phoneNumber) {
            onClose(); // Close current modal
            setIsVerifyCodeModalOpen(true); // Open Verify Code Modal
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Update Number"
                className="max-w-md p-0 pb-4"
                showCloseButton={true}
                titleClassName="py-4 text-oxford-blue font-bold"
            >
                <div className="grid h-full items-center gap-4">
                    <div className="flex">
                        <p className="text-baltic-black font-medium">
                            You’ll use this number to get notifications, sign in, and recover your account.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select
                            label="Country"
                            name="country"
                            value={selectedCountry}
                            onChange={(e) => setSelectedCountry(e.target.value)}
                            placeholder="Select Country"
                            className="!w-20"
                            selectClassName="h-14 p-2 border bg-ghost-white border-gray-200 rounded-md text-base text-baltic-black"
                            labelClassName="hidden"
                            options={countryOptions}
                        />
                        <Input
                            name="phoneNumber"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="Enter Phone Number"
                            className="flex-1"
                            inputClassName="h-14 p-2 border bg-ghost-white border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-vivid-red/60"
                            labelClassName="hidden"
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm mt-1 text-center">{error}</p>}
                    <p className="text-oxford-blue/60 text-[10px] mt-1 text-start">
                        A verification code will be sent to this number
                    </p>
                    <div className="">
                        <Button
                            fullWidth
                            variant="primary"
                            className="rounded-md h-[60px] bg-vivid-red text-white"
                            onClick={handleUpdateClick}
                        >
                            Update
                        </Button>
                    </div>
                </div>
            </Modal>

            <UpdateNumberVerifyCodeModal
                isOpen={isVerifyCodeModalOpen}
                onClose={() => setIsVerifyCodeModalOpen(false)}
                code={phoneNumber ? phoneNumber.split('').slice(0, 4) : ["", "", "", ""]} // Pass first 4 chars as initial code
                onCodeChange={(newCode) => console.log(newCode)} // Example handler
            />
        </>
    );
}