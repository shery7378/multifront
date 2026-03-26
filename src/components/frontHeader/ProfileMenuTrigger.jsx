'use client';

import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLogout } from '@/controller/logoutController';
import UserMenu from '@/components/UserMenu';

export default function ProfileMenuTrigger() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user } = useSelector((state) => state.auth);
  const { handleLogout } = useLogout();
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  const firstName = user?.data?.profile?.first_name || user?.data?.user?.profile?.first_name;
  const lastName = user?.data?.profile?.last_name || user?.data?.user?.profile?.last_name;
  const name = user?.data?.user?.name || user?.name || 'Guest';
  const fullName = firstName && lastName ? `${firstName} ${lastName}` : name;

  const imagePath = 
    user?.image || 
    user?.profile?.image || 
    user?.data?.profile?.image || 
    user?.data?.user?.profile?.image || 
    null;
  
  const imageUrl = imagePath 
    ? (imagePath.startsWith('http') 
        ? imagePath 
        : `${process.env.NEXT_PUBLIC_API_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`)
    : '/images/profile/profile.png';

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => {
            console.log('ProfileMenuTrigger clicked (dropdown mode)');
            setIsOpen(!isOpen);
          }}
      >
        <div className="flex flex-col items-end mr-1">
          <span className="text-sm font-extrabold text-[#092E3B] group-hover:text-[#F44322] transition-colors truncate max-w-[120px] sm:max-w-[150px]">
            {fullName}
          </span>
          <span className="text-[10px] sm:text-xs text-[#F44322] font-semibold whitespace-nowrap">
            Manage account
          </span>
        </div>
        <div className={`relative w-[38px] h-[38px] sm:w-[45px] sm:h-[45px] overflow-hidden rounded-full border-2 transition-all ${isOpen ? 'border-[#F44322] ring-2 ring-[#F44322]/20' : 'border-gray-200 shadow-sm'} group-hover:scale-105`}>
          <img 
            src={imageUrl} 
            alt="Profile" 
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = '/images/profile/profile.png'; }}
          />
        </div>
      </div>

      {/* Profile Dropdown Popover */}
      <div className={`absolute top-full right-0 mt-3 w-80 sm:w-[340px] max-w-[calc(100vw-24px)] bg-white shadow-2xl rounded-2xl border border-gray-100 z-[120] transition-all duration-300 transform origin-top-right ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
        <div className="max-h-[80vh] overflow-y-auto custom-scrollbar shadow-inner">
           <UserMenu 
                user={user} 
                handleLogout={handleLogout}
                onItemClick={() => setIsOpen(false)}
           />
        </div>
      </div>
    </div>
  );
}

