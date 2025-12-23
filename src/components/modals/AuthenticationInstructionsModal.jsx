//src/components/modals/AuthenticationInstructionsModal.jsx
'use client';
import React from 'react';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import ResponsiveText from '@/components/UI/ResponsiveText';

export default function AuthenticationInstructionsModal({ isOpen, onClose, onNext }) {
    const key = "OGI-EIL5-KCVS-YQCS-TPNM-72NT-WWAJ-YIUD";

    const handleCopyKey = () => {
        navigator.clipboard.writeText(key);
        alert('Key copied to clipboard!');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            // Use custom header to control exact sizing like the screenshot
            header={
                <div className="flex items-start justify-between">
                    <ResponsiveText as="h2" minSize="18px" maxSize="20px" className="text-oxford-blue font-bold">
                        Authentication instructions
                    </ResponsiveText>
                </div>
            }
            className="max-w-sm p-0 pb-4"
            showCloseButton={true}
        >
            <div className="grid h-full items-center gap-4">
                {/* QR container */}
                <div className="flex justify-center">
                    <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                        <img
                            src="/images/qr-code-placeholder.png"
                            alt="QR Code"
                            className="w-40 h-40"
                        />
                    </div>
                </div>

                {/* Key + copy */}
                <div className="flex flex-col items-center gap-2">
                    <span className="text-baltic-black text-sm font-medium text-center tracking-tight">
                        {key}
                    </span>
                    <Button
                        variant="secondary"
                        className="p-0 h-11 w-full bg-cultured text-oxford-blue/70 rounded-md hover:bg-gray-200 flex items-center justify-center"
                        onClick={handleCopyKey}
                    >
                        Copy key
                    </Button>
                </div>

                {/* Instructions */}
                <div className="text-oxford-blue/80 text-sm space-y-3 leading-6">
                    <p>1. Get an authenticator app on your phone or computer (e.g. Duo, Google Authenticator)</p>
                    <p>2. Scan the QR code or copy the key to your preferred authenticator app.</p>
                    <p>3. Enter the 6-digit code generated from your authenticator app on the next screen.</p>
                </div>

                {/* Next button */}
                <div>
                    <Button
                        fullWidth
                        variant="primary"
                        className="rounded-md h-12 bg-vivid-red text-white"
                        onClick={onNext}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </Modal>
    );
}