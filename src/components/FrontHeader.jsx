// src/components/FrontHeader.jsx
'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setDeliveryMode, setRightDrawerOpen } from '../store/slices/deliverySlice';
import DesktopNav from '@/components/frontHeader/DesktopNav';
import MobileNav from '@/components/frontHeader/MobileNav';
import BurgerMenu from '@/components/frontHeader/BurgerMenu';
import ModalContainer from '@/components/frontHeader/ModalContainer';
import DrawerContainer from '@/components/frontHeader/DrawerContainer';
import { useLogout } from '@/controller/logoutController';
import { usePromotionsModal } from '@/contexts/PromotionsModalContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function FrontHeader() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postcode, setPostcode] = useState('');
  const [burgerOpen, setBurgerOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isEstimatedArrivalOpen, setIsEstimatedArrivalOpen] = useState(false);
  const { isOpen: isPromotionsOpen, setIsOpen: setIsPromotionsOpen } = usePromotionsModal();
  const [isStoreAddReviewOpen, setIsStoreAddReviewOpen] = useState(false);
  const [isOrderReceivedOpen, setIsOrderReceivedOpen] = useState(false);

  // const router = useRouter();
  const dispatch = useDispatch();
  const { mode, isRightDrawerOpen } = useSelector((state) => state.delivery);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { isDark } = useTheme();

  useEffect(() => {
    const savedPostcode = localStorage.getItem('postcode');
    const savedMode = localStorage.getItem('deliveryMode');
    console.log(savedMode, 'savedMode in header');
    if (!savedMode) {
      localStorage.setItem('deliveryMode', 'delivery'); // reset to delivery on load
    }
    if (savedPostcode) {
      setPostcode(savedPostcode);
    } else {
      setIsModalOpen(false); // show modal if not saved
    }

    if (savedMode) {
      dispatch(setDeliveryMode(savedMode));
      if (savedMode === 'pickup') {
        dispatch(setRightDrawerOpen(true));
      }
    }
  }, [dispatch]);

  const handleSavePostcode = (code) => {
    setPostcode(code);
    localStorage.setItem('postcode', code);
    // Mark that user has explicitly set their location
    localStorage.setItem('userLocationSet', 'true');
  };

  const handleSwitchChange = (value) => {
    console.log('Switch changed to:', value);
    const newMode = value === 'Pickup' ? 'pickup' : 'delivery';
    const isDrawerOpen = value === 'Pickup';
    dispatch(setDeliveryMode(newMode));
    dispatch(setRightDrawerOpen(isDrawerOpen));
    localStorage.setItem('deliveryMode', newMode);
    console.log('Intended RightDrawer state:', isDrawerOpen);
  };

  const handleCloseRightDrawer = () => {
    dispatch(setRightDrawerOpen(false));
  };

  const { handleLogout } = useLogout();

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 shadow-sm border-b transition-colors ${
          isDark 
            ? 'border-slate-700 bg-slate-900' 
            : 'border-gray-200 bg-white'
        }`}
      >
        <DesktopNav
          postcode={postcode}
          burgerOpen={burgerOpen}
          setBurgerOpen={setBurgerOpen}
          handleSwitchChange={handleSwitchChange}
          mode={mode}
          setIsModalOpen={setIsModalOpen}
          setIsCartModalOpen={setIsCartModalOpen}
          setIsCheckOutModalOpen={setIsCheckOutModalOpen}
          isLoggedIn={isAuthenticated}
          handleLogout={handleLogout}
        />
        <MobileNav
          postcode={postcode}
          burgerOpen={burgerOpen}
          setBurgerOpen={setBurgerOpen}
          handleSwitchChange={handleSwitchChange}
          setIsModalOpen={setIsModalOpen}
          setIsCartModalOpen={setIsCartModalOpen}
          setIsCheckOutModalOpen={setIsCheckOutModalOpen}
          isLoggedIn={isAuthenticated}
        />
      </header>
      <BurgerMenu
        burgerOpen={burgerOpen}
        setBurgerOpen={setBurgerOpen}
        setIsEstimatedArrivalOpen={setIsEstimatedArrivalOpen}
        setIsStoreAddReviewOpen={setIsStoreAddReviewOpen}
        setIsOrderReceivedOpen={setIsOrderReceivedOpen}
      />
      <ModalContainer
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        postcode={postcode}
        handleSavePostcode={handleSavePostcode}
        isCartModalOpen={isCartModalOpen}
        setIsCartModalOpen={setIsCartModalOpen}
        isCheckOutModalOpen={isCheckOutModalOpen}
        setIsCheckOutModalOpen={setIsCheckOutModalOpen}
        isEstimatedArrivalOpen={isEstimatedArrivalOpen}
        setIsEstimatedArrivalOpen={setIsEstimatedArrivalOpen}
        isStoreAddReviewOpen={isStoreAddReviewOpen}
        setIsStoreAddReviewOpen={setIsStoreAddReviewOpen}
        isOrderReceivedOpen={isOrderReceivedOpen}
        setIsOrderReceivedOpen={setIsOrderReceivedOpen}
      />
      <DrawerContainer
        isDrawerOpen={isDrawerOpen}
        setDrawerOpen={setDrawerOpen}
        isRightDrawerOpen={isRightDrawerOpen}
        handleCloseRightDrawer={handleCloseRightDrawer}
      />
    </>
  );
}