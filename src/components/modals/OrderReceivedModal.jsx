//src/components/modals/OrderReceivedModal.jsx
'use client';
import React, { useState } from 'react';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import StoreAddReviewModal from './StoreAddReviewModal'; // Importing StoreAddReviewModal
import SubscriptionModal from '@/components/Subscriptions/SubscriptionModal';

export default function OrderReceivedModal({ isOpen, onClose, orderId, orderProducts }) {
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false); // State for Review Modal
    const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false); // State for Subscription Modal
    const [selectedProduct, setSelectedProduct] = useState(null);

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Order Receive "
                className="max-w-md p-0 pb-4"
                showCloseButton={true}
                titleClassName=""
            >
                <div className="grid h-full items-center gap-6">
                    <div className="flex flex-col gap-0">
                        <p className="text-base text-baltic-black font-medium">
                            Your Order has been delivered. Do you have suggestions or a review about the store?
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Button
                            fullWidth
                            variant="primary"
                            className="rounded-md h-[60px]"
                            onClick={() => {
                                onClose();
                                setIsReviewModalOpen(true)
                            }} // Open Review Modal
                        >
                            Add Review
                        </Button>
                        
                        {/* Show Subscribe option if order has products that support subscriptions */}
                        {orderProducts && orderProducts.length > 0 && orderProducts.some(p => p.product?.subscription_enabled) && (
                            <Button
                                fullWidth
                                variant="outline"
                                className="rounded-md h-[60px]"
                                onClick={() => {
                                    // Find first product that supports subscriptions
                                    const subProduct = orderProducts.find(p => p.product?.subscription_enabled);
                                    if (subProduct) {
                                        setSelectedProduct(subProduct.product);
                                        setIsSubscriptionModalOpen(true);
                                    }
                                }}
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Subscribe to This Product
                            </Button>
                        )}
                        
                        <Button
                            fullWidth
                            variant="secondary"
                            className="rounded-md h-[60px]"
                            onClick={onClose} // Close the current modal
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Render StoreAddReviewModal */}
            <StoreAddReviewModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                rating={0} // Default rating, can be adjusted
            />
            
            {/* Render SubscriptionModal */}
            {selectedProduct && (
                <SubscriptionModal
                    isOpen={isSubscriptionModalOpen}
                    onClose={() => {
                        setIsSubscriptionModalOpen(false);
                        setSelectedProduct(null);
                    }}
                    orderId={orderId}
                    productId={selectedProduct.id}
                    onSuccess={() => {
                        alert('Subscription created successfully!');
                        setIsSubscriptionModalOpen(false);
                        setSelectedProduct(null);
                    }}
                />
            )}
        </>
    );
}