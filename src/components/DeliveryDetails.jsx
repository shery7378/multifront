import React, { useState, useEffect } from 'react';
import IconButton from './UI/IconButton';
import { FaRegEdit } from 'react-icons/fa';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { LuDoorClosed } from "react-icons/lu";
import PickUpForCheckout from './PickUpForCheckout';
import SwitchButton from './UI/SwitchButton';
import { useGetRequest } from '@/controller/getRequests';
import { usePostRequest } from '@/controller/postRequests';
import InstructionModal from './modals/InstructionModal';
import AddressesModal from './modals/AddressesModal';
import ResponsiveText from './UI/ResponsiveText';
import { useDispatch } from 'react-redux';
import { setDeliveryAddress } from '@/store/slices/deliverySlice';

export default function DeliveryDetails() {
    const dispatch = useDispatch();
    const [isPickup, setIsPickup] = useState(false); // State to track if Pickup is selected
    const defaultAddressRequest = useGetRequest(); // Hook instance for default address
    const addressesRequest = useGetRequest(); // Hook instance for all addresses
    const { sendPostRequest: setDefaultAddress } = usePostRequest(); // Hook for setting default address
    const { sendPostRequest: createAddress } = usePostRequest(); // Hook for creating new address
    const [isModalOpen, setIsModalOpen] = useState(false); // State for instruction modal visibility
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false); // State for address selection modal
    const [instructionInput, setInstructionInput] = useState(''); // State for textarea input
    const [localAddress, setLocalAddress] = useState(null); // State to manage selected address locally
    const [addresses, setAddresses] = useState([]); // State to store all addresses

    // Helper function to format address for Redux storage
    const formatAddressForRedux = (address) => {
        if (!address) return null;
        const parts = [];
        if (address.address_line_1) parts.push(address.address_line_1);
        if (address.address_line_2) parts.push(address.address_line_2);
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        if (address.postal_code) parts.push(address.postal_code);
        if (address.country) parts.push(address.country);
        return parts.join(', ') || null;
    };

    // Fetch default address and all addresses on component mount
    useEffect(() => {
        defaultAddressRequest.sendGetRequest('/default-address', true, { suppressAuthErrors: true });
        addressesRequest.sendGetRequest('/addresses', true, { suppressAuthErrors: true });
    }, []);

    // Update localAddress when default address data changes
    useEffect(() => {
        console.log('Default Address Data:', defaultAddressRequest.data); // Debug log
        if (defaultAddressRequest.data?.data) {
            const address = defaultAddressRequest.data.data;
            setLocalAddress(address);
            setInstructionInput(address.instructions || '');
            // Format and store address in Redux
            const formattedAddress = formatAddressForRedux(address);
            dispatch(setDeliveryAddress(formattedAddress));
        }
    }, [defaultAddressRequest.data, dispatch]);

    // Update addresses when addresses data changes
    useEffect(() => {
        console.log('Addresses Data:', addressesRequest.data); // Debug log
        if (addressesRequest.data?.data) {
            setAddresses(addressesRequest.data.data);
        }
    }, [addressesRequest.data]);

    const handleSwitchChange = (value) => {
        setIsPickup(value === 'Pickup'); // Update state based on switch value
    };

    const handleEditInstructions = () => {
        setIsModalOpen(true); // Open instruction modal
    };

    const handleAddInstructions = (newInstruction) => {
        setLocalAddress((prev) => ({
            ...prev,
            instructions: newInstruction, // Update instructions locally
        }));
        setIsModalOpen(false); // Close instruction modal
    };

    const handleModalClose = () => {
        setIsModalOpen(false); // Close instruction modal without saving
        setInstructionInput(localAddress?.instructions || ''); // Reset textarea
    };

    const handleEditAddress = () => {
        setIsAddressModalOpen(true); // Open address selection modal
    };

    const handleSelectAddress = async (address) => {
        try {
            // Update the default address in the database
            if (address.id) {
                await setDefaultAddress(`/addresses/${address.id}/set-default`, {}, true);
                
                // Refresh the default address after updating
                defaultAddressRequest.sendGetRequest('/default-address', true, { suppressAuthErrors: true });
            }
            
            // Update local state
            setLocalAddress(address); // Update selected address
            setInstructionInput(address.instructions || ''); // Update instruction input
            
            // Format and store address in Redux
            const formattedAddress = formatAddressForRedux(address);
            dispatch(setDeliveryAddress(formattedAddress));
            
            setIsAddressModalOpen(false); // Close address modal
        } catch (error) {
            console.error('Failed to set default address:', error);
            // Still update local state even if API call fails
            setLocalAddress(address);
            setInstructionInput(address.instructions || '');
            // Format and store address in Redux even if API call fails
            const formattedAddress = formatAddressForRedux(address);
            dispatch(setDeliveryAddress(formattedAddress));
            setIsAddressModalOpen(false);
        }
    };

    const handleAddressModalClose = () => {
        setIsAddressModalOpen(false); // Close address modal without saving
    };

    const handleAddAddress = async (formData, setValidationErrors, handleSuccess) => {
        try {
            console.log('handleAddAddress called with:', formData);
            
            // Prepare the payload with all required fields
            const payload = {
                name: formData.name || null,
                phone: formData.phone || null,
                country: formData.country || '',
                state: formData.state || null,
                city: formData.city || '',
                postal_code: formData.postal_code || '',
                address_line_1: formData.address_line_1 || '',
                address_line_2: null,
                type: 'shipping', // Default type
                is_default: false, // New address is not default by default
            };

            // Validate required fields (matching backend validation)
            const missingFields = [];
            if (!payload.address_line_1) missingFields.push('Street Address');
            if (!payload.country) missingFields.push('Country');
            if (!payload.city) missingFields.push('City');
            if (!payload.postal_code) missingFields.push('Postal Code');
            if (!payload.type) missingFields.push('Type');

            if (missingFields.length > 0) {
                if (setValidationErrors) {
                    setValidationErrors({
                        general: [`Please fill in all required fields: ${missingFields.join(', ')}`]
                    });
                }
                return;
            }

            console.log('Sending address to API:', payload);

            // Call the API to save the address
            const response = await createAddress('/addresses', payload, true);

            console.log('Address creation response:', response);

            if (response?.data) {
                // Add the new address to the addresses list
                setAddresses((prev) => [...prev, response.data]);
                
                // Refresh addresses list and default address
                addressesRequest.sendGetRequest('/addresses', true, { suppressAuthErrors: true });
                defaultAddressRequest.sendGetRequest('/default-address', true, { suppressAuthErrors: true });
                
                // Format and store new address in Redux
                const formattedAddress = formatAddressForRedux(response.data);
                dispatch(setDeliveryAddress(formattedAddress));
                
                // Call success handler
                if (handleSuccess) {
                    handleSuccess();
                }
            } else {
                if (setValidationErrors) {
                    setValidationErrors({
                        general: ['Failed to save address. Please try again.']
                    });
                }
            }
        } catch (error) {
            console.error('Error saving address:', error);
            
            // Handle validation errors from API
            if (setValidationErrors) {
                if (error.response?.data?.errors) {
                    setValidationErrors(error.response.data.errors);
                } else {
                    setValidationErrors({
                        general: [error.response?.data?.message || error.message || 'Failed to save address. Please try again.']
                    });
                }
            }
        }
    };

    // Extract address details from local state
    const defaultAddress = localAddress || null;

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            {/* Header with Title and Toggle */}
            <div className="flex justify-between items-center mb-4">
                <ResponsiveText as="h2" minSize="1rem" maxSize="1.375rem" className="font-semibold text-oxford-blue">
                    {isPickup ? 'Pickup Details' : 'Delivery Details'}
                </ResponsiveText>

                <SwitchButton defaultValue={isPickup ? 'Pickup' : 'Delivery'} onChange={handleSwitchChange} />
            </div>

            {/* Conditionally render Delivery Details or Pickup Details */}
            {isPickup ? (
                <PickUpForCheckout />
            ) : (
                <div className="">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <IconButton icon={MapPinIcon} />
                            <div>
                                {defaultAddressRequest.loading ? (
                                    <h6 className="font-semibold text-oxford-blue text-sm">Loading...</h6>
                                ) : defaultAddressRequest.error || !defaultAddress ? (
                                    <h6 className="font-semibold text-oxford-blue text-sm">
                                        {'No default address set'}
                                    </h6>
                                ) : (
                                    <>
                                        <h6 className="font-semibold text-oxford-blue text-sm underline">
                                            {defaultAddress.label || ''}
                                        </h6>
                                        <h6 className="font-medium text-oxford-blue text-sm">
                                            <span>{defaultAddress.name ? `${defaultAddress.name}, ` : ''}</span>
                                            {defaultAddress.postal_code}
                                        </h6>
                                        <h5 className="text-sonic-silver font-normal text-xs">
                                            {defaultAddress.address_line_1}
                                            {defaultAddress.address_line_2 ? `, ${defaultAddress.address_line_2}` : ''},
                                            {defaultAddress.city}, {defaultAddress.country}
                                        </h5>
                                    </>
                                )}
                            </div>
                        </div>
                        <IconButton
                            icon={FaRegEdit}
                            className="hover:bg-vivid-red group transition-colors duration-300"
                            iconClasses="!w-4 !h-4 group-hover:text-white group-hover:transition-colors group-hover:duration-300"
                            onClick={handleEditAddress}
                        />
                    </div>
                    <hr className="my-4 text-bright-gray" />
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <IconButton icon={LuDoorClosed} />
                            <div>
                                <h6 className="font-semibold text-oxford-blue text-sm">Meet at my door</h6>
                                <h5 className="text-sonic-silver font-normal text-xs">
                                    {defaultAddress?.instructions || 'Add delivery instruction'}
                                </h5>
                            </div>
                        </div>
                        <IconButton
                            icon={FaRegEdit}
                            iconClasses="!w-4 !h-4"
                            onClick={handleEditInstructions}
                        />
                    </div>
                </div>
            )}

            {/* Instruction Modal */}
            <InstructionModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSave={handleAddInstructions}
                initialInstruction={instructionInput}
                setInstructionInput={setInstructionInput}
            />

            {/* Address Selection Modal */}
            <AddressesModal
                isOpen={isAddressModalOpen}
                onClose={handleAddressModalClose}
                onSelect={handleSelectAddress}
                onAddAddress={handleAddAddress}
                addresses={addresses}
                selectedAddress={localAddress}
                loading={addressesRequest.loading}
                error={addressesRequest.error}
            />
        </div>
    );
}