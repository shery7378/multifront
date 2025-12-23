//src/components/modals/TurnOn2StepVerificationModal.jsx
'use client';
import React from 'react';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import ResponsiveText from '@/components/UI/ResponsiveText';

export default function TurnOn2StepVerificationModal({ isOpen, onClose }) {

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            header={
                <div className="flex items-start justify-between">
                    <h2
                        className="text-oxford-blue font-bold"
                        style={{
                            fontSize: 'clamp(32px, 18.4986px + 0.382044vw, 98px)',
                            lineHeight: 'clamp(41px, 22.1983px + 0.458453vw, 31.8px)'
                        }}
                    >
                        Turn on 2-step verification
                    </h2>
                </div>
            }
            className="max-w-sm p-0 pb-4"
            showCloseButton={true}
        >
            <div className="grid h-full items-center gap-4">
                <div className="text-oxford-blue/80 text-sm space-y-3 leading-6">
                    <p>Add extra security to your account with 2-step verification and prevent unauthorized access to your account.</p>
                    <p>2-step verification requires an additional authentication step when logging into your account.</p>
                </div>
                <div className="space-y-3">
                    <Button
                        fullWidth
                        variant="primary"
                        className="rounded-md h-12 bg-vivid-red text-white"
                        onClick={onClose}
                    >
                        Get Started
                    </Button>
                    <Button
                        fullWidth
                        variant="secondary"
                        className="rounded-md h-12 bg-cultured text-oxford-blue"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </Modal>
    );
}