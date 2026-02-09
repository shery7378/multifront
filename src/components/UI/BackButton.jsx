//src/components/UI/BackButton.jsx
"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useI18n } from '@/contexts/I18nContext';

export default function BackButton({ onBack, iconClasses, showLabel = true, variant = "default", label }) {
  const router = useRouter();
  const { t } = useI18n();

  const handleBack = () => {
    if (onBack && typeof onBack === "function") {
      onBack();
    } else {
      router.back();
    }
  };

  // Variant styles
  const variants = {
    default: {
      button: "bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-[#F24E2E] shadow-md hover:shadow-lg",
      icon: "text-gray-700 group-hover:text-[#F24E2E]",
      label: "text-gray-700 group-hover:text-[#F24E2E]"
    },
    gradient: {
      button: "bg-gradient-to-r from-[#F24E2E] to-orange-500 hover:from-[#e03e1e] hover:to-orange-600 shadow-lg hover:shadow-xl",
      icon: "text-white",
      label: "text-white font-semibold"
    },
    minimal: {
      button: "bg-transparent hover:bg-gray-100 border-0",
      icon: "text-gray-600 hover:text-[#F24E2E]",
      label: "text-gray-600 hover:text-[#F24E2E]"
    },
    outlined: {
      button: "bg-transparent border-2 border-[#F24E2E] hover:bg-[#F24E2E] shadow-sm hover:shadow-md",
      icon: "text-[#F24E2E] group-hover:text-white",
      label: "text-[#F24E2E] group-hover:text-white font-medium"
    },
    circular: {
      button: "bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 shadow-md hover:shadow-lg w-12 h-12 rounded-full flex items-center justify-center",
      icon: "text-gray-700 group-hover:text-[#F24E2E]",
      label: "text-gray-700 group-hover:text-[#F24E2E] font-medium"
    }
  };

  const currentVariant = variants[variant] || variants.default;

  return (
    <div className="flex items-center gap-3">
      <motion.button
        onClick={handleBack}
        whileHover={{ scale: 1.05, x: -2 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`
          group relative transition-all duration-300 ease-in-out
          ${currentVariant.button}
        `}
      >
        {/* Animated Arrow Icon */}
        <motion.div
          animate={{ x: [0, -3, 0] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
          className="relative"
        >
          <ChevronLeftIcon className={`w-5 h-5 ${currentVariant.icon} transition-colors duration-300 ${iconClasses || ''}`} />
        </motion.div>

        {/* Hover Effect Glow */}
        <motion.div
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#F24E2E]/20 to-orange-500/20 opacity-0 group-hover:opacity-100 blur-xl -z-10"
          transition={{ duration: 0.3 }}
        />

        {/* Ripple Effect on Click */}
        <motion.div
          className="absolute inset-0 rounded-xl bg-[#F24E2E]/30"
          initial={{ scale: 0, opacity: 0.5 }}
          whileTap={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.4 }}
        />
      </motion.button>

      {/* Label Text - shown separately for circular variant */}
      {showLabel && variant === 'circular' && (
        <motion.span
          className={`text-sm ${currentVariant.label} transition-colors duration-300`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {label || t('common.back') || 'Back'}
        </motion.span>
      )}

      {/* Label Text - shown inline for other variants */}
      {showLabel && variant !== 'circular' && (
        <motion.span
          className={`text-sm font-medium ${currentVariant.label} transition-colors duration-300 hidden sm:inline-block`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {label || t('common.back') || 'Back'}
        </motion.span>
      )}
    </div>
  );
}