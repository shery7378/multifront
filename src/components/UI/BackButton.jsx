//src/components/UI/BackButton.jsx
"use client";

import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useI18n } from '@/contexts/I18nContext';

export default function BackButton({ onBack, iconClasses, showLabel = true, variant = "circular", label }) {
  const router = useRouter();
  const { t } = useI18n();

  const handleBack = () => {
    if (onBack && typeof onBack === "function") {
      onBack();
    } else {
      router.back();
    }
  };

  // Variant styles - "this" one is specific circular
  const variants = {
    circular: {
      button: "w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:border-gray-300 hover:bg-gray-100 transition-colors shadow-sm",
      icon: "w-5 h-5 text-gray-600",
      label: "hidden" 
    },
    default: {
      button: "bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 shadow-sm w-10 h-10 rounded-full flex items-center justify-center",
      icon: "w-5 h-5 text-gray-700",
      label: "text-gray-700 font-medium ml-2"
    }
  };

  const currentVariant = variants[variant] || variants.circular;

  return (
    <div className="flex items-center group cursor-pointer" onClick={handleBack}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={currentVariant.button}
      >
        <ChevronLeftIcon className={`${currentVariant.icon} ${iconClasses || ''}`} />
      </motion.button>
      
      {/* Optional Label - always hidden for circular variant */}
      {showLabel && variant !== 'circular' && (
        <span className={currentVariant.label}>
          {label || t('common.back') || 'Back'}
        </span>
      )}
    </div>
  );
}