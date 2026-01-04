"use client";

import { useMemo, useEffect, useTransition, useState } from "react";
import { createPortal } from "react-dom";
import { useModal } from "@/hooks/useModal";
import CloseXButton from "../UI/CloseXButton";
import Button from "../UI/Button";
import { FaCommentDots, FaEllipsis, FaTrash } from "react-icons/fa6";
import { MinusSmallIcon, PlusSmallIcon } from "@heroicons/react/24/outline";
import IconButton from "../UI/IconButton";
import { useSelector, useDispatch } from "react-redux";
import { removeItem, updateQuantity, clearCart } from "@/store/slices/cartSlice";
import { useRouter } from "next/navigation";
import { groupItemsByStore } from "@/utils/cartUtils";
import { useI18n } from '@/contexts/I18nContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import InstantCheckoutButton from '@/components/InstantCheckout/InstantCheckoutButton';
import { useGetRequest } from "@/controller/getRequests";

export default function CheckOutModal({ isOpen, onClose, onSwitchToEmptyCart }) {
  const { t } = useI18n();
  const { formatPrice, currency, currencyRates, defaultCurrency } = useCurrency();
    const { shouldRender, animateClass } = useModal({ isOpen, onClose });
    const dispatch = useDispatch();
    const router = useRouter();
    const { items, total } = useSelector((state) => state.cart);
    const [isPending, startTransition] = useTransition();
    const [hadItems, setHadItems] = useState(false);
    const [storeDataCache, setStoreDataCache] = useState({});
    const { sendGetRequest: getStore } = useGetRequest();
    console.log(items, 'Check out modal');
    
    // Track if cart had items when modal opened
    useEffect(() => {
        const safeItems = Array.isArray(items) ? items : [];
        if (isOpen) {
            setHadItems(safeItems.length > 0);
        }
    }, [isOpen]);

    // Prefetch checkout route when modal opens to speed up navigation
    useEffect(() => {
        const safeItems = Array.isArray(items) ? items : [];
        if (isOpen && safeItems.length > 0) {
            router.prefetch("/check-out-delivery");
        }
    }, [isOpen, items, router]);

    // Switch to EmptyCartModal when cart becomes empty (had items, now empty)
    useEffect(() => {
        const safeItems = Array.isArray(items) ? items : [];
        if (isOpen && hadItems && safeItems.length === 0 && onSwitchToEmptyCart) {
            // Small delay to allow the remove action to complete
            const timer = setTimeout(() => {
                onClose();
                onSwitchToEmptyCart();
            }, 1);
            return () => clearTimeout(timer);
        }
    }, [items, isOpen, hadItems, onClose, onSwitchToEmptyCart]);
    
    // Group items by store
    const storesGrouped = useMemo(() => groupItemsByStore(items || []), [items]);
    const storeIds = Object.keys(storesGrouped);

    // Fetch store data for stores that don't have complete information
    useEffect(() => {
        if (!isOpen || storeIds.length === 0) return;
        
        storeIds.forEach(storeId => {
            if (storeId === 'unknown') return;
            
            const storeGroup = storesGrouped[storeId];
            const store = storeGroup?.store;
            
            // Only fetch if store is missing or incomplete
            if (!store || !store.name || !store.address) {
                // Check if we already have this store in cache
                if (storeDataCache[storeId]) return;
                
                // Fetch store data
                getStore(`/stores/${storeId}`).then(response => {
                    if (response?.data) {
                        setStoreDataCache(prev => ({
                            ...prev,
                            [storeId]: response.data
                        }));
                    }
                }).catch(error => {
                    console.error(`Error fetching store ${storeId}:`, error);
                });
            }
        });
    }, [isOpen, storeIds, storesGrouped, storeDataCache, getStore]);

    // Calculate subtotal dynamically - ensure items is an array
    const safeItems = Array.isArray(items) ? items : [];
    const subtotal = safeItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
    
    // Calculate delivery fees dynamically from products/stores
    const deliveryFees = useMemo(() => {
        if (safeItems.length === 0) return { deliveryFee: 0, fees: 0 };
        
        // Get unique stores and calculate fees per store
        const storeFees = {};
        let totalDeliveryFee = 0;
        let totalFees = 0;
        
        storeIds.forEach(storeId => {
            if (storeId === 'unknown') {
                // Default fees for unknown stores
                totalDeliveryFee += 2.29;
                totalFees += 2.09;
                return;
            }
            
            const storeGroup = storesGrouped[storeId];
            const store = storeDataCache[storeId] || storeGroup?.store;
            const storeItems = storeGroup?.items || [];
            
            // Get delivery fee from first product in store (products can have different fees)
            const firstItem = storeItems[0];
            const product = firstItem?.product;
            
            // Try to get shipping charges from product
            const shippingCharge = product?.shipping_charge_regular || 
                                  product?.shipping_charge_same_day || 
                                  store?.shipping_charge_regular ||
                                  store?.shipping_charge_same_day ||
                                  2.29; // Default
            
            // Calculate fees (commission, etc.) - could be from product or store settings
            const fees = product?.fees || store?.fees || 2.09; // Default
            
            totalDeliveryFee += shippingCharge;
            totalFees += fees;
        });
        
        return {
            deliveryFee: totalDeliveryFee,
            fees: totalFees
        };
    }, [safeItems, storeIds, storesGrouped, storeDataCache]);
    
    // Convert delivery fee and fees to selected currency if needed
    const deliveryFee = currency !== defaultCurrency && currencyRates[currency] 
        ? deliveryFees.deliveryFee * currencyRates[currency] 
        : deliveryFees.deliveryFee;
    const fees = currency !== defaultCurrency && currencyRates[currency] 
        ? deliveryFees.fees * currencyRates[currency] 
        : deliveryFees.fees;
    
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

    // Handle clear cart
    const handleClearCart = () => {
        dispatch(clearCart());
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
                        {safeItems.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center">{t('common.yourCartIsEmpty')}</p>
                        ) : (
                            storeIds.map((storeId) => {
                                const storeGroup = storesGrouped[storeId];
                                // Use cached store data if available, otherwise use store from group
                                let store = storeDataCache[storeId] || storeGroup.store;
                                
                                // If store is null, try to get it from the first item's product
                                if (!store && storeGroup.items.length > 0) {
                                    store = storeGroup.items[0]?.product?.store || null;
                                }
                                
                                const storeItems = storeGroup.items;
                                const storeTotal = storeItems.reduce(
                                    (sum, item) => sum + item.price * item.quantity, 
                                    0
                                );
                                
                                // Extract store name - try multiple possible fields
                                const storeName = store?.name || 
                                                 store?.store_name || 
                                                 store?.vendor?.name || 
                                                 store?.vendor_name ||
                                                 (storeId !== 'unknown' ? `Store #${storeId}` : null);
                                
                                // Extract store address - try multiple possible fields
                                let storeAddress = null;
                                if (store?.full_address) {
                                    storeAddress = store.full_address;
                                } else if (store?.address) {
                                    storeAddress = store.address;
                                } else if (store?.location) {
                                    storeAddress = store.location;
                                } else if (store?.street && store?.city) {
                                    storeAddress = `${store.street}, ${store.city}`;
                                } else if (store?.address_line_1 && store?.city) {
                                    storeAddress = `${store.address_line_1}, ${store.city}`;
                                } else if (store?.city && store?.country) {
                                    storeAddress = `${store.city}, ${store.country}`;
                                } else if (store?.city) {
                                    storeAddress = store.city;
                                } else if (store?.country) {
                                    storeAddress = store.country;
                                }
                                
                                // Build full address from components if available
                                if (!storeAddress && store) {
                                    const addressParts = [
                                        store.address_line_1,
                                        store.address_line_2,
                                        store.street,
                                        store.city,
                                        store.state,
                                        store.postcode,
                                        store.country
                                    ].filter(Boolean);
                                    
                                    if (addressParts.length > 0) {
                                        storeAddress = addressParts.join(', ');
                                    }
                                }

                                return (
                                    <div key={storeId} className="mb-6">
                                        {/* Store Info */}
                                        <div className="flex items-center my-4 pb-3 border-b">
                                            {(() => {
                                                const buildStoreLogoUrl = (logoPath) => {
                                                    if (!logoPath) return '/images/stores/default-logo.png';
                                                    if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
                                                        return logoPath;
                                                    }
                                                    const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
                                                    if (base) {
                                                        return logoPath.startsWith('/') ? `${base}${logoPath}` : `${base}/${logoPath}`;
                                                    }
                                                    return logoPath.startsWith('/') ? logoPath : `/${logoPath}`;
                                                };
                                                
                                                const storeLogoPath = store?.logo || store?.logo_url || store?.image;
                                                const storeLogoSrc = buildStoreLogoUrl(storeLogoPath);
                                                
                                                return (
                                                    <img
                                                        src={storeLogoSrc}
                                                        alt={`${storeName || "Store"} Logo`}
                                                        className="w-12 h-12 rounded-full mr-2 object-fill bg-gray-100"
                                                        onError={(e) => {
                                                            e.target.src = '/images/stores/default-logo.png';
                                                        }}
                                                    />
                                                );
                                            })()}
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-800">
                                                    {storeName || t('common.unknownStore')}
                                                </h3>
                                                <p className="text-xs text-sonic-silver">
                                                    {storeAddress || t('common.noAddressAvailable')}
                                                </p>
                                                {storeIds.length > 1 && (
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        {storeItems.length} {storeItems.length !== 1 ? t('common.items') : t('common.item')} • {formatPrice(storeTotal)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Store Items */}
                                        {storeItems.map((item) => (
                                <div key={`${item.product.id}-${item.color || 'no-color'}-${item.size || 'no-size'}`} className="border-b pb-4 mb-4">
                                    <div className="flex items-center">
                                        {(() => {
                                            const buildImageUrl = (url) => {
                                                if (!url) return '/images/NoImageLong.jpg';
                                                if (url.startsWith('http://') || url.startsWith('https://')) return url;
                                                const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
                                                if (apiBase) {
                                                    return url.startsWith('/') ? `${apiBase}${url}` : `${apiBase}/${url}`;
                                                }
                                                return url.startsWith('/') ? url : `/${url}`;
                                            };
                                            
                                            const featuredPath = item.product.featured_image?.url || 
                                                               item.product.featured_image?.path ||
                                                               item.product.image ||
                                                               null;
                                            const productImage = buildImageUrl(featuredPath);
                                            
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
                                                onClick={() =>
                                                    handleQuantityChange(
                                                        item,
                                                        Math.max(1, item.quantity - 1)
                                                    )
                                                }
                                                disabled={item.quantity <= 1}
                                                className="px-3 h-9 flex items-center justify-center hover:bg-vivid-red hover:text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <MinusSmallIcon className="h-4 w-4" />
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
                                                className="px-3 h-9 flex items-center justify-center hover:bg-vivid-red hover:text-white cursor-pointer"
                                            >
                                                <PlusSmallIcon className="h-4 w-4" />
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
                                <span>{formatPrice(subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>{t('cart.deliveryFee')}:</span>
                                <span>{formatPrice(deliveryFee)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>{t('cart.fees')}:</span>
                                <span>{formatPrice(fees)}</span>
                            </div>
                            <div className="flex justify-between font-medium border-t pt-2">
                                <span>{t('cart.total')}:</span>
                                <span>{formatPrice(finalTotal)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sticky Footer Buttons */}
                <div className="pt-4 space-y-2">
                    {safeItems.length > 0 && (
                        <Button
                            fullWidth
                            variant="simple"
                            onClick={handleClearCart}
                            className="rounded-md py-2 font-semibold text-vivid-red hover:bg-red-50 border border-red-200"
                        >
                            Clear Cart
                        </Button>
                    )}
                    <InstantCheckoutButton className="w-full" />
                    <Button
                        fullWidth
                        variant="outline"
                        onClick={() => {
                            if (safeItems.length > 0) {
                                // Use startTransition for non-blocking navigation
                                startTransition(() => {
                                    router.push("/check-out-delivery");
                                });
                            }
                        }}
                        className="rounded-md py-2 font-semibold"
                        disabled={safeItems.length === 0 || isPending}
                    >
                        {isPending ? "Loading..." : "Go to Checkout"}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}