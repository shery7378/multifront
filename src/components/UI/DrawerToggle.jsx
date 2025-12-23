//src/components/UI/DrawerToggle.jsx
'use client';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

export default function DrawerToggle({ isOpen, toggle, offset = 300, position}) {
  return (
    <motion.button
      onClick={toggle}
      className={`
        fixed z-51
        w-10 h-10 bg-white text-black rounded-full
        flex items-center justify-center shadow-md cursor-pointer ${isOpen?'top-5 ':'-left-3 top-1/8 -translate-y-1/8'}`}
      animate={{ x: isOpen ? offset - 20 : 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      aria-label="Toggle Drawer"
    >
      {isOpen ? <ChevronLeftIcon className="w-6 h-6" /> : <ChevronRightIcon className="w-6 h-6" />}
    </motion.button>
  );
}
