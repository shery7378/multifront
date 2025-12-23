// src/components/modals/InstructionModal.jsx
import React from 'react';
import Button from '@/components/UI/Button';
import ResponsiveText from '../UI/ResponsiveText';

export default function InstructionModal({ isOpen, onClose, onSave, initialInstruction, setInstructionInput }) {
    if (!isOpen) return null;

    const handleSave = () => {
        onSave(initialInstruction); // Pass the current instruction value to the parent
    };

    return (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <ResponsiveText as="h2" minSize="1rem" maxSize="1.375rem" className="font-semibold text-oxford-blue mb-4">Edit Delivery Instructions</ResponsiveText>

                <textarea
                    className="w-full p-2 border rounded-md text-oxford-blue focus:outline-none focus:ring-2 focus:ring-vivid-red text-sm"
                    rows="4"
                    value={initialInstruction}
                    onChange={(e) => setInstructionInput(e.target.value)}
                    placeholder="Enter delivery instructions"
                />
                <div className="flex justify-end gap-2 mt-4">
                    <Button
                        variant="secondary"
                        className="h-[60px] flex-1 rounded-md text-oxford-blue"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="rounded-md h-[60px] bg-vivid-red text-white flex-1"
                        onClick={handleSave}
                    >
                        Add
                    </Button>
                </div>
            </div>
        </div>
    );
}