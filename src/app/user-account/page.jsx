//src/app/user-account/page.jsx

'use client'; // Mark as Client Component since we'll use state
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PersonalInfo from '@/components/PersonalInfo';
import AddressBook from '@/components/AddressBook';
import PrivacyAndData from '@/components/PrivacyAndData';
import Security from '@/components/Security';
import BackButton from '@/components/UI/BackButton';
import ResponsiveText from '@/components/UI/ResponsiveText';
import SubscriptionsList from '@/components/Subscriptions/SubscriptionsList';
import ReferralCodeDisplay from '@/components/Referral/ReferralCodeDisplay';
import { useGetRequest } from '@/controller/getRequests';
import { useSelector, useDispatch } from 'react-redux';
import { loginSuccess } from '@/store/slices/authSlice';
import Link from 'next/link';

export default function UserAccountPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabFromUrl = searchParams?.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'Personal Info'); // Use URL param or default
  const dispatch = useDispatch();
  const { user: user, token } = useSelector((state) => state.auth);

  // const {
  //   data: apiUser,
  //   sendGetRequest: getUser,
  //   loading,
  //   error,
  // } = useGetRequest();

  const {
    data: apiUser,
    error: userError,
    loading: userLoading,
    sendGetRequest: getUser
  } = useGetRequest();
  // useEffect(() => {
  //   getUser('/profiles', true);
  // }, []);

  // Update active tab when URL parameter changes
  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  useEffect(() => {
    // getUser(`/profiles/${userId}`, true).then((freshUser) => {
    console.log(token, 'redux user');
    if (token) {
      // const userId = user.id || user.user_id;
      getUser('/customer-profile', true).then((freshUser) => {
        if (freshUser) {
          // Log the raw API response
          console.log('UserAccountPage - Raw API response:', freshUser);
          console.log('UserAccountPage - API data structure:', {
            hasData: !!freshUser?.data,
            dataKeys: freshUser?.data ? Object.keys(freshUser.data) : [],
            hasUser: !!freshUser?.data?.user,
            hasProfile: !!freshUser?.data?.profile,
            userKeys: freshUser?.data?.user ? Object.keys(freshUser.data.user) : [],
            profileKeys: freshUser?.data?.profile ? Object.keys(freshUser.data.profile) : [],
            profileImage: freshUser?.data?.profile?.image,
            userImage: freshUser?.data?.user?.image
          });
          
          // Extract user data from API response and merge with profile data
          const userData = freshUser?.data?.user || {};
          const profileData = freshUser?.data?.profile || {};
          
          // Get current user from Redux to preserve existing data
          const currentUser = user || {};
          
          // Determine the image - profile image takes highest priority
          // The backend now sets userData.image if profile image exists
          const profileImage = profileData?.image || null;
          const userImageFromData = userData?.image || null; // Backend sets this if profile has image
          const currentImage = currentUser?.image || null;
          const finalImage = profileImage || userImageFromData || currentImage || null;
          
          // Merge: start with current user, then API user data, then profile image
          const mergedUser = {
            ...currentUser,
            ...userData, // This now includes image if profile has one (backend sets it)
            // Explicitly set image (profile takes highest priority)
            image: finalImage,
            // Include profile data for components that need it
            profile: profileData,
            // Also update name from profile if available
            name: userData?.name || currentUser?.name || (profileData?.first_name && profileData?.last_name 
              ? `${profileData.first_name} ${profileData.last_name}` 
              : currentUser?.name)
          };
          
          // Force image update even if it was null before
          if (finalImage && finalImage !== currentUser?.image) {
            mergedUser.image = finalImage;
            console.log('UserAccountPage - Image updated from', currentUser?.image, 'to', finalImage);
          }
          
          // Log the structure for debugging
          console.log('UserAccountPage - Image merge process:', {
            currentUserImage: currentUser?.image,
            userDataImage: userImageFromData,
            profileImage: profileImage,
            finalImage: mergedUser.image,
            willUpdate: finalImage !== currentUser?.image
          });
          
          console.log('UserAccountPage - Final merged user:', {
            id: mergedUser.id,
            name: mergedUser.name,
            image: mergedUser.image,
            hasProfile: !!mergedUser.profile,
            profileImage: mergedUser.profile?.image
          });
          
          // Update localStorage to persist the merged user
          localStorage.setItem('auth_user', JSON.stringify(mergedUser));
          console.log('UserAccountPage - Saved to localStorage, image:', mergedUser.image);
          
          dispatch(loginSuccess({ token, user: mergedUser }));
          console.log('UserAccountPage - Dispatched to Redux, image:', mergedUser.image);
          
          // Verify Redux was updated
          setTimeout(() => {
            const updatedUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
            console.log('UserAccountPage - Verification - localStorage user image:', updatedUser.image);
          }, 100);
        }
      });
    }
  }, [token]);

  // prefer redux user, fallback to API
  const profile = user?.data || apiUser?.data.user;
  const tabs = [
    
    { label: 'Personal Info', component: <PersonalInfo data={profile} loading={userLoading} error={userError} /> },
    { label: 'Address Book', component: <AddressBook data={profile} loading={userLoading} error={userError} /> },
    { label: 'Subscriptions', component: <SubscriptionsList /> },
    { label: 'Referrals', component: <ReferralCodeDisplay /> },
    { label: 'Security', component: <Security /> },
    { label: 'Privacy & Data', component: <PrivacyAndData /> },
  ];

  return (
    <div className="px-4 md:px-7 w-full sm:w-[95%] md:w-[90%] lg:w-[82%] xl:w-[83%] mx-auto">
      <div className="flex gap-2 w-full items-center mb-8">
        {/* Back Navigation Button */}
        <div className="back-button">
          <BackButton 
            variant="circular" 
            label="Back to Home"
            onBack={() => router.push('/')}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-6 md:space-x-10 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <div key={tab.label} className="relative">
            <ResponsiveText
              as="h3"
              minSize={'18px'}
              maxSize={'20px'}
              className={`font-medium pb-2 cursor-pointer ${activeTab === tab.label
                ? 'text-vivid-red !font-bold'
                : 'text-oxford-blue hover:text-vivid-red'
                }`}
              onClick={() => setActiveTab(tab.label)}
            >
              {tab.label}
            </ResponsiveText>
            {activeTab === tab.label && (
              <span className="absolute inset-x-0 bottom-0 h-[3px] bg-vivid-red rounded-t" />
            )}
          </div>
        ))}
      </div>

      {/* Profile Section */}
      <div className="">
        {tabs.find((tab) => tab.label === activeTab)?.component}
      </div>
    </div>
  );
}