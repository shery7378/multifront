//src/components/SharedLayout.jsx
'use client';

import { useEffect, useState } from 'react';
import Footer from "@/components/Footer";
import FrontHeader from "@/components/FrontHeader";
import Topheader from "@/components/new-design/Topheader";

export default function SharedLayout({ children }) {
  const [headerHeight, setHeaderHeight] = useState(140);

  useEffect(() => {
    const updateHeaderHeight = () => {
      // Find the header element inside FrontHeader
      const header = document.querySelector('header');
      if (header) {
        setHeaderHeight(header.offsetHeight + 10); // Restored the buffer
      }
    };

    // Initial measurement
    const timeoutId = setTimeout(updateHeaderHeight, 100);
    
    // Update on resize
    window.addEventListener('resize', updateHeaderHeight);
    
    // MutationObserver to watch for dynamic changes (like mobile menu opening/closing)
    const observer = new MutationObserver(updateHeaderHeight);
    const header = document.querySelector('header');
    if (header) {
      observer.observe(header, { 
        childList: true, 
        subtree: true, 
        attributes: true
      });
    }

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen w-full">
      <Topheader />
      <FrontHeader />
      <main 
        className="flex-grow"
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
