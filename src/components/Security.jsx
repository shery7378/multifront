//src/components/Security.jsx
'use client';
import React, { useState } from 'react';
import IconButton from './UI/IconButton';
import { GoArrowUpRight } from "react-icons/go";
import ResponsiveText from './UI/ResponsiveText';
import AuthenticationInstructionsModal from './modals/AuthenticationInstructionsModal';
import TurnOn2StepVerificationModal from './modals/TurnOn2StepVerificationModal';
import PasswordUpdateModal from './modals/PasswordUpdateModal';
import UpdateNumberModal from './modals/UpdateNumberModal';
import AuthenticatorVerifyCodeModal from './modals/AuthenticatorVerifyCodeModal';

export default function Security() {
    const securityItems = [
        { title: 'Password', description: '' },
        { title: 'Passkeys', description: 'Passkeys are easier and more secure than passwords.' },
        { title: 'Authenticator app', description: 'Set up your authenticator app to add an extra layer of security.' },
        { title: '2-step verification', description: 'Additional security to your account with 2-step verification.' },
        { title: 'Recovery phone', description: 'Add a backup phone number to access your account.' },
    ];

    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [is2StepModalOpen, setIs2StepModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isNumberModalOpen, setIsNumberModalOpen] = useState(false);
    const [isVerifyCodeModalOpen, setIsVerifyCodeModalOpen] = useState(false);

    return (
        <div className="p-4">
            {securityItems.map((item, index) => (
                <div
                    key={index}
                    className="border-b border-gray-200 py-4 flex justify-between items-center last:border-b-0"
                >
                    <div>
                        <ResponsiveText as='h3' minSize="16px" maxSize='20px' className="text-oxford-blue font-medium">
                            {item.title}
                        </ResponsiveText>

                        <ResponsiveText as='p' minSize="12px" maxSize='14px' className="text-oxford-blue/60 mt-1">
                            {item.description}
                        </ResponsiveText>
                    </div>

                    <IconButton
                        icon={GoArrowUpRight}
                        iconClasses=""
                        className="min-w-10 min-h-10"
                        onClick={() => {
                            if (item.title === 'Authenticator app') setIsAuthModalOpen(true);
                            else if (item.title === '2-step verification') setIs2StepModalOpen(true);
                            else if (item.title === 'Password') setIsPasswordModalOpen(true);
                            else if (item.title === 'Recovery phone') setIsNumberModalOpen(true);
                            else null;
                        }}
                    />
                </div>
            ))}
            <AuthenticationInstructionsModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onNext={() => {
                    setIsAuthModalOpen(false);
                    setIsVerifyCodeModalOpen(true);
                }}
            />

            <TurnOn2StepVerificationModal
                isOpen={is2StepModalOpen}
                onClose={() => setIs2StepModalOpen(false)}
            />

            <PasswordUpdateModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
            />

            <UpdateNumberModal
                isOpen={isNumberModalOpen}
                onClose={() => setIsNumberModalOpen(false)}
            />

            <AuthenticatorVerifyCodeModal
                isOpen={isVerifyCodeModalOpen}
                onClose={() => setIsVerifyCodeModalOpen(false)}
                code={["", "", "", ""]} // Initial empty code
                error=""
            />
        </div>
    );
}