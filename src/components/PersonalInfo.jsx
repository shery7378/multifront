//src/components/PersonalInfo.jsx
import { CameraIcon, XMarkIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import Button from '@/components/UI/Button';
import UpdateNumberModal from '@/components/modals/UpdateNumberModal';
import UpdateNumberVerifyCodeModal from '@/components/modals/UpdateNumberVerifyCodeModal';
import UpdateEmailModal from '@/components/modals/UpdateEmailModal';
import { useEffect, useRef, useState } from 'react';
import Input from '@/components/UI/Input';
import { usePutRequest } from '@/controller/putRequests';
import { usePostRequest } from '@/controller/postRequests';
import { useGetRequest } from '@/controller/getRequests';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess } from '@/store/slices/authSlice';
import SectionLoader from '@/components/UI/SectionLoader';

export default function PersonalInfo({ data, loading, error }) {
    const [isUpdateNumberModalOpen, setIsUpdateNumberModalOpen] = useState(false);
    const [isUpdateEmailModalOpen, setIsUpdateEmailModalOpen] = useState(false);
    const [isUpdateNumberVerifyModalOpen, setIsUpdateNumberVerifyModalOpen] = useState(false);
    const [unverifiedPhone, setUnverifiedPhone] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [imageBase64, setImageBase64] = useState(null); // send to backend
    const [successMessage, setSuccessMessage] = useState('');
    const [fieldErrors, setFieldErrors] = useState({}); // New state for field-specific errors
    const [uploadedPreview, setUploadedPreview] = useState(null); // only set when user picks a new file

    const fileInputRef = useRef(null);
    const dispatch = useDispatch();
    const { token, user: currentUser } = useSelector((state) => state.auth);

    // hooks
    const { sendPutRequest, loading: updating, error: updateError } = usePutRequest();
    const { sendPostRequest, loading: creating, error: createError } = usePostRequest();
    const { sendGetRequest: getUser } = useGetRequest();

    // Compute the display image URL — same priority chain as the header (ProfileMenuTrigger)
    const getAvatarUrl = () => {
        if (uploadedPreview) return uploadedPreview; // user just picked a new file

        // Priority: API profile.image > Redux user.image > placeholder
        const rawPath =
            data?.profile?.image ||
            currentUser?.image ||
            currentUser?.profile?.image ||
            null;

        if (!rawPath) return '/images/profile/profile.png';
        if (rawPath.startsWith('http') || rawPath.startsWith('data:')) return rawPath;
        return `${process.env.NEXT_PUBLIC_API_URL}/${rawPath.replace(/^\//, '')}`;
    };

    useEffect(() => {
        if (data) {
            setImageBase64(null); // clear local upload when data refreshes
            setUploadedPreview(null);
            
            // Extract core data depending on how Redux passed it
            const profileData = data?.profile || data?.data?.profile || data?.data?.user?.profile || {};
            const userData = data?.user || data?.data?.user || data?.data || data || {};
            
            // Fallbacks for names
            let currentFirstName = profileData?.first_name || userData?.first_name || '';
            let currentLastName = profileData?.last_name || userData?.last_name || '';
            let currentFullName = userData?.name || profileData?.name || '';
            
            if (!currentFirstName && !currentLastName && currentFullName) {
                const parts = currentFullName.trim().split(' ');
                currentFirstName = parts[0] || '';
                currentLastName = parts.slice(1).join(' ') || '';
            }

            setFirstName(currentFirstName);
            setLastName(currentLastName);
            setPhoneNumber(profileData?.phone || userData?.phone || '');
            setEmail(userData?.email || '');
        }
    }, [data]);

    if (loading) return <SectionLoader text="Loading user data..." className="min-h-[40vh]" />;

    // handle new upload
    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedPreview(reader.result); // show base64 preview
                setImageBase64(reader.result);     // send to backend
            };
            reader.readAsDataURL(file);
        }
    };

    // remove image
    const handleRemoveImage = () => {
        setUploadedPreview(null);
        setImageBase64(null);
    };

    // save update
    const handleUpdate = async () => {
        try {
            setSuccessMessage('');

            // Validate required fields before sending
            const errors = {};
            if (!firstName.trim()) errors.firstName = "First Name is required";
            if (!lastName.trim()) errors.lastName = "Last Name is required";
            if (!phoneNumber.trim()) errors.phoneNumber = "Phone Number is required";
            if (!email.trim()) errors.email = "Email is required";

            if (Object.keys(errors).length > 0) {
                setFieldErrors(errors);
                setSuccessMessage('');
                return;
            }

            setFieldErrors({}); // Clear errors if validation passes

            const payload = {
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                phone: phoneNumber.trim(),
                email: email.trim(), // Include email as it's required by backend validation
            };

            if (imageBase64 !== null) {
                payload.image = imageBase64; // only send if user uploaded
            } else if (!uploadedPreview && !data?.profile?.image && !currentUser?.image) {
                payload.image = null; // tell backend to remove image
            }

            let response;
            if (data?.profile) {
                response = await sendPutRequest(`/profiles/${data.profile.id}`, payload, true);
            } else {
                payload.user_id = data.id;
                response = await sendPostRequest(`/profiles`, payload, true);
            }

            // After saving, clear the local upload preview (Redux will update via getUser below)
            setUploadedPreview(null);
            setImageBase64(null);
            setSuccessMessage("Profile updated successfully!");

            // Refresh user data from API to update Redux store (so sidebar shows updated image)
            if (token) {
                getUser('/customer-profile', true).then((freshUser) => {
                    if (freshUser) {
                        // Log the raw API response
                        console.log('PersonalInfo - Raw API response:', freshUser);

                        // Extract user data from API response and merge with profile data
                        const userData = freshUser?.data?.user || {};
                        const profileData = freshUser?.data?.profile || {};

                        // Merge: start with current user, then API user data, then profile image
                        const mergedUser = {
                            ...(currentUser || {}),
                            ...userData,
                            // Add profile image to user.image if it exists (profile takes priority)
                            image: profileData?.image || userData?.image || currentUser?.image || null,
                            // Include profile data for components that need it
                            profile: profileData,
                            // Also update name from profile if available
                            name: userData?.name || currentUser?.name || (profileData?.first_name && profileData?.last_name
                                ? `${profileData.first_name} ${profileData.last_name}`
                                : currentUser?.name)
                        };

                        // Log the structure for debugging
                        console.log('PersonalInfo - Refreshed and merged user data:', {
                            currentUserImage: currentUser?.image,
                            userDataImage: userData?.image,
                            profileImage: profileData?.image,
                            finalImage: mergedUser.image,
                            userId: mergedUser.id,
                            userName: mergedUser.name,
                            willUpdateRedux: mergedUser.image !== currentUser?.image
                        });

                        // Update localStorage to persist the merged user
                        if (typeof window !== 'undefined') {
                            localStorage.setItem('auth_user', JSON.stringify(mergedUser));
                            console.log('PersonalInfo - Updated localStorage with image:', mergedUser.image);
                        }

                        dispatch(loginSuccess({ token, user: mergedUser }));
                        console.log('PersonalInfo - Dispatched loginSuccess with image:', mergedUser.image);

                        // Force a custom event to notify components of user update
                        if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('userProfileUpdated', {
                                detail: { user: mergedUser }
                            }));
                        }
                    }
                });
            }
        } catch (err) {
            console.error("Update failed:", err);
            // Error is already set by the hook, but we can add additional handling here if needed
            const errorMessage = err.message || updateError || createError || 'Failed to update profile. Please try again.';
            setSuccessMessage('');
            // The error will be displayed via updateError/createError state
        }
    };

    return (
        <>
            <div className="p-3 md:p-4">
                <div className="max-w-md me-auto">
                    {/* Profile Image */}
                    <div className="flex justify-center md:justify-start space-x-4 mb-6">
                        <div className="relative">
                            <img
                                src={getAvatarUrl()}
                                alt="Profile Preview"
                                className="w-24 h-24 rounded-full object-cover"
                                onError={(e) => { e.target.src = '/images/profile/profile.png'; }}
                            />

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute cursor-pointer bottom-0 right-0 bg-white rounded-full p-1 border border-gray-200 w-7 h-7 flex items-center justify-center"
                            >
                                <CameraIcon className="w-5 h-5 text-gray-600 " />
                            </button>

                            {/* {previewImage && previewImage !== "/images/profile-placeholder.png" && (
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute -top-2 -right-2 cursor-pointer bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            )} */}

                            {/* hidden file input */}
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleImageChange}
                            />
                        </div>
                    </div>

                    <div className="my-4">
                        <h4 className="text-oxford-blue font-normal text-sm mb-2">First Name</h4>
                        <Input
                            name="firstName"
                            value={firstName}
                            onChange={(e) => {
                                setFirstName(e.target.value);
                                if (fieldErrors.firstName) setFieldErrors(prev => ({ ...prev, firstName: '' }));
                            }}
                            placeholder="First Name"
                            error={fieldErrors.firstName}
                            inputClassName="h-14"
                            labelClassName="hidden"
                        />
                    </div>

                    {/* Last Name */}
                    <div className="my-4">
                        <h4 className="text-oxford-blue font-normal text-sm mb-2 mt-4">Last Name</h4>
                        <Input
                            name="lastName"
                            value={lastName}
                            onChange={(e) => {
                                setLastName(e.target.value);
                                if (fieldErrors.lastName) setFieldErrors(prev => ({ ...prev, lastName: '' }));
                            }}
                            placeholder="Last Name"
                            error={fieldErrors.lastName}
                            inputClassName="h-14"
                            labelClassName="hidden"
                        />
                    </div>

                    {/* Phone Number */}
                    <div className="my-4">
                        <h4 className="text-oxford-blue font-normal text-sm mb-2">Phone Number</h4>
                        <div className="flex gap-2">
                            <Input
                                name="phoneNumber"
                                value={phoneNumber}
                                onChange={(e) => {
                                    setPhoneNumber(e.target.value);
                                    if (fieldErrors.phoneNumber) setFieldErrors(prev => ({ ...prev, phoneNumber: '' }));
                                }}
                                placeholder="Phone Number"
                                error={fieldErrors.phoneNumber}
                                className="flex-1"
                                inputClassName="h-14"
                                labelClassName="hidden"
                            />
                            <Button
                                onClick={() => setIsUpdateNumberModalOpen(true)}
                                variant='secondary'
                                className="px-4 py-2 !h-14 !bg-cultured !text-oxford-blue/60 rounded-md hover:bg-gray-200 flex-shrink-0"
                            >
                                Update
                            </Button>
                        </div>
                        <p className="text-oxford-blue/60 text-[10px] mt-1">
                            A verification code will be sent to this number
                        </p>
                    </div>

                    {/* Email */}
                    <div className="mb-6">
                        <h4 className="text-oxford-blue font-normal text-sm mb-2">Email</h4>
                        <div className="flex gap-2">
                            <Input
                                name="email"
                                value={email}
                                placeholder="Email"
                                disabled
                                className="flex-1"
                                inputClassName="p-2 h-14 border bg-ghost-white border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-vivid-red/60 w-full"
                                labelClassName="hidden"
                            />
                            <Button
                                onClick={() => setIsUpdateEmailModalOpen(true)}
                                variant='secondary'
                                className="px-4 py-2 !h-14 !bg-cultured !text-oxford-blue/60 rounded-md hover:bg-gray-200 flex-shrink-0"
                            >
                                Update
                            </Button>
                        </div>
                        <p className="text-oxford-blue/60 text-[10px] mt-1">
                            A verification code will be sent to this email
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-4">
                        <Button variant="secondary" className="h-[56px] flex-1 rounded-md text-oxford-blue">
                            Cancel
                        </Button>
                        <Button
                            className="h-[56px] flex-1 rounded-md"
                            onClick={handleUpdate}
                            disabled={updating}
                        >
                            {updating ? "Updating..." : "Update"}
                        </Button>
                    </div>

                    {/* Feedback messages */}
                    {(updateError || createError) && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-sm font-medium">
                                Error updating profile: {updateError || createError}
                            </p>
                        </div>
                    )}
                    {successMessage && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-700 text-sm font-medium">{successMessage}</p>
                        </div>
                    )}
                </div>
            </div>

            <UpdateNumberModal
                isOpen={isUpdateNumberModalOpen}
                onClose={() => setIsUpdateNumberModalOpen(false)}
                onSuccess={(newPhone) => {
                    setUnverifiedPhone(newPhone);
                    setIsUpdateNumberVerifyModalOpen(true);
                }}
            />

            <UpdateNumberVerifyCodeModal
                isOpen={isUpdateNumberVerifyModalOpen}
                onClose={() => setIsUpdateNumberVerifyModalOpen(false)}
                phone={unverifiedPhone}
                onSuccess={(verifiedPhone) => {
                    setPhoneNumber(verifiedPhone);
                    // Refresh user data from API
                    if (token) {
                        getUser('/customer-profile', true).then((freshUser) => {
                            if (freshUser) {
                                const userData = freshUser?.data?.user || {};
                                const profileData = freshUser?.data?.profile || {};
                                const mergedUser = {
                                    ...(currentUser || {}),
                                    ...userData,
                                    image: profileData?.image || userData?.image || currentUser?.image || null,
                                    profile: profileData,
                                    name: userData?.name || currentUser?.name || (profileData?.first_name && profileData?.last_name
                                        ? `${profileData.first_name} ${profileData.last_name}`
                                        : currentUser?.name)
                                };
                                if (typeof window !== 'undefined') {
                                    localStorage.setItem('auth_user', JSON.stringify(mergedUser));
                                }
                                dispatch(loginSuccess({ token, user: mergedUser }));
                            }
                        });
                    }
                }}
            />

            <UpdateEmailModal
                isOpen={isUpdateEmailModalOpen}
                onClose={() => setIsUpdateEmailModalOpen(false)}
                onSuccess={(newEmailValue) => {
                    setEmail(newEmailValue);
                    // Refresh user data from API
                    if (token) {
                        getUser('/customer-profile', true).then((freshUser) => {
                            if (freshUser) {
                                const userData = freshUser?.data?.user || {};
                                const profileData = freshUser?.data?.profile || {};
                                const mergedUser = {
                                    ...(currentUser || {}),
                                    ...userData,
                                    image: profileData?.image || userData?.image || currentUser?.image || null,
                                    profile: profileData,
                                    name: userData?.name || currentUser?.name || (profileData?.first_name && profileData?.last_name
                                        ? `${profileData.first_name} ${profileData.last_name}`
                                        : currentUser?.name)
                                };
                                if (typeof window !== 'undefined') {
                                    localStorage.setItem('auth_user', JSON.stringify(mergedUser));
                                }
                                dispatch(loginSuccess({ token, user: mergedUser }));
                            }
                        });
                    }
                }}
            />
        </>
    );
}
