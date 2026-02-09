//src/components/SharedLayout.jsx
'use client';

import { useEffect, useState } from 'react';
import Footer from "@/components/Footer";
import FrontHeader from "@/components/FrontHeader";

export default function SharedLayout({ children }) {
  const [headerHeight, setHeaderHeight] = useState(250);

  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.querySelector('header[class*="fixed"]');
      if (header) {
        const height = header.offsetHeight;
        setHeaderHeight(height + 10); // Add 10px buffer
      }
    };

    // Initial measurement after render
    const timeoutId = setTimeout(updateHeaderHeight, 100);
    
    // Update on resize
    window.addEventListener('resize', updateHeaderHeight);
    
    // Use MutationObserver to watch for header changes
    const observer = new MutationObserver(updateHeaderHeight);
    const header = document.querySelector('header[class*="fixed"]');
    if (header) {
      observer.observe(header, { 
        childList: true, 
        subtree: true, 
        attributes: true,
        attributeFilter: ['class']
      });
    }

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="">
          <FrontHeader />
          <main 
            style={{ paddingTop: `${headerHeight}px` }} 
            className="pt-[250px] sm:pt-[200px] md:pt-[180px] lg:pt-6"
          >
            {children}
          </main>
          <Footer />
        </div>
  );
}
