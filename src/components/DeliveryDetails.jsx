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
import { useDispatch, useSelector } from 'react-redux';
import { setDeliveryAddress } from '@/store/slices/deliverySlice';
import { setDeliveryOption } from '@/store/slices/checkoutSlice';

export default function DeliveryDetails({ hasError = false, storesGrouped = {}, enhancedStores = {} }) {
    const dispatch = useDispatch();
    const deliveryOption = useSelector((state) => state.checkout?.deliveryOption);
    const [isPickup, setIsPickup] = useState(deliveryOption === 'pickup');
    const defaultAddressRequest = useGetRequest();
    const addressesRequest = useGetRequest();
    const { sendPostRequest: setDefaultAddress } = usePostRequest();
    const { sendPostRequest: createAddress } = usePostRequest();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [instructionInput, setInstructionInput] = useState('');
    const [localAddress, setLocalAddress] = useState(null);
    const [addresses, setAddresses] = useState([]);

    // Sync local pickup state with Redux if it changes externally
    useEffect(() => {
        setIsPickup(deliveryOption === 'pickup');
    }, [deliveryOption]);

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

    useEffect(() => {
        defaultAddressRequest.sendGetRequest('/default-address', true, { suppressAuthErrors: true });
        addressesRequest.sendGetRequest('/addresses', true, { suppressAuthErrors: true });
    }, []);

    useEffect(() => {
        if (defaultAddressRequest.data?.data) {
            const address = defaultAddressRequest.data.data;
            setLocalAddress(address);
            setInstructionInput(address.instructions || '');
            const formattedAddress = formatAddressForRedux(address);
            dispatch(setDeliveryAddress(formattedAddress));
        }
    }, [defaultAddressRequest.data, dispatch]);

    useEffect(() => {
        if (addressesRequest.data?.data) {
            setAddresses(addressesRequest.data.data);
        }
    }, [addressesRequest.data]);

    const handleSwitchChange = (value) => {
        const isNowPickup = value === 'Pickup';
        setIsPickup(isNowPickup);
        dispatch(setDeliveryOption(isNowPickup ? 'pickup' : 'standard'));
    };

    const handleEditInstructions = () => {
        setIsModalOpen(true);
    };

    const handleAddInstructions = (newInstruction) => {
        setLocalAddress((prev) => ({
            ...prev,
            instructions: newInstruction,
        }));
        setIsModalOpen(false);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setInstructionInput(localAddress?.instructions || '');
    };

    const handleEditAddress = () => {
        setIsAddressModalOpen(true);
    };

    const handleSelectAddress = async (address) => {
        try {
            if (address.id) {
                await setDefaultAddress(`/addresses/${address.id}/set-default`, {}, true);
                defaultAddressRequest.sendGetRequest('/default-address', true, { suppressAuthErrors: true });
            }
            setLocalAddress(address);
            setInstructionInput(address.instructions || '');
            const formattedAddress = formatAddressForRedux(address);
            dispatch(setDeliveryAddress(formattedAddress));
            setIsAddressModalOpen(false);
        } catch (error) {
            console.error('Failed to set default address:', error);
            setLocalAddress(address);
            setInstructionInput(address.instructions || '');
            const formattedAddress = formatAddressForRedux(address);
            dispatch(setDeliveryAddress(formattedAddress));
            setIsAddressModalOpen(false);
        }
    };

    const handleAddressModalClose = () => {
        setIsAddressModalOpen(false);
    };

    const handleAddAddress = async (formData, setValidationErrors, handleSuccess) => {
        try {
            const payload = {
                name: formData.name || null,
                phone: formData.phone || null,
                country: formData.country || '',
                state: formData.state || null,
                city: formData.city || '',
                postal_code: formData.postal_code || '',
                address_line_1: formData.address_line_1 || '',
                address_line_2: null,
                type: 'shipping',
                is_default: false,
            };

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

            const response = await createAddress('/addresses', payload, true);

            if (response?.data) {
                setAddresses((prev) => [...prev, response.data]);
                addressesRequest.sendGetRequest('/addresses', true, { suppressAuthErrors: true });
                defaultAddressRequest.sendGetRequest('/default-address', true, { suppressAuthErrors: true });
                const formattedAddress = formatAddressForRedux(response.data);
                dispatch(setDeliveryAddress(formattedAddress));
                if (handleSuccess) handleSuccess();
            } else {
                if (setValidationErrors) {
                    setValidationErrors({ general: ['Failed to save address. Please try again.'] });
                }
            }
        } catch (error) {
            console.error('Error saving address:', error);
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

    const defaultAddress = localAddress || null;

    return (
        <div className={`p-4 bg-white rounded-lg shadow border transition-all duration-300 ${hasError ? 'border-red-500 ring-1 ring-red-500' : 'border-transparent'}`}>
            {/* Header: toggle only — title is rendered by the parent */}
            <div className="flex justify-between items-center mb-4">
                <SwitchButton defaultValue={isPickup ? 'Pickup' : 'Delivery'} onChange={handleSwitchChange} />
            </div>

            {isPickup ? (
                <PickUpForCheckout storesGrouped={storesGrouped} enhancedStores={enhancedStores} />
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
                            className=" group transition-colors duration-300"
                            iconClasses="!w-4 !h-4"
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

            <InstructionModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSave={handleAddInstructions}
                initialInstruction={instructionInput}
                setInstructionInput={setInstructionInput}
            />

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