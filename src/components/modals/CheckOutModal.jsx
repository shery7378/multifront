"use client";

import { useMemo, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { useModal } from "@/hooks/useModal";
import CloseXButton from "../UI/CloseXButton";
import Button from "../UI/Button";
import { FaCommentDots, FaEllipsis, FaTrash } from "react-icons/fa6";
import { FaTrashAlt } from "react-icons/fa";
import IconButton from "../UI/IconButton";
import { useSelector, useDispatch } from "react-redux";
import { removeItem, updateQuantity } from "@/store/slices/cartSlice";
import { useRouter } from "next/navigation";
import { groupItemsByStore } from "@/utils/cartUtils";
import { useI18n } from '@/contexts/I18nContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import InstantCheckoutButton from '@/components/InstantCheckout/InstantCheckoutButton';

export default function CheckOutModal({ isOpen, onClose }) {
  const { t } = useI18n();
  const { formatPrice } = useCurrency();
    const { shouldRender, animateClass } = useModal({ isOpen, onClose });
    const dispatch = useDispatch();
    const router = useRouter();
    const { items, total } = useSelector((state) => state.cart);
    const [isPending, startTransition] = useTransition();
    console.log(items, 'Check out modal');
    
    // Prefetch checkout route when modal opens to speed up navigation
    useEffect(() => {
        if (isOpen && items.length > 0) {
            router.prefetch("/check-out-delivery");
        }
    }, [isOpen, items.length, router]);
    
    // Group items by store
    const storesGrouped = useMemo(() => groupItemsByStore(items), [items]);
    const storeIds = Object.keys(storesGrouped);

    // Calculate subtotal dynamically
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    // Only show delivery fee and fees when cart has items
    const deliveryFee = items.length > 0 ? 2.29 : 0;
    const fees = items.length > 0 ? 2.09 : 0;
    const finalTotal = subtotal + deliveryFee + fees;

    if (!shouldRender) return null;

    // Handle quantity change for a specific item
    const handleQuantityChange = (item, newQuantity) => {
        if (newQuantity >= 1) {
            dispatch(updateQuantity({
                id: item.id,
                color: item.color,
                size: item.size,
                quantity: newQuantity
            }));
        } else {
            handleRemoveItem(item);
        }
    };

    // Handle item removal
    const handleRemoveItem = (item) => {
        dispatch(removeItem({
            id: item.id,
            color: item.color,
            size: item.size
        }));
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex">
            {/* Backdrop with fade animation */}
            <div
                className={`flex-1 bg-black/50 transition-opacity duration-400 ${isOpen ? "opacity-100" : "opacity-0"
                    }`}
                onClick={onClose}
            />

            {/* Drawer with slide animation */}
            <div
                className={`w-[400px] p-6 bg-white h-full shadow-lg flex flex-col justify-between transition-transform duration-400 ease-in-out ${animateClass}`}
            >
                {/* Content Section */}
                <div className="flex-grow overflow-y-auto">
                    <div className="relative">
                        <div className="flex justify-between text-gray-600 hover:text-gray-800">
                            <div onClick={onClose}>
                                <CloseXButton />
                            </div>
                            <IconButton
                                icon={FaEllipsis}
                                iconClasses="!text-black !w-3"
                                className="!min-w-6 !min-h-6 !text-xs"
                            />
                        </div>

                        {/* Products grouped by store */}
                        {items.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center">{t('common.yourCartIsEmpty')}</p>
                        ) : (
                            storeIds.map((storeId) => {
                                const storeGroup = storesGrouped[storeId];
                                const store = storeGroup.store;
                                const storeItems = storeGroup.items;
                                const storeTotal = storeItems.reduce(
                                    (sum, item) => sum + item.price * item.quantity, 
                                    0
                                );

                                return (
                                    <div key={storeId} className="mb-6">
                                        {/* Store Info */}
                                        <div className="flex items-center my-4 pb-3 border-b">
                                            {(() => {
                                                const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
                                                const storeLogoPath = store?.logo;
                                                const storeLogoSrc = storeLogoPath
                                                    ? `${base}/${String(storeLogoPath).replace(/^\/+/, '')}`
                                                    : '/images/stores/default-logo.png';
                                                
                                                return (
                                                    <img
                                                        src={storeLogoSrc}
                                                        alt={`${store?.name || "Store"} Logo`}
                                                        className="w-12 h-12 rounded-full mr-2 object-cover bg-gray-100"
                                                        onError={(e) => {
                                                            e.target.src = '/images/stores/default-logo.png';
                                                        }}
                                                    />
                                                );
                                            })()}
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-800">
                                                    {store?.name || t('common.unknownStore')}
                                                </h3>
                                                <p className="text-xs text-sonic-silver">
                                                    {store?.full_address || t('common.noAddressAvailable')}
                                                </p>
                                                {storeIds.length > 1 && (
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        {storeItems.length} {storeItems.length !== 1 ? t('common.items') : t('common.item')} • £{storeTotal.toFixed(2)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Store Items */}
                                        {storeItems.map((item) => (
                                <div key={`${item.product.id}-${item.color || 'no-color'}-${item.size || 'no-size'}`} className="border-b pb-4 mb-4">
                                    <div className="flex items-center">
                                        {(() => {
                                            const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
                                            const featuredPath = item.product.featured_image?.url || 
                                                               item.product.featured_image?.path ||
                                                               item.product.image ||
                                                               null;
                                            const productImage = featuredPath
                                                ? `${base}/${String(featuredPath).replace(/^\/+/, '')}`
                                                : '/images/NoImageLong.jpg';
                                            
                                            return (
                                                <img
                                                    src={productImage}
                                                    alt={item.product.name}
                                                    className="w-16 h-16 mr-4 object-cover bg-gray-100 rounded"
                                                    onError={(e) => {
                                                        e.target.src = '/images/NoImageLong.jpg';
                                                    }}
                                                />
                                            );
                                        })()}

                                        <div>
                                            <p className=" font-medium text-oxford-blue">
                                                {item.product.name}{" "}
                                                <span className="text-vivid-red">({formatPrice(item.price)})</span>
                                            </p>
                                            <p className="text-xs text-sonic-silver flex items-center gap-1">
                                                {item.color && (
                                                    <>
                                                        <span className="font-medium text-oxford-blue text-sm">Color:</span>
                                                        <span
                                                            className="w-4 h-4 rounded-full "
                                                            style={{ backgroundColor: item.color }}
                                                        />
                                                    </>
                                                )}

                                                {item.color && item.size && <span>|</span>}

                                                {item.size && (
                                                    <>
                                                        Size: {item.size}
                                                    </>
                                                )}
                                            </p>

                                            <p className="text-xs text-gray-500">
                                                {item.product?.description && item.product.description.length > 60
                                                    ? item.product.description.substring(0, item.product.description.lastIndexOf(" ", 60)) + "..."
                                                    : item.product?.description || ""}
                                            </p>

                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center border rounded">
                                            <button
                                                // onClick={() => handleRemoveItem(item.id)}
                                                onClick={() =>
                                                    handleQuantityChange(
                                                        item,
                                                        Math.max(0, item.quantity - 1)
                                                    )
                                                }
                                                className="px-3 h-9 flex items-center justify-center hover:bg-vivid-red hover:text-white cursor-pointer"
                                            >
                                                <FaTrashAlt className="h-3 w-4" />
                                            </button>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                readOnly
                                                className="w-10 h-full text-center border-l border-r appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                            />
                                            <button
                                                onClick={() =>
                                                    handleQuantityChange(item, item.quantity + 1)
                                                }
                                                className="px-3 py-1.5 hover:bg-vivid-red hover:text-white cursor-pointer"
                                            >
                                                +
                                            </button>
                                        </div>
                                        </div>
                                    </div>
                                        ))}
                                    </div>
                                );
                            })
                        )}

                        {/* Price Summary */}
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>{t('cart.subtotal')}:</span>
                                <span>£{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>{t('cart.deliveryFee')}:</span>
                                <span>£{deliveryFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>{t('cart.fees')}:</span>
                                <span>£{fees.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-medium border-t pt-2">
                                <span>{t('cart.total')}:</span>
                                <span>£{finalTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sticky Footer Buttons */}
                <div className="pt-4 space-y-2">
                    <InstantCheckoutButton className="w-full" />
                    <Button
                        fullWidth
                        variant="outline"
                        onClick={() => {
                            if (items.length > 0) {
                                // Use startTransition for non-blocking navigation
                                startTransition(() => {
                                    router.push("/check-out-delivery");
                                });
                            }
                        }}
                        className="rounded-md py-2 font-semibold"
                        disabled={items.length === 0 || isPending}
                    >
                        {isPending ? "Loading..." : "Go to Checkout"}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}