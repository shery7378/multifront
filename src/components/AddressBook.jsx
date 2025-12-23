import React, { useState, useEffect } from 'react';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import { useGetRequest } from '@/controller/getRequests';
import { usePostRequest } from '@/controller/postRequests';
import { usePutRequest } from '@/controller/putRequests';
// import { useDeleteRequest } from '@/controller/deleteRequests';

export default function AddressBook() {
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
    // const { sendDeleteRequest, loading: deleting } = useDeleteRequest();

    useEffect(() => {
        sendGetRequest('/addresses', true);
    }, []);

    useEffect(() => {
        if (apiData?.data) {
            setAddresses(apiData.data || []);
        }
    }, [apiData]);

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
            setErrorMessage(err.response?.data?.message || 'Failed to save address');
        }
    };

    const handleEdit = (address) => {
        setForm({
            ...form,
            ...Object.fromEntries(Object.entries(address).map(([k, v]) => [k, v ?? '']))
        });
        setIsEditing(true);
    };


    const handleDelete = async (id) => {
        // try {
        //     await sendDeleteRequest(`/addresses/${id}`, true);
        //     setAddresses((prev) => prev.filter((addr) => addr.id !== id));
        //     setSuccessMessage('Address deleted successfully!');
        // } catch (err) {
        //     setErrorMessage(err.response?.data?.message || 'Failed to delete address');
        // }
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

    if (loading) return <p>Loading addresses...</p>;
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
                                    // disabled={deleting}
                                    >
                                        Delete
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