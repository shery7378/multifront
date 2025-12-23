//src/components/modals/CartModal.jsx
"use client";

import { createPortal } from "react-dom";
import { useModal } from "@/hooks/useModal";
import CloseXButton from "../UI/CloseXButton";
import Button from "../UI/Button";
import { useRouter } from "next/navigation";

export default function EmptyCartModal({ isOpen, onClose }) {
    const { shouldRender, animateClass } = useModal({ isOpen, onClose });
    const router = useRouter();

    const handleFindProducts = () => {
        onClose();
        router.push('/home');
    };

    if (!shouldRender) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
                className="flex-1 bg-black/50 transition-opacity duration-400 opacity-100"
                onClick={onClose}
            />

            {/* Modal drawer */}
            <div
                className={`w-[400px] bg-white h-full shadow-lg transition-transform duration-400 ease-in-out ${animateClass}`}
            >
                <div className="p-6 relative h-full flex flex-col items-center justify-center">
                    <div
                        onClick={onClose}
                        className="absolute top-4 left-4 text-gray-600 hover:text-gray-800"
                    >
                        <CloseXButton />
                    </div>
                    <div className="text-center">
                        <img
                            src="/images/cart-illustration.png"
                            alt="Cart Illustration"
                            className="w-3/4 mx-auto mb-4"
                        />
                        <h2 className="text-xl font-semibold text-oxford-blue mb-2">
                            Add items to start a cart
                        </h2>
                        <p className="text-oxford-blue/60 text-xs mb-6">
                            Once you add items from a restaurant or store, your cart will appear here.
                        </p>

                        <Button fullWidth
                            onClick={handleFindProducts}
                            className=" rounded-md ">
                            Start Shopping
                        </Button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
