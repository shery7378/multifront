//src/components/modals/AddPaymentMethodModal.jsx
'use client';
import React, { useState, useEffect } from 'react';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import RadioButton from '@/components/UI/RadioButton';
import AddCardModal from './AddCardModal'; // Importing AddCardModal
import axios from 'axios';

export default function AddPaymentMethodModal({ 
    isOpen, 
    onClose, 
    onSuccess,
    onPaymentMethodSelect,
    onPaymentMethodTypeSelect,
    selectedPaymentMethodType
}) {
    const [selectedMethod, setSelectedMethod] = useState();
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [infoMessage, setInfoMessage] = useState(null);

    // Fetch active payment methods from API
    useEffect(() => {
        if (isOpen) {
            fetchActivePaymentMethods();
            // Reset state when modal opens
            setInfoMessage(null);
            // Don't reset selectedMethod - keep it synced with selectedPaymentMethodType
        }
    }, [isOpen]);

    // Sync selectedMethod with selectedPaymentMethodType prop
    useEffect(() => {
        if (selectedPaymentMethodType) {
            // Find the method that matches the selected type
            const matchingMethod = paymentMethods.find(
                m => m.payment_method === selectedPaymentMethodType || m.value === selectedPaymentMethodType
            );
            if (matchingMethod) {
                setSelectedMethod(matchingMethod.value || matchingMethod.payment_method);
            }
        }
    }, [selectedPaymentMethodType, paymentMethods]);

    const fetchActivePaymentMethods = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/payment-methods/active`
            );

            if (response.data.success && response.data.data) {
                setPaymentMethods(response.data.data);
            } else {
                setError('Failed to load payment methods');
                // Fallback to empty array
                setPaymentMethods([]);
            }
        } catch (err) {
            console.error('Error fetching active payment methods:', err);
            setError('Failed to load payment methods');
            // Fallback to empty array
            setPaymentMethods([]);
        } finally {
            setLoading(false);
        }
    };

    const handleMethodSelect = (method) => {
        setSelectedMethod(method.value);
        
        // If it's a credit card method (stripe), open the AddCardModal
        if (method.value === 'credit' || method.payment_method === 'stripe') {
            onClose();
            setIsCardModalOpen(true);
        } else {
            // For PayPal and other payment gateways (Klarna, Afterpay, etc.)
            // Select them as payment method type and close the modal
            if (onPaymentMethodTypeSelect) {
                onPaymentMethodTypeSelect(method.payment_method);
            }
            if (onPaymentMethodSelect) {
                onPaymentMethodSelect(null); // Clear saved payment method when selecting gateway
            }
            onClose(); // Close the modal after selection
        }
    };

    // Helper function to get logo image path
    const getLogoPath = (logoName) => {
        const logoMap = {
            'visa': '/images/visa.png',
            'mastercard': '/images/mastercard.png',
            'klarna': '/images/klarna.png',
            'afterpay': '/images/afterpay.png',
            'paypal': '/images/paypal.png',
            'razorpay': '/images/razorpay.png',
            'kalara': '/images/kalara.png',
            'addpay': '/images/addpay.png',
        };
        return logoMap[logoName] || null;
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Add Payment Method"
                className="max-w-md p-0 pb-4"
                showCloseButton={true}
                titleClassName="text-oxford-blue font-bold py-2 px-6"
            >
                <div className="grid h-full items-center gap-4 p-4">
                    {loading ? (
                        <div className="text-center py-4">
                            <p className="text-gray-500">Loading payment methods...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-4">
                            <p className="text-red-500">{error}</p>
                        </div>
                    ) : paymentMethods.length === 0 ? (
                        <div className="text-center py-4">
                            <p className="text-gray-500">No payment methods available</p>
                        </div>
                    ) : infoMessage ? (
                        <div className="flex flex-col gap-4">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                                <h3 className="text-base font-semibold text-blue-900 mb-2">
                                    {infoMessage.title}
                                </h3>
                                <p className="text-sm text-blue-800 mb-4">
                                    {infoMessage.message}
                                </p>
                                <Button
                                    onClick={() => {
                                        setInfoMessage(null);
                                        setSelectedMethod(null);
                                    }}
                                    variant="primary"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    Got it
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {paymentMethods.map((method) => {
                                const isSelected = selectedMethod === method.value || 
                                                  selectedMethod === method.payment_method ||
                                                  selectedPaymentMethodType === method.payment_method;
                                return (
                                <div
                                    key={method.id}
                                    className={`flex items-center h-13 p-2 border rounded-md bg-white hover:bg-gray-50 transition-colors ${
                                        isSelected ? 'border-vivid-red bg-red-50' : 'border-gray-200'
                                    }`}
                                >
                                    <RadioButton
                                        label={method.display_name}
                                        value={method.value || method.payment_method}
                                        name="paymentMethod"
                                        checked={isSelected}
                                        onChange={() => handleMethodSelect(method)}
                                        labelClassName="text-[15px] text-baltic-black font-medium"
                                        size="md"
                                    />
                                    <div className="ml-auto flex items-center space-x-2">
                                        {method.logos && method.logos.length > 0 ? (
                                            method.logos.map((logo, index) => {
                                                const logoPath = getLogoPath(logo);
                                                if (logoPath) {
                                                    return (
                                                        <img
                                                            key={index}
                                                            src={logoPath}
                                                            alt={logo}
                                                            className={
                                                                logo === 'visa' ? 'w-9 h-4' :
                                                                logo === 'mastercard' ? 'w-6 h-4' :
                                                                logo === 'klarna' ? 'w-18 h-5' :
                                                                logo === 'afterpay' ? 'w-21 h-4' :
                                                                'w-auto h-5'
                                                            }
                                                            onError={(e) => {
                                                                // Hide broken images
                                                                e.target.style.display = 'none';
                                                            }}
                                                        />
                                                    );
                                                }
                                                return null;
                                            })
                                        ) : (
                                            <span className="text-xs text-gray-500">{method.display_name}</span>
                                        )}
                                    </div>
                                </div>
                            );
                            })}
                        </div>
                    )}
                </div>
            </Modal>

            {/* Render AddCardModal */}
            <AddCardModal
                isOpen={isCardModalOpen}
                onClose={() => {
                    setIsCardModalOpen(false);
                    onClose(); // Also close the parent modal
                }}
                onSuccess={(data) => {
                    // Refresh payment methods or show success
                    console.log('Payment method added successfully:', data);
                    // Call onSuccess callback if provided
                    if (onSuccess) {
                        onSuccess(data);
                    }
                }}
            />
        </>
    );
}