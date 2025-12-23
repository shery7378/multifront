//src/components/UI/Modal.jsx
'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CloseXButton from './CloseXButton';
import ResponsiveText from './ResponsiveText'; // Assuming ResponsiveText is at the same level

export default function Modal({
    isOpen,
    onClose,
    title,
    icon = null,
    children,
    actions,
    showCloseButton = true,
    className = '',
    backdropClass = '',
    header = null,
    footer = null,
    titleClassName = '', // Updated to accept custom class for title
}) {
    const modalRef = useRef(null);

    // Prevent background scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // ESC key close
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        if (isOpen && modalRef.current) {
            window.addEventListener('keydown', handleKey);
        }
        return () => {
            window.removeEventListener('keydown', handleKey); // Safe to call even if not added
        };
    }, [isOpen, onClose]);

    // Trap focus inside modal
    useEffect(() => {
        if (!isOpen || !modalRef.current) return;

        const selectors = [
            'a[href]', 'button', 'textarea', 'input', 'select', '[tabindex]:not([tabindex="-1"])'
        ];
        const focusables = modalRef.current.querySelectorAll(selectors.join(','));
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        const trap = (e) => {
            if (e.key !== 'Tab') return;
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last?.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first?.focus();
            }
        };

        modalRef.current.addEventListener('keydown', trap);
        first?.focus();

        return () => {
            if (modalRef.current) {
                modalRef.current.removeEventListener('keydown', trap); // Only remove if ref exists
            }
        };
    }, [isOpen]);

    if (typeof window === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={`fixed inset-0 z-[60] flex items-center justify-center ${backdropClass || 'bg-black/40'}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        ref={modalRef}
                        className={`
              bg-white shadow-xl relative
              w-full max-w-lg mx-4 rounded-2xl
              max-h-[95vh] overflow-hidden flex flex-col
              sm:rounded-2xl sm:mx-auto sm:max-h-[80vh]
              ${className}
            `}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between px-6 pt-4 ">
                            {header ? (
                                <div className="w-full">{header}</div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    {icon && <div className="text-xl text-vivid-red">{icon}</div>}
                                    {title && (
                                        <ResponsiveText
                                            as="h2"
                                            minSize="1.5rem"
                                            maxSize="2.083rem"
                                            className={`font-bold text-oxford-blue ${titleClassName}`}
                                        >
                                            {title}
                                        </ResponsiveText>
                                    )}
                                </div>
                            )}
                            {showCloseButton && (
                                <CloseXButton onClick={onClose} className="text-black hover:text-vivid-red" />
                            )}
                        </div>

                        {/* Body scrollable */}
                        <div className="px-6 py-2 overflow-y-auto flex-1 custom-scrollbar">
                            {children}
                        </div>

                        {/* Footer */}
                        {(footer || actions) && (
                            <div className="px-6 py-2 flex justify-end gap-2">
                                {footer || actions}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

// A Use case 

{/* <>
    <Button onClick={() => setOpen(true)} className="bg-vivid-red text-white">
        Delete Item
    </Button>

    <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        //header={customHeader} // Using custom header
        title="Confirm Delete"
        icon={<FaTrash />}
        actions={[
            <Button key="cancel" onClick={() => setOpen(false)} className="bg-gray-300">
                Cancel
            </Button>,
            <Button
                key="delete"
                onClick={() => {
                    alert('Deleted');
                    setOpen(false);
                }}
                className="bg-vivid-red text-white"
            >
                Delete
            </Button>,
        ]}
    >
        <p className="text-gray-700">
            Are you sure you want to delete this item? This action cannot be undone.
        </p>
    </Modal>
</> */}