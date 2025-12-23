//src/components/modals/DropoffOptionsModal.jsx
'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/UI/Button';
import CloseXButton from '@/components/UI/CloseXButton';
import ResponsiveText from '@/components/UI/ResponsiveText';
import RadioButton from '../UI/RadioButton';

// Placeholder image URL (replace with your actual image path)
const deliveryImage = '/images/shoping-bag.png'; // Replace with your image (e.g., delivery person with boxes)

export default function DropoffOptionsModal({ onClose }) {
    const [isVisible, setIsVisible] = useState(false);
    const [selectedOption, setSelectedOption] = useState('meet_at_door');
    const [instructions, setInstructions] = useState('');

    useEffect(() => {
        setIsVisible(true); // Set visible when mounted
        if (typeof window !== 'undefined') {
            document.body.classList.add('no-scroll');
        }

        return () => {
            if (typeof window !== 'undefined') {
                document.body.classList.remove('no-scroll');
            }
        };
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
            if (typeof window !== 'undefined') {
                document.body.classList.remove('no-scroll');
            }
        }, 300); // Match the animation duration
    };

    const handleSubmit = () => {
        console.log('Selected Option:', selectedOption);
        console.log('Instructions:', instructions);
        handleClose();
    };

    const dropoffOptions = [
        { id: 'meet_at_door', label: 'Meet at my door' },
        { id: 'meet_outside', label: 'Meet outside' },
        { id: 'meet_in_lobby', label: 'Meet in the lobby' },
    ];

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                >
                    <motion.div
                        className="bg-white rounded-lg p-6 w-full max-w-full sm:max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar shadow-lg relative"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-4">
                            <ResponsiveText
                                as="h2"
                                minSize="1rem"
                                maxSize="2.083rem"
                                className="font-bold text-oxford-blue"
                            >
                                Dropoff options
                            </ResponsiveText>
                            <CloseXButton onClick={handleClose} className="text-oxford-blue hover:text-vivid-red" />
                        </div>

                        {/* Delivery Info */}
                        <ResponsiveText
                            as="p"
                            minSize="0.75rem"
                            maxSize="1rem"
                            className="text-baltic-black mb-4 font-medium"
                        >
                            Deliver to E12 6pn, 376
                        </ResponsiveText>

                        {/* Hand it to me Section */}
                        <div className="flex items-center gap-2 mb-4 rounded-lg">
                            <img src={deliveryImage} alt="Delivery person" className="w-13 h-13" />
                            <ResponsiveText
                                as="span"
                                minSize="0.75rem"
                                maxSize="1rem"
                                className="text-baltic-black font-medium"
                            >
                                Hand it to me
                            </ResponsiveText>
                        </div>

                        {/* Radio Options with HR */}
                        <div className="space-y-4 mb-4">
                            <hr className="border-t border-gray-200" />
                            {dropoffOptions.map((option, index) => (
                                <div key={option.id}>
                                    <RadioButton
                                        id={option.id}
                                        label={option.label}
                                        value={option.id}
                                        name="dropoff"
                                        checked={selectedOption === option.id}
                                        onChange={() => setSelectedOption(option.id)}
                                        size="lg"
                                        labelClassName=" !text-base font-medium"
                                    />
                                    <hr className="border-t border-gray-200 my-4" />
                                </div>
                            ))}
                        </div>

                        {/* Leave at location Section */}
                        <div className="flex items-center gap-2 mb-4 rounded-lg">
                            <img src={deliveryImage} alt="Delivery person" className="w-13 h-13" />
                            <ResponsiveText
                                as="span"
                                minSize="0.75rem"
                                maxSize="1rem"
                                className="text-baltic-black font-medium"
                            >
                                Leave at location
                            </ResponsiveText>
                        </div>

                        {/* Instructions Input */}
                        <div className="mt-4">
                            <ResponsiveText
                                as="label"
                                minSize="0.75rem"
                                maxSize="14px"
                                className="block text-oxford-blue font-normal mb-2"
                            >
                                Instructions for delivery person
                            </ResponsiveText>
                            <input
                                type="text"
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                placeholder="Example: please knock instead of using the doorbell"
                                className="w-full px-4 h-[76px] bg-cultured border border-gray-200 rounded-md text-oxford-blue/60 text-sm focus:outline-none focus:ring-2 focus:ring-vivid-red"
                            />
                        </div>

                        {/* Buttons (Stacked) */}
                        <div className="mt-6 space-y-2">
                            <Button
                                fullWidth
                                variant="primary"
                                className="rounded-md h-[60px]"
                                onClick={handleSubmit}
                            >
                                Update
                            </Button>
                            <Button
                                fullWidth
                                variant="secondary"
                                className=" rounded-md h-[60px]"
                                onClick={handleClose}
                            >
                                Back
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}  