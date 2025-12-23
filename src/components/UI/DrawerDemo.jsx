//src/components/UI/DrawerDemo.jsx
'use client';
import { useState, useEffect } from 'react';
import Drawer from './Drawer';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';


export default function DrawerDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false); // auto-close on route change
  }, [pathname]);

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={setIsOpen}
        position="left"
        swipeToOpen
      >
        <div className="p-4 w-72">
          <h2 className="text-xl font-bold mb-4">Drawer Menu</h2>
          <ul className="space-y-2">
            <li><a href="/" className="text-blue-600 hover:underline">Home</a></li>
            <li><a href="/about" className="text-blue-600 hover:underline">About</a></li>
            <li><a href="/contact" className="text-blue-600 hover:underline">Contact</a></li>
          </ul>
        </div>
      </Drawer>

      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed top-1/2 z-50 transform -translate-y-1/2
          w-10 h-16 bg-blue-600 text-white rounded-r-full
          flex items-center justify-center shadow-md
        `}
        animate={{ x: isOpen ? 256 - 20 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        aria-label="Toggle Drawer"
      >
        {isOpen ? (
          <ChevronLeftIcon className="w-6 h-6" />
        ) : (
          <ChevronRightIcon className="w-6 h-6" />
        )}
      </motion.button>
    </>
  );
}