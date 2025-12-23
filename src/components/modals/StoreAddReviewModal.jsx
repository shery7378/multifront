//src/components/modals/StoreAddReviewModal.jsx
'use client';
import React, { useState } from 'react';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import TextArea from '@/components/UI/TextArea';
import { StarIcon } from '@heroicons/react/24/solid';

export default function StoreAddReviewModal({ isOpen, onClose, rating = 0 }) {
    const [promoCode, setPromoCode] = useState('Enter promo code');
    const [text, setText] = useState('');

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="MC Donalds"
            className="max-w-md p-0 pb-4"
            showCloseButton={true}
            titleClassName="pt-4"
        >
            <div className="grid h-full items-center gap-6">
                <div className="flex flex-col gap-0">
                    {/* Rating Stars */}
                    <div className="flex space-x-1">
                        {Array.from({ length: 5 }, (_, index) => (
                            <StarIcon
                                key={index}
                                className={`w-6 h-6 ${index < rating ? 'text-yellow-500' : 'text-gray-300'}`}
                            />
                        ))}
                    </div>
                    {/* TextArea for Comment */}
                    <TextArea
                        label="Do you want to write a comment?"
                        name="shortDesc"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Enter short text"
                        rows={3}
                        className="mt-4"
                        labelClassName="text-sm text-baltic-black"
                        textareaClassName="border-2"
                    />
                </div>

                <div className="">
                    <Button fullWidth variant="primary" className="rounded-md h-[60px]">
                        Submit Review
                    </Button>
                </div>
            </div>
        </Modal>
    );
}