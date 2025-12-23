//src/components/modals/AddCardModal.jsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import Select from '@/components/UI/Select';

export default function AddCardModal({ isOpen, onClose, onSuccess }) {
    const [cardholderName, setCardholderName] = useState('');
    const [country, setCountry] = useState('US');
    
    // Stripe Elements state
    const [stripe, setStripe] = useState(null);
    const [elements, setElements] = useState(null);
    const [cardElement, setCardElement] = useState(null);
    const cardElementRef = useRef(null);
    const stripeLoadedRef = useRef(false);
    
    // Form state
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [stripeError, setStripeError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // Sample countries for the select dropdown
    const countryOptions = [
        { value: 'US', label: 'US' },
        { value: 'UK', label: 'UK' },
        { value: 'PK', label: 'Pakistan' },
        { value: 'CA', label: 'Canada' },
        { value: 'AU', label: 'Australia' },
        { value: 'GB', label: 'United Kingdom' },
        { value: 'DE', label: 'Germany' },
        { value: 'FR', label: 'France' },
        { value: 'IT', label: 'Italy' },
        { value: 'ES', label: 'Spain' },
    ];

    // Load Stripe.js when modal opens
    useEffect(() => {
        if (isOpen && !stripeLoadedRef.current) {
            loadStripe();
        }
    }, [isOpen]);

    // Initialize Stripe Elements when Stripe is loaded
    useEffect(() => {
        if (stripe && isOpen && !cardElement) {
            // Small delay to ensure DOM is ready
            const timer = setTimeout(() => {
                if (cardElementRef.current) {
                    initializeStripeElements();
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [stripe, isOpen]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    const loadStripe = async () => {
        if (typeof window === 'undefined') return;

        try {
            // Check if Stripe.js is already loaded
            if (window.Stripe) {
                const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
                if (!stripeKey) {
                    setSubmitError('Stripe publishable key not configured. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your environment variables.');
                    return;
                }
                setStripe(window.Stripe(stripeKey));
                stripeLoadedRef.current = true;
                return;
            }

            // Load Stripe.js from CDN
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.async = true;
            document.head.appendChild(script);

            await new Promise((resolve, reject) => {
                script.onload = () => {
                    const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
                    if (!stripeKey) {
                        setSubmitError('Stripe publishable key not configured. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your environment variables.');
                        reject(new Error('Stripe key not configured'));
                        return;
                    }
                    setStripe(window.Stripe(stripeKey));
                    stripeLoadedRef.current = true;
                    resolve();
                };
                script.onerror = () => {
                    setSubmitError('Failed to load Stripe.js. Please check your internet connection.');
                    reject(new Error('Failed to load Stripe.js'));
                };
            });
        } catch (error) {
            console.error('Error loading Stripe:', error);
            setSubmitError('Failed to initialize payment processing. Please try again.');
        }
    };

    const initializeStripeElements = () => {
        if (!stripe || !cardElementRef.current) return;

        try {
            const elementsInstance = stripe.elements();
            setElements(elementsInstance);

            // Create and mount the card element
            const cardElementInstance = elementsInstance.create('card', {
                style: {
                    base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                            color: '#aab7c4',
                        },
                    },
                    invalid: {
                        color: '#9e2146',
                    },
                },
            });

            cardElementInstance.mount(cardElementRef.current);
            setCardElement(cardElementInstance);

            // Listen for errors
            cardElementInstance.on('change', (event) => {
                if (event.error) {
                    setStripeError(event.error.message);
                } else {
                    setStripeError(null);
                }
            });
        } catch (error) {
            console.error('Error initializing Stripe Elements:', error);
            setSubmitError('Failed to initialize card input. Please try again.');
        }
    };

    const resetForm = () => {
        setCardholderName('');
        setCountry('US');
        setErrors({});
        setSubmitError('');
        setStripeError(null);
        setSuccessMessage('');
        
        // Unmount card element if it exists
        if (cardElement) {
            try {
                cardElement.unmount();
            } catch (error) {
                console.error('Error unmounting card element:', error);
            }
            setCardElement(null);
        }
        setElements(null);
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        // Validate cardholder name
        if (!cardholderName.trim()) {
            newErrors.cardholderName = 'Cardholder name is required';
        } else if (cardholderName.trim().length < 2) {
            newErrors.cardholderName = 'Cardholder name must be at least 2 characters';
        }

        // Stripe Elements handles card validation, but check if there's a Stripe error
        if (stripeError) {
            newErrors.card = stripeError;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');
        setStripeError(null);

        if (!validateForm()) {
            return;
        }

        if (!stripe || !cardElement) {
            setSubmitError('Payment processing is not ready. Please wait a moment and try again.');
            return;
        }

        setIsLoading(true);

        try {
            // Create payment method using Stripe Elements
            console.log('Creating payment method with Stripe Elements...');
            const { paymentMethod, error: createError } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
                billing_details: {
                    name: cardholderName.trim(),
                    address: {
                        country: country,
                    },
                },
            });

            if (createError) {
                console.error('Stripe payment method creation error:', createError);
                setStripeError(createError.message);
                setIsLoading(false);
                return;
            }

            if (!paymentMethod || !paymentMethod.id) {
                console.error('Payment method creation failed - no payment method returned');
                throw new Error('Failed to create payment method. Please try again.');
            }

            console.log('Payment method created successfully:', paymentMethod.id);

            // Get API base URL
            const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
            
            // Get auth token from localStorage
            const token = typeof window !== 'undefined' 
                ? localStorage.getItem('token') || localStorage.getItem('auth_token') 
                : null;

            // Send payment method token to backend
            const cardData = {
                payment_method_token: paymentMethod.id,
                cardholder_name: cardholderName.trim(),
                country: country,
            };

            console.log('Sending payment method to backend:', {
                payment_method_token: paymentMethod.id,
                has_token: !!paymentMethod.id,
            });

            // Make API call to save payment method
            const response = await fetch(`${apiBase}/api/payment-methods`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
                credentials: 'include',
                body: JSON.stringify(cardData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to save payment method');
            }

            // Show success message
            setSuccessMessage('Payment method added successfully!');
            
            // Call onSuccess callback if provided
            if (onSuccess) {
                onSuccess(data);
            }

            // Wait 2 seconds to show success message, then close modal
            setTimeout(() => {
                resetForm();
                setSuccessMessage('');
                onClose();
            }, 2000);

        } catch (error) {
            console.error('Error saving payment method:', error);
            setSubmitError(error.message || 'Failed to save payment method. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add credit or debit card"
            className="max-w-md p-0 pb-4"
            showCloseButton={true}
            titleClassName="text-oxford-blue font-bold py-2 px-6"
        >
            <form onSubmit={handleSubmit}>
                <div className="grid h-full items-center gap-4 p-4">
                    <div className="flex flex-col gap-4">
                        {/* Success message */}
                        {successMessage && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                <p className="text-sm text-green-600 font-medium">{successMessage}</p>
                            </div>
                        )}
                        
                        {/* Error message */}
                        {submitError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-600">{submitError}</p>
                            </div>
                        )}

                        {/* Cardholder Name */}
                        <div>
                            <Input
                                label="Cardholder Name"
                                name="cardholderName"
                                value={cardholderName}
                                onChange={(e) => {
                                    setCardholderName(e.target.value);
                                    if (errors.cardholderName) {
                                        setErrors(prev => ({ ...prev, cardholderName: '' }));
                                    }
                                }}
                                placeholder="Cardholder Name"
                                disabled={!!successMessage}
                                className=""
                                inputClassName={`p-2 h-14 border bg-ghost-white rounded-md text-base text-baltic-black ${
                                    errors.cardholderName ? 'border-red-500' : 'border-gray-200'
                                } ${successMessage ? 'opacity-50 cursor-not-allowed' : ''}`}
                                labelClassName="text-baltic-black text-sm font-normal"
                            />
                            {errors.cardholderName && (
                                <p className="text-red-500 text-xs mt-1">{errors.cardholderName}</p>
                            )}
                        </div>

                        {/* Country */}
                        <div>
                            <Select
                                label="Country"
                                name="country"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                placeholder="Select Country"
                                disabled={!!successMessage}
                                className=""
                                selectClassName={successMessage ? 'opacity-50 cursor-not-allowed' : ''}
                                labelClassName="text-baltic-black text-sm font-normal"
                                options={countryOptions}
                            />
                        </div>

                        {/* Stripe Card Element */}
                        <div>
                            <label className="text-baltic-black text-sm font-normal mb-2 block">
                                Card Details
                            </label>
                            <div
                                ref={cardElementRef}
                                className={`p-2 h-14 border bg-ghost-white rounded-md ${
                                    errors.card || stripeError ? 'border-red-500' : 'border-gray-200'
                                }`}
                                id="card-element"
                            />
                            {(errors.card || stripeError) && (
                                <p className="text-red-500 text-xs mt-1">{errors.card || stripeError}</p>
                            )}
                            <p className="text-gray-500 text-xs mt-1">
                                Your card details are securely processed by Stripe
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Button
                            type="submit"
                            fullWidth
                            variant="primary"
                            className="rounded-md h-[60px] bg-vivid-red text-white"
                            isLoading={isLoading || !!successMessage}
                            disabled={isLoading || !!successMessage}
                        >
                            {successMessage ? 'Success!' : 'Add Card'}
                        </Button>
                        <Button
                            type="button"
                            fullWidth
                            variant="secondary"
                            className="rounded-md h-[60px] bg-gray-200 text-baltic-black"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}