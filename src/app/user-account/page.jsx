//src/app/user-account/page.jsx

'use client'; // Mark as Client Component since we'll use state
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
          dispatch(loginSuccess({ token, user: freshUser }));
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
          <BackButton iconClasses="!text-black" />
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