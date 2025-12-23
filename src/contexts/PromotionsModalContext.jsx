'use client';
import { createContext, useContext, useState } from 'react';

const PromotionsModalContext = createContext();

export function PromotionsModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <PromotionsModalContext.Provider value={{ isOpen, openModal, closeModal, setIsOpen }}>
      {children}
    </PromotionsModalContext.Provider>
  );
}

export function usePromotionsModal() {
  const context = useContext(PromotionsModalContext);
  if (!context) {
    // Return a fallback that won't crash the app
    console.warn('usePromotionsModal must be used within PromotionsModalProvider');
    return {
      isOpen: false,
      openModal: () => console.warn('PromotionsModalProvider not found'),
      closeModal: () => {},
      setIsOpen: () => {},
    };
  }
  return context;
}

