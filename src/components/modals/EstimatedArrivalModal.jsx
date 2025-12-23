//src/components/modals/EstimatedArrivalModal.jsx
'use client';
import React from 'react';
import Modal from '@/components/UI/Modal';
import ResponsiveText from '@/components/UI/ResponsiveText';

export default function EstimatedArrivalModal({ isOpen, onClose }) {
    const currentTime = new Date();
    const estimatedArrival = new Date(currentTime.getTime() + 45 * 60 * 1000); // 45 minutes from now
    const formattedTime = estimatedArrival.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    // 4 steps with corresponding progress percentages
    const steps = [
        { label: 'PLACED', percentage: 25 },
        { label: 'PREPARING', percentage: 50 },
        { label: 'OUT FOR DELIVERY', percentage: 75 },
        { label: 'DELIVERED', percentage: 100 },
    ];
    const currentStep = 0; // Current step index (0 for PLACED)

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="45 Mints"
            className="max-w-md p-0 h-[222px]"
            showCloseButton={true}
        >
            <div className="grid h-full items-center pt-4">
                <ResponsiveText
                    as="p"
                    minSize="0.875rem"
                    maxSize="1rem"
                    className="text-baltic-black font-medium mb-4 text-start"
                >
                    Estimated Arrival Time
                </ResponsiveText>
                {/* Progress Bar with Labels */}
                <div className="relative mb-4">
                    <div className="w-full h-2.5 flex gap-2 overflow-hidden rounded-full">
                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className={`h-full rounded-full ${index <= currentStep ? 'bg-vivid-red' : 'bg-gray-100'}`}
                                style={{ width: `${step.percentage - (index > 0 ? steps[index - 1].percentage : 0)}%` }}
                            ></div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2">
                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className="flex-1 text-left"
                                style={{ width: `${step.percentage - (index > 0 ? steps[index - 1].percentage : 0)}%`, maxWidth: '100%' }}
                            >
                                <ResponsiveText
                                    as="span"
                                    minSize="0.75rem"
                                    maxSize="1rem"
                                    className={`text-baltic-black ${index <= currentStep ? 'font-semibold' : ''} block whitespace-nowrap overflow-hidden text-ellipsis`}
                                    style={{ maxWidth: '100%' }}
                                >
                                    {currentStep >= index ? step.label : ''}
                                </ResponsiveText>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
}