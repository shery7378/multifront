//src/components/Payment.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { MdWallet } from "react-icons/md";
import { FaFileInvoiceDollar } from "react-icons/fa6";
import { FaRegEdit } from 'react-icons/fa';
import AddPaymentMethodModal from '@/components/modals/AddPaymentMethodModal';
import { useSelector } from 'react-redux';
import { useGetRequest } from '@/controller/getRequests';
import IconButton from './UI/IconButton';
import ResponsiveText from './UI/ResponsiveText';

export default function Payment({ onPaymentMethodSelect, selectedPaymentMethodId, onPaymentMethodTypeSelect, selectedPaymentMethodType }) {
    const [isOpen, setIsOpen] = useState(false);
    const { isAuthenticated } = useSelector((state) => state.auth);
    const { data: paymentMethodsData, loading, sendGetRequest } = useGetRequest();
    const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
    const [selectedMethod, setSelectedMethod] = useState(selectedPaymentMethodId || null);
    const [pendingSelection, setPendingSelection] = useState(null); // Track payment method to auto-select after refresh
    // Fetch saved payment methods if authenticated
    useEffect(() => {
        if (isAuthenticated) {
            sendGetRequest('/payment-methods', true, { suppressAuthErrors: true });
        }
    }, [isAuthenticated]);

    // Handle payment method selection (saved cards)
    const handleMethodSelect = useCallback((methodId) => {
        setSelectedMethod(methodId);
        if (onPaymentMethodSelect) {
            onPaymentMethodSelect(methodId);
        }
        // Clear payment method type when selecting a saved card
        if (onPaymentMethodTypeSelect) {
            onPaymentMethodTypeSelect('stripe');
        }
    }, [onPaymentMethodSelect, onPaymentMethodTypeSelect]);

    // Handle payment gateway selection (PayPal, etc.)
    const handleGatewaySelect = useCallback((gatewayType, gatewayMethod) => {
        setSelectedMethod(null); // Clear saved payment method
        if (onPaymentMethodSelect) {
            onPaymentMethodSelect(null);
        }
        if (onPaymentMethodTypeSelect) {
            onPaymentMethodTypeSelect(gatewayType);
        }
    }, [onPaymentMethodSelect, onPaymentMethodTypeSelect]);

    // Update saved payment methods when data changes
    useEffect(() => {
        // Handle different response structures
        let methods = [];
        if (paymentMethodsData?.data) {
            // Check if data is an array or has a payment_methods property
            if (Array.isArray(paymentMethodsData.data)) {
                methods = paymentMethodsData.data;
            } else if (paymentMethodsData.data.payment_methods && Array.isArray(paymentMethodsData.data.payment_methods)) {
                methods = paymentMethodsData.data.payment_methods;
            } else if (paymentMethodsData.payment_methods && Array.isArray(paymentMethodsData.payment_methods)) {
                methods = paymentMethodsData.payment_methods;
            }
        } else if (paymentMethodsData?.payment_methods && Array.isArray(paymentMethodsData.payment_methods)) {
            methods = paymentMethodsData.payment_methods;
        }
        
        setSavedPaymentMethods(methods);
        
        // Auto-select pending payment method if it exists in the list
        if (pendingSelection && methods.length > 0) {
            console.log('Checking for pending payment method selection:', pendingSelection);
            console.log('Available payment methods:', methods.map(m => ({ 
                id: m.id, 
                stripe_pm_id: m.stripe_payment_method_id,
                stripe_id: m.stripe_id 
            })));
            
            if (pendingSelection === 'NEWEST') {
                // Select the first (newest) payment method if we couldn't get the ID
                const newestMethod = methods[0]; // Assuming first is newest
                console.log('Auto-selecting newest payment method:', newestMethod.id);
                handleMethodSelect(newestMethod.id);
                setPendingSelection(null);
            } else {
                // Try to match by database ID first
                let matchedMethod = methods.find(method => method.id === pendingSelection);
                
                // If not found, try to match by Stripe payment method ID
                if (!matchedMethod) {
                    matchedMethod = methods.find(method => 
                        method.stripe_payment_method_id === pendingSelection ||
                        method.stripe_id === pendingSelection ||
                        method.payment_method_id === pendingSelection
                    );
                }
                
                if (matchedMethod) {
                    console.log('Auto-selecting payment method by ID:', matchedMethod.id);
                    handleMethodSelect(matchedMethod.id);
                    setPendingSelection(null);
                } else {
                    // If not found but we have methods, select the first/newest one as fallback
                    console.log('Payment method not found by ID, selecting newest as fallback:', methods[0].id);
                    handleMethodSelect(methods[0].id);
                    setPendingSelection(null);
                }
            }
        } else if (pendingSelection && methods.length === 0) {
            // List is empty, keep pending selection for next refresh
            console.log('Payment methods list is empty, waiting for refresh...');
        }
    }, [paymentMethodsData, pendingSelection, handleMethodSelect]);

    // Update selected method when prop changes
    useEffect(() => {
        if (selectedPaymentMethodId !== undefined) {
            setSelectedMethod(selectedPaymentMethodId);
        }
    }, [selectedPaymentMethodId]);

    // Refresh payment methods after adding new one and auto-select it
    const handlePaymentMethodAdded = (newPaymentMethodData) => {
        if (isAuthenticated) {
            console.log('Payment method added, full response:', newPaymentMethodData);
            console.log('payment_method object:', newPaymentMethodData?.payment_method);
            
            // Extract the Stripe payment method ID from the response
            const paymentMethodObj = newPaymentMethodData?.payment_method || newPaymentMethodData?.data || newPaymentMethodData;
            const stripePaymentMethodId = paymentMethodObj?.id; // This is the Stripe ID (pm_xxx)
            
            console.log('Stripe payment method ID:', stripePaymentMethodId);
            
            // Store both the Stripe ID for matching and set flag to select newest if needed
            if (stripePaymentMethodId) {
                // Store the Stripe ID - we'll match by this or select newest
                setPendingSelection(stripePaymentMethodId);
            } else {
                // If we can't get the ID, we'll select the first/newest payment method after refresh
                console.warn('Could not extract payment method ID. Will select newest payment method after refresh.');
                setPendingSelection('NEWEST');
            }
            
            // Refresh payment methods list with retries to handle timing issues
            // The useEffect will automatically handle matching when data arrives
            setTimeout(() => {
                sendGetRequest('/payment-methods', true, { suppressAuthErrors: true });
            }, 500);
            
            // Retry after 1.5s and 3s if list is still empty (handled by useEffect)
            setTimeout(() => {
                sendGetRequest('/payment-methods', true, { suppressAuthErrors: true });
            }, 1500);
            
            setTimeout(() => {
            sendGetRequest('/payment-methods', true, { suppressAuthErrors: true });
            }, 3000);
        }
    };

    return (
        <>
            <div className="p-4 bg-white rounded-lg shadow">
                <ResponsiveText as="h2" minSize="1rem" maxSize="1.375rem" className="font-semibold text-oxford-blue my-3">Payment</ResponsiveText>

                {/* Saved Payment Methods - Show if authenticated and has saved methods */}
                {isAuthenticated && savedPaymentMethods.length > 0 && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-oxford-blue mb-2">
                            Saved Payment Methods
                        </label>
                        <div className="space-y-2">
                            {savedPaymentMethods.map((method) => (
                                <label
                                    key={method.id}
                                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                                        selectedMethod === method.id
                                            ? 'border-vivid-red bg-red-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="saved-payment"
                                        value={method.id}
                                        checked={selectedMethod === method.id}
                                        onChange={() => handleMethodSelect(method.id)}
                                        className="mr-3"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-sm text-oxford-blue">
                                            {(() => {
                                                // Debug: Log the method object to see what fields are available
                                                if (process.env.NODE_ENV === 'development') {
                                                    console.log('Payment method object:', method);
                                                }
                                                
                                                // Try multiple possible field names for card brand
                                                const cardBrand = method.card_brand || method.brand || method.card_type || method.type || 'Card';
                                                
                                                // Try multiple possible field names for last 4 digits
                                                const lastFour = method.last_four || 
                                                               method.last4 || 
                                                               method.last_4 ||
                                                               method.lastFour ||
                                                               method.card_last_four ||
                                                               method.card_last4 ||
                                                               (method.card && method.card.last4) ||
                                                               (method.card && method.card.last_four) ||
                                                               null;
                                                
                                                if (lastFour) {
                                                    return `${cardBrand} •••• ${lastFour}`;
                                                }
                                                return `${cardBrand} •••• ****`;
                                            })()}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                            {(() => {
                                                // Try multiple possible field names for expiry month
                                                const expMonth = method.exp_month || 
                                                               method.expMonth || 
                                                               method.expiry_month ||
                                                               method.expiryMonth ||
                                                               (method.card && method.card.exp_month) ||
                                                               (method.card && method.card.expMonth) ||
                                                               null;
                                                // Try multiple possible field names for expiry year
                                                const expYear = method.exp_year || 
                                                              method.expYear || 
                                                              method.expiry_year ||
                                                              method.expiryYear ||
                                                              (method.card && method.card.exp_year) ||
                                                              (method.card && method.card.expYear) ||
                                                              null;
                                                
                                                // Format year - if it's 2 digits, assume 20xx, if 4 digits use as is
                                                let formattedYear = null;
                                                if (expYear) {
                                                    const yearStr = String(expYear);
                                                    formattedYear = yearStr.length === 2 ? `20${yearStr}` : yearStr;
                                                }
                                                
                                                // Format month - ensure 2 digits
                                                const formattedMonth = expMonth 
                                                    ? String(expMonth).padStart(2, '0')
                                                    : null;
                                                
                                                if (formattedMonth && formattedYear) {
                                                    return `Expires ${formattedMonth}/${String(formattedYear).slice(-2)}`;
                                                }
                                                return 'Expiry date not available';
                                            })()}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                            Or add a new payment method below
                        </div>
                        <hr className="my-4 text-bright-gray" />
                    </div>
                )}


                {/* Add Payment Method */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <IconButton icon={MdWallet} iconClasses="!w-4 !h-4" />
                        <div>
                            <h6 className="font-semibold text-oxford-blue text-sm">Add Payment method</h6>
                        </div>
                    </div>
                    <IconButton
                        icon={FaRegEdit}
                        onClick={() => setIsOpen(true)}
                        className="hover:bg-vivid-red group transition-colors duration-300"
                        iconClasses="!w-4 !h-4 group-hover:text-white group-hover:transition-colors group-hover:duration-300"
                    />
                </div>
                <hr className="my-4 text-bright-gray" />
                
                {/* Request Invoice */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <IconButton icon={FaFileInvoiceDollar} iconClasses="!w-4 !h-4" />
                        <div>
                            <h6 className="font-semibold text-oxford-blue text-sm">Request an Invoice</h6>
                            <h5 className="text-sonic-silver text-xs">Add tax details</h5>
                        </div>
                    </div>
                    <IconButton icon={FaRegEdit} iconClasses="!w-4 !h-4" />
                </div>
            </div>
            <AddPaymentMethodModal 
                isOpen={isOpen} 
                onClose={() => setIsOpen(false)}
                onSuccess={handlePaymentMethodAdded}
                onPaymentMethodSelect={onPaymentMethodSelect}
                onPaymentMethodTypeSelect={onPaymentMethodTypeSelect}
                selectedPaymentMethodType={selectedPaymentMethodType}
            />
        </>
    );
}
