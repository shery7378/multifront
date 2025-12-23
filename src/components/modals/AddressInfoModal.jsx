//src/components/modals/AddressInfoModal.jsx
'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/UI/Button';
import CloseXButton from '@/components/UI/CloseXButton';
import ResponsiveText from '@/components/UI/ResponsiveText';
import Input from '@/components/UI/Input'; // Imported Input component
import IconButton from '../UI/IconButton';
import { FaEdit } from "react-icons/fa";

// Placeholder image for map (replace with actual map API integration if needed)
const mapImage = '/images/map.jpg'; // Replace with actual map image or API
const shopingBag = '/images/shoping-bag.png';


export default function AddressInfoModal({ onClose }) {
    const [isVisible, setIsVisible] = useState(false);
    const [address, setAddress] = useState('High St N, London E12 6PH, UK');
    const [buildingType, setBuildingType] = useState('Other');
    const [aptSuite, setAptSuite] = useState('376');
    const [businessName, setBusinessName] = useState('Tower');
    const [postcode, setPostcode] = useState('E12 6PH');
    const [dropoffOption, setDropoffOption] = useState('meet_at_door');
    const [instructions, setInstructions] = useState('');
    const [addressLabel, setAddressLabel] = useState('');

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

    const handleSave = () => {
        console.log({
            address,
            buildingType,
            aptSuite,
            businessName,
            postcode,
            dropoffOption,
            instructions,
            addressLabel,
        });
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
                                minSize="1.25rem"
                                maxSize="2rem"
                                className="font-bold text-oxford-blue"
                            >
                                Address info
                            </ResponsiveText>
                            <CloseXButton onClick={handleClose} className="text-oxford-blue hover:text-vivid-red" />
                        </div>

                        {/* Map Section */}
                        <div className="mb-4">
                            <img src={mapImage} alt="Map" className="w-full h-36 object-cover rounded-md" />
                        </div>

                        {/* Address */}
                        <div className="mb-4">
                            <ResponsiveText
                                as="p"
                                minSize="1rem"
                                maxSize="1rem"
                                className="text-baltic-black font-medium"
                            >
                                {address}
                            </ResponsiveText>
                        </div>

                        {/* Building Type */}
                        <div className="mb-4">
                            <ResponsiveText
                                as="label"
                                minSize="0.75rem"
                                maxSize="0.875rem"
                                className="block text-baltic-black font-normal mb-1"
                            >
                                Building type
                            </ResponsiveText>
                            <select
                                value={buildingType}
                                onChange={(e) => setBuildingType(e.target.value)}
                                className="w-full px-4 py-2 h-[56px] rounded-md bg-input-bg border-gray-200 border bg-cultured border-input-border text-baltic-black placeholder:text-input-placeholder text-sm focus:outline-none focus:ring-2 focus:ring-vivid-red transition duration-200"
                            >
                                <option value="Other">Other</option>
                                <option value="Apartment">Apartment</option>
                                <option value="House">House</option>
                            </select>
                        </div>

                        {/* Apt/Suite/Floor */}
                        <div className="mb-4">
                            <Input
                                label="Apt / Suite / Floor"
                                name="aptSuite"
                                value={aptSuite}
                                onChange={(e) => setAptSuite(e.target.value)}
                                placeholder="Enter apt/suite/floor"
                                labelClassName="text-baltic-black"
                                inputClassName="border-gray-200 bg-cultured h-[56px]"
                            />
                        </div>

                        {/* Business/Building Name */}
                        <div className="mb-4">
                            <Input
                                label="Business / Building name"
                                name="businessName"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                placeholder="Enter business/building name"
                                labelClassName="text-baltic-black"
                                inputClassName="border-gray-200 bg-cultured h-[56px]"
                            />
                        </div>

                        {/* Postcode */}
                        <div className="mb-4">
                            <Input
                                label="Postcode"
                                name="postcode"
                                value={postcode}
                                onChange={(e) => setPostcode(e.target.value)}
                                placeholder="Enter postcode"
                                labelClassName="text-baltic-black"
                                inputClassName="border-gray-200 bg-cultured h-[56px]"
                            />
                        </div>

                        {/* Dropoff Options */}
                        <div className="mb-4">
                            <ResponsiveText
                                as="p"
                                minSize="1.25rem"
                                maxSize="1.25rem"
                                className="font-medium text-oxford-blue mb-2"
                            >
                                Dropoff options
                            </ResponsiveText>

                            <div className="flex justify-between items-center my-3">
                                <div className="flex items-center gap-2">
                                    <img
                                        src={shopingBag}
                                        alt="Delivery person"
                                        className="w-12 h-12 object-cover"
                                    />
                                    <div className="flex flex-col justify-center">
                                        <h6 className="font-semibold text-baltic-black leading-tight">
                                            Meet at my door
                                        </h6>
                                        <div className="">
                                            <span className="text-vivid-red text-[6.21px] font-medium bg-jasper/20 rounded-xl px-2 py-1">
                                                More options available
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <IconButton icon={FaEdit} iconClasses="!w-4 !h-4" />
                            </div>

                        </div>

                        {/* Instructions for Delivery Person */}
                        <div className="mb-4">
                            <Input
                                label="Instructions for delivery person"
                                name="instructions"
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                placeholder="Example: please knock instead of using the doorbell"
                                labelClassName="text-baltic-black"
                                inputClassName="border-gray-200 bg-cultured h-[76px]"
                            />
                        </div>

                        {/* Address Label */}
                        <div className="mb-4">
                            <Input
                                label="Address Label"
                                name="addressLabel"
                                value={addressLabel}
                                onChange={(e) => setAddressLabel(e.target.value)}
                                placeholder="Add a label (e.g. school)"
                                labelClassName="text-baltic-black"
                                inputClassName="border-gray-200 bg-cultured h-[56px]"
                            />
                        </div>

                        {/* Buttons (Stacked) */}
                        <div className="mt-6 space-y-2">
                            <Button
                                fullWidth
                                variant="primary"
                                className="bg-vivid-red rounded-md h-[60px]"
                                onClick={handleSave}
                            >
                                Save
                            </Button>
                            <Button
                                fullWidth
                                variant="secondary"
                                className=" text-oxford-blue rounded-md h-[60px]"
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