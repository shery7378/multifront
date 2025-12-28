//src/components/modals/AddressesModal.jsx
import React, { useState, useEffect, useLayoutEffect } from 'react';
import Button from '@/components/UI/Button';
import ResponsiveText from '../UI/ResponsiveText';

export default function AddressesModal({ isOpen, onClose, onSelect, onAddAddress, addresses, selectedAddress, loading, error }) {
    const [isAddFormOpen, setIsAddFormOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        country: '',
        state: '',
        city: '',
        postal_code: '',
        address_line_1: '',
    });
    const [validationErrors, setValidationErrors] = useState({});

    // Pre-fill form with selected address when form opens - use useLayoutEffect for immediate update
    useLayoutEffect(() => {
        if (isAddFormOpen) {
            if (selectedAddress) {
                console.log('Pre-filling form with selected address:', selectedAddress);
                const newFormData = {
                    name: selectedAddress.name || selectedAddress.first_name || '',
                    phone: selectedAddress.phone || selectedAddress.phone_number || '',
                    country: selectedAddress.country || '',
                    state: selectedAddress.state || selectedAddress.province || '',
                    city: selectedAddress.city || '',
                    postal_code: selectedAddress.postal_code || selectedAddress.zip || selectedAddress.postcode || '',
                    address_line_1: selectedAddress.address_line_1 || selectedAddress.address_1 || selectedAddress.street_address || '',
                };
                console.log('Setting form data to:', newFormData);
                setFormData(newFormData);
            } else {
                // Reset form if no selected address
                console.log('No selected address, resetting form');
                setFormData({
                    name: '',
                    phone: '',
                    country: '',
                    state: '',
                    city: '',
                    postal_code: '',
                    address_line_1: '',
                });
            }
        }
    }, [isAddFormOpen, selectedAddress]);

    // Also pre-fill when selectedAddress changes while form is open
    useEffect(() => {
        if (isAddFormOpen && selectedAddress) {
            console.log('Selected address changed while form is open, updating form:', selectedAddress);
            const updatedFormData = {
                name: selectedAddress.name || selectedAddress.first_name || '',
                phone: selectedAddress.phone || selectedAddress.phone_number || '',
                country: selectedAddress.country || '',
                state: selectedAddress.state || selectedAddress.province || '',
                city: selectedAddress.city || '',
                postal_code: selectedAddress.postal_code || selectedAddress.zip || selectedAddress.postcode || '',
                address_line_1: selectedAddress.address_line_1 || selectedAddress.address_1 || selectedAddress.street_address || '',
            };
            console.log('Updating form data to:', updatedFormData);
            setFormData(updatedFormData);
        }
    }, [selectedAddress, isAddFormOpen]);

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear validation error for this field when user starts typing
        if (validationErrors[name]) {
            setValidationErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleAddFormSubmit = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        console.log('handleAddFormSubmit called', formData);
        
        // Clear previous errors
        setValidationErrors({});
        
        // Create a flag to track if submission was successful
        let success = false;
        
        const handleSuccess = () => {
            success = true;
            setFormData({
                name: '',
                phone: '',
                country: '',
                state: '',
                city: '',
                postal_code: '',
                address_line_1: '',
            });
            setIsAddFormOpen(false);
        };
        
        // Pass both setValidationErrors and handleSuccess
        try {
            await onAddAddress(formData, setValidationErrors, handleSuccess);
        } catch (error) {
            console.error('Error in handleAddFormSubmit:', error);
        }
    };

    const handleAddFormClose = () => {
        setIsAddFormOpen(false);
        setValidationErrors({});
        // Reset form data when closing - useEffect will pre-fill when form opens again
        setFormData({
            name: '',
            phone: '',
            country: '',
            state: '',
            city: '',
            postal_code: '',
            address_line_1: '',
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <ResponsiveText as="h2" minSize="1rem" maxSize="1.375rem" className="font-semibold text-oxford-blue mb-4">Select Address</ResponsiveText>

                {loading ? (
                    <p className="text-oxford-blue/60">Loading addresses...</p>
                ) : error ? (
                    <p className="text-oxford-blue/60">{error.message || 'Error loading addresses'}</p>
                ) : addresses.length === 0 ? (
                    <p className="text-oxford-blue/60">No addresses available</p>
                ) : (
                    <ul className="space-y-2 max-h-64 overflow-y-auto">
                        {addresses.map((address) => (
                            <li
                                key={address.id}
                                className={`p-2 border rounded-md cursor-pointer hover:bg-gray-100 ${selectedAddress?.id === address.id ? 'border-vivid-red border-2' : 'border-gray-200'
                                    }`}
                                onClick={() => {
                                    console.log('Address selected from list:', address);
                                    onSelect(address);
                                    // If form is open, update it with the selected address
                                    if (isAddFormOpen) {
                                        const newFormData = {
                                            name: address.name || address.first_name || '',
                                            phone: address.phone || address.phone_number || '',
                                            country: address.country || '',
                                            state: address.state || address.province || '',
                                            city: address.city || '',
                                            postal_code: address.postal_code || address.zip || address.postcode || '',
                                            address_line_1: address.address_line_1 || address.address_1 || address.street_address || '',
                                        };
                                        console.log('Updating form with selected address:', newFormData);
                                        setFormData(newFormData);
                                    }
                                }}
                            >
                                <h6 className="font-semibold text-oxford-blue text-sm">
                                    {address.label || ''}
                                </h6>
                                <h6 className="font-medium text-oxford-blue text-sm">
                                    <span>{address.name ? `${address.name}, ` : ''}</span>
                                    {address.postal_code},
                                </h6>
                                <p className="text-sonic-silver text-xs">
                                    {address.address_line_1}
                                    {address.address_line_2 ? `, ${address.address_line_2}` : ''},
                                    {address.city}, {address.country}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
                <div className="flex justify-between mt-4">
                    <Button
                        className="rounded-md h-[60px] bg-vivid-red text-white flex-1 mr-2"
                        onClick={() => {
                            console.log('Add New Address clicked');
                            console.log('selectedAddress prop:', selectedAddress);
                            console.log('selectedAddress type:', typeof selectedAddress);
                            console.log('selectedAddress keys:', selectedAddress ? Object.keys(selectedAddress) : 'null');
                            
                            // Pre-fill form immediately when button is clicked (before state update)
                            if (selectedAddress) {
                                const prefillData = {
                                    name: selectedAddress.name || selectedAddress.first_name || '',
                                    phone: selectedAddress.phone || selectedAddress.phone_number || '',
                                    country: selectedAddress.country || '',
                                    state: selectedAddress.state || selectedAddress.province || '',
                                    city: selectedAddress.city || '',
                                    postal_code: selectedAddress.postal_code || selectedAddress.zip || selectedAddress.postcode || '',
                                    address_line_1: selectedAddress.address_line_1 || selectedAddress.address_1 || selectedAddress.street_address || '',
                                };
                                console.log('Pre-filling form data:', prefillData);
                                setFormData(prefillData);
                            } else {
                                console.log('No selectedAddress available');
                            }
                            
                            setIsAddFormOpen(true);
                        }}
                    >
                        Add New Address
                    </Button>
                    <Button
                        variant="secondary"
                        className="h-[60px] rounded-md text-oxford-blue flex-1"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                </div>

                {/* Add Address Form Modal */}
                {isAddFormOpen && (
                    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                            <ResponsiveText as="h2" minSize="1rem" maxSize="1.375rem" className="font-semibold text-oxford-blue mb-4">Add New Address</ResponsiveText>

                            {validationErrors.general && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                    <p className="text-red-600 text-sm">{validationErrors.general[0]}</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-oxford-blue">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className={`w-full p-2 border rounded-md text-oxford-blue focus:outline-none focus:ring-2 focus:ring-vivid-red text-sm ${
                                            validationErrors.name || validationErrors.first_name || validationErrors.last_name
                                                ? 'border-red-500'
                                                : ''
                                        }`}
                                        placeholder="Enter name"
                                    />
                                    {(validationErrors.name || validationErrors.first_name || validationErrors.last_name) && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {validationErrors.name?.[0] || validationErrors.first_name?.[0] || validationErrors.last_name?.[0]}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-oxford-blue">Phone</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className={`w-full p-2 border rounded-md text-oxford-blue focus:outline-none focus:ring-2 focus:ring-vivid-red text-sm ${
                                            validationErrors.phone ? 'border-red-500' : ''
                                        }`}
                                        placeholder="Enter phone number"
                                    />
                                    {validationErrors.phone && (
                                        <p className="text-red-500 text-xs mt-1">{validationErrors.phone[0]}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-oxford-blue">Country</label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleInputChange}
                                        className={`w-full p-2 border rounded-md text-oxford-blue focus:outline-none focus:ring-2 focus:ring-vivid-red text-sm ${
                                            validationErrors.country ? 'border-red-500' : ''
                                        }`}
                                        placeholder="Enter country"
                                    />
                                    {validationErrors.country && (
                                        <p className="text-red-500 text-xs mt-1">{validationErrors.country[0]}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-oxford-blue">State</label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleInputChange}
                                        className={`w-full p-2 border rounded-md text-oxford-blue focus:outline-none focus:ring-2 focus:ring-vivid-red text-sm ${
                                            validationErrors.state ? 'border-red-500' : ''
                                        }`}
                                        placeholder="Enter state"
                                    />
                                    {validationErrors.state && (
                                        <p className="text-red-500 text-xs mt-1">{validationErrors.state[0]}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-oxford-blue">City <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        className={`w-full p-2 border rounded-md text-oxford-blue focus:outline-none focus:ring-2 focus:ring-vivid-red text-sm ${
                                            validationErrors.city ? 'border-red-500' : ''
                                        }`}
                                        placeholder="Enter city"
                                        required
                                    />
                                    {validationErrors.city && (
                                        <p className="text-red-500 text-xs mt-1">{validationErrors.city[0]}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-oxford-blue">Postal Code</label>
                                    <input
                                        type="text"
                                        name="postal_code"
                                        value={formData.postal_code}
                                        onChange={handleInputChange}
                                        className={`w-full p-2 border rounded-md text-oxford-blue focus:outline-none focus:ring-2 focus:ring-vivid-red text-sm ${
                                            validationErrors.postal_code || validationErrors.zip ? 'border-red-500' : ''
                                        }`}
                                        placeholder="Enter postal code"
                                    />
                                    {(validationErrors.postal_code || validationErrors.zip) && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {validationErrors.postal_code?.[0] || validationErrors.zip?.[0]}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-oxford-blue">Street Address</label>
                                    <input
                                        type="text"
                                        name="address_line_1"
                                        value={formData.address_line_1}
                                        onChange={handleInputChange}
                                        className={`w-full p-2 border rounded-md text-oxford-blue focus:outline-none focus:ring-2 focus:ring-vivid-red text-sm ${
                                            validationErrors.address_line_1 || validationErrors.address_1 ? 'border-red-500' : ''
                                        }`}
                                        placeholder="Enter street address"
                                    />
                                    {(validationErrors.address_line_1 || validationErrors.address_1) && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {validationErrors.address_line_1?.[0] || validationErrors.address_1?.[0]}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button
                                    variant="secondary"
                                    className="h-[60px] flex-1 rounded-md text-oxford-blue"
                                    onClick={handleAddFormClose}
                                >
                                    Cancel
                                </Button>
                                <button
                                    type="button"
                                    className="rounded-md h-[60px] bg-vivid-red text-white flex-1 font-semibold hover:bg-red-600 transition-colors"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('Save button clicked!', formData);
                                        handleAddFormSubmit(e);
                                    }}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}