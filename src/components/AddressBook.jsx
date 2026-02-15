import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import { useGetRequest } from '@/controller/getRequests';
import { usePostRequest } from '@/controller/postRequests';
import { usePutRequest } from '@/controller/putRequests';
import { useDeleteRequest } from '@/controller/deleteRequests';
import SectionLoader from '@/components/UI/SectionLoader';

export default function AddressBook() {
    const { user } = useSelector((state) => state.auth);
    const [addresses, setAddresses] = useState([]);
    const [form, setForm] = useState({
        id: null,
        label: '',
        name: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        district: '',
        state: '',
        province: '',
        country: '',
        country_code: '',
        postal_code: '',
        phone: '',
        email: '',
        type: 'shipping',
        is_default: false,
        instructions: '',
    });
    const [isEditing, setIsEditing] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const { data: apiData, loading, error, sendGetRequest } = useGetRequest();
    const { sendPostRequest, loading: creating } = usePostRequest();
    const { sendPutRequest, loading: updating } = usePutRequest();
    const { sendDeleteRequest, loading: deleting } = useDeleteRequest();

    const refreshAddresses = () => {
        sendGetRequest('/addresses', true);
    };

    useEffect(() => {
        refreshAddresses();
    }, []);
    
    // Validate form address ID when addresses list changes
    useEffect(() => {
        if (isEditing && form.id && addresses.length > 0) {
            const addressExists = addresses.some(addr => addr.id === form.id);
            if (!addressExists) {
                console.warn('AddressBook - Form address no longer exists in list, resetting form', {
                    formAddressId: form.id,
                    availableIds: addresses.map(addr => addr.id),
                });
                resetForm();
                setErrorMessage('The address you were editing is no longer available. It may have been deleted.');
            }
        }
    }, [addresses, isEditing, form.id]);

    useEffect(() => {
        if (apiData?.data) {
            // Ensure we're working with an array (handle pagination if needed)
            let addressesList = Array.isArray(apiData.data) 
                ? apiData.data 
                : (apiData.data?.data || []);
            
            // Safety filter: Only show addresses that belong to the current user
            const currentUserId = user?.id;
            if (currentUserId) {
                const filteredAddresses = addressesList.filter(addr => {
                    // If address has user_id, it must match current user
                    // If no user_id, include it (backend should have filtered, but safety check)
                    return !addr.user_id || addr.user_id === currentUserId;
                });
                
                if (filteredAddresses.length !== addressesList.length) {
                    console.warn('AddressBook - Filtered out addresses not belonging to current user:', {
                        originalCount: addressesList.length,
                        filteredCount: filteredAddresses.length,
                        currentUserId: currentUserId,
                        removedAddresses: addressesList
                            .filter(addr => addr.user_id && addr.user_id !== currentUserId)
                            .map(addr => ({ id: addr.id, user_id: addr.user_id })),
                    });
                }
                
                addressesList = filteredAddresses;
            }
            
            console.log('AddressBook - Fetched addresses:', {
                total: addressesList.length,
                addressIds: addressesList.map(addr => addr.id),
                addressesWithUserIds: addressesList.map(addr => ({
                    id: addr.id,
                    user_id: addr.user_id,
                    label: addr.label || 'Unnamed',
                })),
                currentUserId: currentUserId,
                fullAddresses: addressesList,
            });
            
            setAddresses(addressesList);
        }
    }, [apiData, user?.id]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async () => {
        try {
            setSuccessMessage('');
            setErrorMessage('');
            
            // Validate that we're editing an address that exists in our list
            if (isEditing && form.id) {
                console.log('AddressBook - Validating address before update:', {
                    addressId: form.id,
                    availableAddressIds: addresses.map(addr => addr.id),
                    addressExists: addresses.some(addr => addr.id === form.id),
                });
                
                const addressExists = addresses.some(addr => addr.id === form.id);
                if (!addressExists) {
                    console.error('AddressBook - Address not found in list:', {
                        addressId: form.id,
                        availableIds: addresses.map(addr => addr.id),
                    });
                    setErrorMessage('Cannot edit this address. It may have been deleted or does not belong to you. Refreshing address list...');
                    // Refresh the address list to get the latest data
                    setTimeout(() => refreshAddresses(), 1000);
                    return;
                }
                
                // Double-check: verify the address in our list belongs to current user
                const addressToEdit = addresses.find(addr => addr.id === form.id);
                if (!addressToEdit) {
                    console.error('AddressBook - Address not found after second check');
                    setErrorMessage('Address not found in your address list. Please refresh and try again.');
                    refreshAddresses();
                    return;
                }
                
                console.log('AddressBook - Address validated, proceeding with update:', {
                    addressId: form.id,
                    address: addressToEdit,
                });
            }
            
            const payload = { ...form };

            let response;
            if (isEditing) {
                response = await sendPutRequest(`/addresses/${form.id}`, payload, true);
            } else {
                response = await sendPostRequest('/addresses', payload, true);
            }

            setAddresses((prev) =>
                isEditing
                    ? prev.map((addr) => (addr.id === response.data.id ? response.data : addr))
                    : [...prev, response.data]
            );
            setSuccessMessage(isEditing ? 'Address updated successfully!' : 'Address added successfully!');
            resetForm();
        } catch (err) {
            // Extract detailed error message
            let errorMsg = 'Failed to save address';
            
            // Check if error has response (from axios) or was preserved from putRequests
            const response = err.response || (err.status ? { status: err.status, data: {} } : null);
            const status = response?.status || err.status;
            
            if (response?.data) {
                if (response.data.message) {
                    errorMsg = response.data.message;
                } else if (response.data.details) {
                    // Use details if available (from our improved backend error)
                    errorMsg = response.data.message || 'Unauthorized to update this address';
                    if (response.data.details) {
                        console.error('Address update error details:', response.data.details);
                    }
                }
            } else if (err.message) {
                // Fallback to error message if no response data
                errorMsg = err.message;
            }
            
            // Add status-specific messages if we have a status
            if (status === 403) {
                errorMsg = errorMsg || 'You are not authorized to update this address. It may belong to a different user.';
                // If we got a 403, refresh the address list as it might be stale
                refreshAddresses();
            } else if (status === 401) {
                errorMsg = errorMsg || 'Please log in to save addresses.';
            }
            
            setErrorMessage(errorMsg);
            console.error('Address save error:', {
                status: status,
                data: response?.data,
                message: err.message,
                fullError: err,
            });
        }
    };

    const handleEdit = (address) => {
        // Verify the address exists in the current address list
        const addressInList = addresses.find(addr => addr.id === address.id);
        if (!addressInList) {
            console.error('AddressBook - Attempted to edit address not in list:', {
                addressId: address.id,
                availableAddressIds: addresses.map(addr => addr.id),
            });
            setErrorMessage('Cannot edit this address. It may have been deleted or does not belong to you.');
            refreshAddresses();
            return;
        }
        
        console.log('AddressBook - Editing address:', {
            addressId: address.id,
            address: address,
            isInList: true,
        });
        
        setForm({
            ...form,
            ...Object.fromEntries(Object.entries(address).map(([k, v]) => [k, v ?? '']))
        });
        setIsEditing(true);
    };


    const handleDelete = async (id) => {
        // Confirm deletion
        if (!window.confirm('Are you sure you want to delete this address?')) {
            return;
        }

        try {
            setSuccessMessage('');
            setErrorMessage('');
            
            // Verify the address exists in the list before deleting
            const addressToDelete = addresses.find(addr => addr.id === id);
            if (!addressToDelete) {
                setErrorMessage('Address not found. It may have already been deleted.');
                refreshAddresses();
                return;
            }
            
            // Verify the address belongs to the current user
            const currentUserId = user?.id;
            if (currentUserId && addressToDelete.user_id && addressToDelete.user_id !== currentUserId) {
                console.error('AddressBook - Attempted to delete address belonging to different user:', {
                    addressId: id,
                    addressUserId: addressToDelete.user_id,
                    currentUserId: currentUserId,
                });
                setErrorMessage('You cannot delete this address. It belongs to a different user.');
                // Refresh to get the correct address list
                refreshAddresses();
                return;
            }
            
            console.log('AddressBook - Deleting address:', {
                addressId: id,
                address: addressToDelete,
                currentUserId: currentUserId,
                addressUserId: addressToDelete.user_id,
            });
            
            await sendDeleteRequest(`/addresses/${id}`, true);
            
            // Remove from local state
            setAddresses((prev) => prev.filter((addr) => addr.id !== id));
            setSuccessMessage('Address deleted successfully!');
            
            // If we were editing this address, reset the form
            if (isEditing && form.id === id) {
                resetForm();
            }
        } catch (err) {
            // Extract detailed error message
            let errorMsg = 'Failed to delete address';
            
            const response = err.response || (err.status ? { status: err.status, data: {} } : null);
            const status = response?.status || err.status;
            
            if (response?.data) {
                if (response.data.message) {
                    errorMsg = response.data.message;
                }
            } else if (err.message) {
                errorMsg = err.message;
            }
            
            // Add status-specific messages
            if (status === 403) {
                errorMsg = errorMsg || 'You are not authorized to delete this address. It may belong to a different user.';
                refreshAddresses();
            } else if (status === 401) {
                errorMsg = errorMsg || 'Please log in to delete addresses.';
            } else if (status === 404) {
                errorMsg = errorMsg || 'Address not found. It may have already been deleted.';
                refreshAddresses();
            }
            
            setErrorMessage(errorMsg);
            console.error('Address delete error:', {
                status: status,
                data: response?.data,
                message: err.message,
                fullError: err,
            });
        }
    };

    const resetForm = () => {
        setForm({
            id: null,
            label: '',
            name: '',
            address_line_1: '',
            address_line_2: '',
            city: '',
            district: '',
            state: '',
            province: '',
            country: '',
            country_code: '',
            postal_code: '',
            phone: '',
            email: '',
            type: 'shipping',
            is_default: false,
            instructions: '',
        });
        setIsEditing(false);
    };

    if (loading) return <SectionLoader text="Loading addresses..." className="min-h-[40vh]" />;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Address Book</h2>
            <div className="w-full flex flex-col md:flex-row gap-8">

                {/* Address Form */}
                <div className="mb-6 w-1/2">
                    <div className="my-4">
                        <h4 className="text-oxford-blue font-normal text-sm mb-2">Label</h4>
                        <Input
                            name="label"
                            value={form.label}
                            onChange={handleInputChange}
                            placeholder="e.g., Home, Office"
                            inputClassName="p-2 h-14 border bg-ghost-white border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-vivid-red/60"
                            labelClassName="hidden"
                        />
                    </div>
                    <div className="my-4">
                        <h4 className="text-oxford-blue font-normal text-sm mb-2">Recipient Name</h4>
                        <Input
                            name="name"
                            value={form.name}
                            onChange={handleInputChange}
                            placeholder="Recipient Name"
                            inputClassName="p-2 h-14 border bg-ghost-white border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-vivid-red/60"
                            labelClassName="hidden"
                        />
                    </div>
                    <div className="my-4">
                        <h4 className="text-oxford-blue font-normal text-sm mb-2">Address Line 1</h4>
                        <Input
                            name="address_line_1"
                            value={form.address_line_1}
                            onChange={handleInputChange}
                            placeholder="Address Line 1"
                            inputClassName="p-2 h-14 border bg-ghost-white border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-vivid-red/60"
                            labelClassName="hidden"
                        />
                    </div>
                    <div className="my-4">
                        <h4 className="text-oxford-blue font-normal text-sm mb-2">Address Line 2</h4>
                        <Input
                            name="address_line_2"
                            value={form.address_line_2}
                            onChange={handleInputChange}
                            placeholder="Address Line 2 (optional)"
                            inputClassName="p-2 h-14 border bg-ghost-white border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-vivid-red/60"
                            labelClassName="hidden"
                        />
                    </div>

                    <div className="my-4">
                        <h4 className="text-oxford-blue font-normal text-sm mb-2">Country</h4>
                        <Input
                            name="country"
                            value={form.country}
                            onChange={handleInputChange}
                            placeholder="Country"
                            inputClassName="p-2 h-14 border bg-ghost-white border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-vivid-red/60"
                            labelClassName="hidden"
                        />
                    </div>
                    <div className="my-4">
                        <h4 className="text-oxford-blue font-normal text-sm mb-2">State</h4>
                        <Input
                            name="state"
                            value={form.state}
                            onChange={handleInputChange}
                            placeholder="State (optional)"
                            inputClassName="p-2 h-14 border bg-ghost-white border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-vivid-red/60"
                            labelClassName="hidden"
                        />
                    </div>
                    <div className="my-4">
                        <h4 className="text-oxford-blue font-normal text-sm mb-2">City</h4>
                        <Input
                            name="city"
                            value={form.city}
                            onChange={handleInputChange}
                            placeholder="City"
                            inputClassName="p-2 h-14 border bg-ghost-white border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-vivid-red/60"
                            labelClassName="hidden"
                        />
                    </div>
                    <div className="my-4">
                        <h4 className="text-oxford-blue font-normal text-sm mb-2">Postal Code</h4>
                        <Input
                            name="postal_code"
                            value={form.postal_code}
                            onChange={handleInputChange}
                            placeholder="Postal Code"
                            inputClassName="p-2 h-14 border bg-ghost-white border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-vivid-red/60"
                            labelClassName="hidden"
                        />
                    </div>
                    <div className="my-4">
                        <h4 className="text-oxford-blue font-normal text-sm mb-2">Phone</h4>
                        <Input
                            name="phone"
                            value={form.phone}
                            onChange={handleInputChange}
                            placeholder="Phone (optional)"
                            inputClassName="p-2 h-14 border bg-ghost-white border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-vivid-red/60"
                            labelClassName="hidden"
                        />
                    </div>
                    <div className="my-4">
                        <h4 className="text-oxford-blue font-normal text-sm mb-2">Email</h4>
                        <Input
                            name="email"
                            value={form.email}
                            onChange={handleInputChange}
                            placeholder="Email (optional)"
                            inputClassName="p-2 h-14 border bg-ghost-white border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-vivid-red/60"
                            labelClassName="hidden"
                        />
                    </div>
                    <div className="my-4">
                        <h4 className="text-oxford-blue font-normal text-sm mb-2">Type</h4>
                        <select
                            name="type"
                            value={form.type}
                            onChange={handleInputChange}
                            className="p-2 h-14 border bg-ghost-white border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-vivid-red/60 w-full"
                        >
                            <option value="shipping">Shipping</option>
                            <option value="billing">Billing</option>
                        </select>
                    </div>
                    <div className="my-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="is_default"
                                checked={form.is_default}
                                onChange={handleInputChange}
                                className="mr-2"
                            />
                            <span className="text-oxford-blue font-normal text-sm">Set as Default</span>
                        </label>
                    </div>
                    <div className="my-4">
                        <h4 className="text-oxford-blue font-normal text-sm mb-2">Delivery Instructions</h4>
                        <textarea
                            name="instructions"
                            value={form.instructions}
                            onChange={handleInputChange}
                            placeholder="Delivery Instructions (optional)"
                            className="p-2 h-24 border bg-ghost-white border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-vivid-red/60 w-full"
                        />
                    </div>
                    <div className="flex space-x-4">
                        <Button
                            variant="secondary"
                            className="h-[60px] flex-1 rounded-md text-oxford-blue"
                            onClick={resetForm}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="h-[60px] flex-1 rounded-md"
                            onClick={handleSubmit}
                            disabled={creating || updating}
                        >
                            {creating || updating ? 'Saving...' : isEditing ? 'Update' : 'Add'}
                        </Button>
                    </div>
                    {successMessage && <p className="text-green-600 text-sm mt-2">{successMessage}</p>}
                    {errorMessage && <p className="text-red-500 text-sm mt-2">{errorMessage}</p>}
                </div>

                {/* Address List */}
                <div className="mt-8 w-1/2">
                    <h3 className="text-lg font-bold mb-4">Saved Addresses</h3>
                    {addresses.length === 0 ? (
                        <p className="text-oxford-blue/60">No addresses saved yet.</p>
                    ) : (
                        addresses.map((address) => (
                            <div key={address.id} className="border p-4 mb-4 rounded-md">
                                <p className="font-bold">{address.label || 'Unnamed Address'}</p>
                                <p>{address.name}</p>
                                <p>
                                    {address.address_line_1}
                                    {address.address_line_2 && `, ${address.address_line_2}`}
                                    , {address.city}
                                    {address.district && `, ${address.district}`}
                                    {address.state && `, ${address.state}`}
                                    {address.province && `, ${address.province}`}
                                    , {address.country} {address.postal_code}
                                </p>
                                <p>Phone: {address.phone || 'N/A'}</p>
                                <p>Email: {address.email || 'N/A'}</p>
                                <p>Type: {address.type}</p>
                                {address.instructions && <p>Instructions: {address.instructions}</p>}
                                {address.is_default && <p className="text-green-600">Default Address</p>}
                                <div className="flex space-x-4 mt-2">
                                    <Button
                                        variant="secondary"
                                        className="h-10"
                                        onClick={() => handleEdit(address)}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        variant="danger"
                                        className="h-10"
                                        onClick={() => handleDelete(address.id)}
                                        disabled={deleting}
                                    >
                                        {deleting ? 'Deleting...' : 'Delete'}
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}