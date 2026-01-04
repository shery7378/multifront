// src/components/modals/ProductPageModal.jsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CloseXButton from "../UI/CloseXButton";
import IconButton from "../UI/IconButton";
import { ShareIcon } from "@heroicons/react/24/outline";
import { FaRecycle, FaRepeat, FaTruckFast } from "react-icons/fa6";
import CheckOutModal from "./CheckOutModal";
import { useDispatch } from "react-redux";
import { addItem } from "../../store/slices/cartSlice";
import Image from "next/image";
import ResponsiveText from "../UI/ResponsiveText";
import { useGetRequest } from "@/controller/getRequests";
import ReviewSlider from "@/components/ReviewSlider";
import { useI18n } from '@/contexts/I18nContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import SubscriptionButton from '@/components/Subscriptions/SubscriptionButton';
import BuyNowButton from '@/components/InstantCheckout/BuyNowButton';
import { useSelector } from 'react-redux';

export default function ProductPageModal({ isOpen, onClose, product }) {
  const { t } = useI18n();
  const { formatPrice } = useCurrency();
    const [quantity, setQuantity] = useState(1);
    const [size, setSize] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
    const [colorsArray, setColorsArray] = useState([]);
    const [sizeArray, setSizeArray] = useState([]);
    const [batteryLife, setBatteryLife] = useState(0);
    const [storage, setStorage] = useState('');
    const [ram, setRam] = useState('');
    const [reloadKey, setReloadKey] = useState(0);
    const [reviews, setReviews] = useState([]);

    const {
        data: ratingData,
        error: ratingError,
        loading: ratingLoading,
        sendGetRequest: getRating,
    } = useGetRequest();

    const {
        data: vendorData,
        error: vendorError,
        loading: vendorLoading,
        sendGetRequest: getVendorRating,
    } = useGetRequest();

    const {
        data: storeData,
        error: storeError,
        loading: storeLoading,
        sendGetRequest: getStoreData,
    } = useGetRequest();

    const dispatch = useDispatch();

    // console.log(product, 'product from product page')
    useEffect(() => {
        if (product?.product_attributes?.length) {
            const colorValues = product.product_attributes
                .filter(item => item.variant_id == null && item.attribute_name === 'Color')
                .map(item => {
                    if (Array.isArray(item.attribute_value)) {
                        return item.attribute_value.map(v => v.toLowerCase());
                    }
                    return item.attribute_value?.toLowerCase();
                });

            // Battery Life (single number)
            const batteryLifeValue = product.product_attributes.find(
                item => item.variant_id == null && item.attribute_name === 'Battery Life'
            );
            setBatteryLife(Number(batteryLifeValue?.attribute_value) || 0); // fallback to 0 if invalid

            // Storage
            const storageValue = product.product_attributes
                .filter(item => item.variant_id == null && item.attribute_name === 'Storage')
                .map(item => item.attribute_value);

            // RAM
            const ramValue = product.product_attributes
                .filter(item => item.variant_id == null && item.attribute_name === 'RAM')
                .map(item => item.attribute_value);

            const sizeValues = product.product_attributes
                .filter(item => item.variant_id == null && item.attribute_name === 'Size')
                .map(item => item.attribute_value);

            setColorsArray(colorValues.flat().filter(Boolean));
            setSizeArray(sizeValues.flat().filter(Boolean));
            setStorage([...new Set(storageValue.filter(Boolean))]);
            setRam([...new Set(ramValue.filter(Boolean))]);
        }
    }, [product]);

    useEffect(() => {
        if (product?.id) {
            getRating(`/products/${product.id}/rating`);
        }
        
        // For store-based vendors
        if (product?.store?.id || product?.store?.slug || product?.store_id) {
            const storeId = product?.store?.id || product?.store?.slug || product?.store_id;
            getVendorRating(`/stores/${storeId}/rating`);
            // Fetch store data to get user_id if not already available
            if (!product?.store?.user_id) {
                getStoreData(`/stores/${storeId}`);
            }
        }
        // For individual sellers - try to get rating if seller info is available
        else if (product?.user_id || product?.seller_id || product?.seller?.id) {
            const sellerId = product?.user_id || product?.seller_id || product?.seller?.id;
            // Individual sellers might not have a store rating endpoint, but we can try
            // or use product rating as fallback
        }
    }, [product, getRating, getVendorRating, getStoreData]);

    useEffect(() => {
        if (colorsArray.length > 0 && !selectedColor) {
            setSelectedColor(colorsArray[0]);
        }
    }, [colorsArray, selectedColor]);

    const handleQuantityChange = (e) => {
        setQuantity(Math.max(1, parseInt(e.target.value) || 1));
    };

    const handleAddToCart = () => {
        const numericBase = Number(product?.price_tax_excl || product?.price || 0);
        const numericFlash = product?.flash_price != null ? Number(product.flash_price) : null;
        const chosenPrice = Number.isFinite(numericFlash) ? numericFlash : numericBase;

        // Extract store information from product
        let storeInfo = null;
        if (product.store) {
            if (Array.isArray(product.store) && product.store.length > 0) {
                storeInfo = product.store[0];
            } else if (typeof product.store === 'object' && !Array.isArray(product.store)) {
                storeInfo = product.store;
            }
        }

        const payload = {
            id: product.id,
            product,
            price: chosenPrice,
            quantity,
            ...(size ? { size } : {}),
            color: selectedColor,
            batteryLife,
            storage: storage[0],
            ram: ram[0],
            // Include store information
            ...(storeInfo && { store: storeInfo }),
            ...(product.store_id && { storeId: product.store_id }),
            ...(storeInfo?.id && { storeId: storeInfo.id }),
            // Include shipping charges for dynamic fee calculation
            ...(product.shipping_charge_regular && { shipping_charge_regular: product.shipping_charge_regular }),
            ...(product.shipping_charge_same_day && { shipping_charge_same_day: product.shipping_charge_same_day }),
        };

        console.log("Dispatching addItem with payload:", payload);
        dispatch(addItem(payload));
        onClose();
    };


    if (!isOpen || !product) return null;

    return createPortal(
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-50">
                <div className="bg-white rounded-2xl ring-4 ring-gray-800/40 max-w-6xl w-full p-6 max-h-[90vh] overflow-y-auto relative shadow">
                    <div className="flex justify-between">
                        <CloseXButton onClick={onClose} />
                        <IconButton icon={ShareIcon} className="!min-w-8 !min-h-8" iconClasses="!w-4 !h-4 !text-black" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                        <div className="grid grid-cols-[120px_1fr] md:col-span-2 gap-4">

                            <div className="flex flex-col gap-3 order-2 md:order-1">
                                {product.images.map((image, index) => (
                                    <div className="bg-gray-100 border border-gray-200 rounded-md p-2 w-[120px] h-[96px] flex items-center justify-center" key={index}>
                                        <img
                                            src={
                                                image?.url
                                                    ? (image.url.startsWith('http://') || image.url.startsWith('https://'))
                                                      ? image.url
                                                      : `${process.env.NEXT_PUBLIC_API_URL}/${image.url.replace(/^\//, '')}`
                                                    : '/images/NoImageLong.jpg'
                                            }
                                            alt={image.alt_text}
                                            className="object-contain w-[96px] h-[80px]"
                                            loading="lazy"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="order-1 md:order-2 w-full p-3 bg-gray-100 rounded-lg min-h-[420px] flex items-center justify-center">
                                <img src={
                                    product?.featured_image?.url
                                        ? (product.featured_image.url.startsWith('http://') || product.featured_image.url.startsWith('https://'))
                                          ? product.featured_image.url
                                          : `${process.env.NEXT_PUBLIC_API_URL}/${product.featured_image.url.replace(/^\//, '')}`
                                        : '/images/NoImageLong.jpg'
                                } alt={product.name} className="object-contain w-full max-h-[420px]" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-[22px] font-bold text-slate-900">{product.name}</h1>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => {
                                        const starValue = i + 1;
                                        const avgRating = ratingData?.data?.average_rating || 0;
                                        const isFilled = starValue <= Math.floor(avgRating);
                                        const isHalfFilled = !isFilled && (starValue - 0.5) <= avgRating;
                                        return (
                                            <div key={i} className="relative w-4 h-4">

                                                <svg className="w-4 h-4 absolute top-0 left-0 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.357 2.44a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.357-2.44a1 1 0 00-1.175 0l-3.357 2.44c-.784.57-1.838-.197-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.314 9.397c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.97z" />
                                                </svg>
                                                <div className="absolute top-0 left-0 overflow-hidden" style={{ width: isFilled ? '100%' : isHalfFilled ? '50%' : '0%' }}>
                                                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.357 2.44a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.357-2.44a1 1 0 00-1.175 0l-3.357 2.44c-.784.57-1.838-.197-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.314 9.397c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.97z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex items-center text-sm text-gray-500 gap-2">
                                    <span>({ratingData?.data?.review_count || 0} {t('common.reviews')})</span>
                                    <span className="mx-2 h-4 w-px bg-gray-300"></span>
                                    <span className="text-green-600">{t('common.inStock')}</span>
                                </div>
                            </div>

                            <div className="mt-1 flex items-center space-x-3">
                                <span className="text-2xl font-bold text-[#F24E2E]">{formatPrice(product.price_tax_excl)}</span>
                                <span className="text-sm text-gray-400 line-through">{formatPrice(product.compared_price)}</span>
                            </div>

                            <p className="text-gray-600 text-[15px]">
                                {product.description}
                            </p>

                            <div className="space-y-2 font-semibold">
                                {colorsArray.length > 0 && (
                                    <div>
                                        <label className="block text-slate-900">Colors:</label>
                                        <div className="flex space-x-3">
                                            {colorsArray.map((color) => (
                                                <button
                                                    key={color}
                                                    onClick={() => setSelectedColor(color)}
                                                    className={`
                                                                w-6 h-6 rounded-full border-2 cursor-pointer
                                                                ${selectedColor === color ? "border-[#F24E2E] ring-2 ring-[#F24E2E]/40" : "border-gray-300"}
                                                            `}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {(storage || ram || batteryLife) && (
                                    <div>
                                        <label className="block text-slate-900">Variants</label>
                                        <div className="flex gap-2">
                                            <button
                                                className={`px-3 py-1 border rounded cursor-pointer bg-white text-black`}
                                            >
                                                <span className=" text-gray-500">{storage} - {ram} - {batteryLife} Hr.</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {sizeArray.length > 0 && (
                                    <div>
                                        <label className="block text-slate-900">Size:</label>
                                        <div className="flex gap-2">
                                            {sizeArray.map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => setSize(s)}
                                                    className={`
                                                                px-3 py-1 border rounded-md cursor-pointer min-w-[36px]
                                                                ${size === s ? "bg-[#F24E2E] text-white border-[#F24E2E]" : "bg-white text-black border-gray-300"}
                                                            `}
                                                >
                                                    <span className=" text-gray-700">{s}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden h-10">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="px-3 text-lg hover:bg-gray-100 cursor-pointer"
                                        >
                                            −
                                        </button>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={handleQuantityChange}
                                            className="w-12 h-full text-center border-l border-r border-gray-300 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                        />
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="px-3 text-lg hover:bg-gray-100 cursor-pointer"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleAddToCart}
                                        className="flex-1 bg-[#F24E2E] hover:brightness-110 text-white h-10 px-5 rounded-md min-w-[160px]"
                                    >
                                        {t('product.addToCart')}
                                    </button>
                                </div>
                                
                                {/* Buy Now Button */}
                                <div className="mt-2">
                                    <BuyNowButton 
                                        product={product}
                                        quantity={quantity}
                                        className="w-full"
                                    />
                                </div>
                                
                                {/* Subscription Button */}
                                <div className="mt-2">
                                    <SubscriptionButton 
                                        product={product} 
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                                <div className="flex gap-3 items-start">
                                    <FaTruckFast className="text-2xl" />
                                    <div className="flex-1">
                                        <h3 className="text-sm font-medium text-slate-900">{product?.store?.name || product?.seller?.name || 'Seller'}</h3>
                                        <p className="text-xs text-gray-600">{t('common.vendorRating')}: {Number(vendorData?.data?.bayesian_rating ?? product?.store?.rating ?? product?.seller?.rating ?? 0).toFixed(2)}/5</p>
                                        <p className="text-xs text-gray-500">{t('checkout.enterPostalCode')}</p>
                                        {/* Always show contact button - we'll find the vendor/seller ID when clicked */}
                                        <button
                                                onClick={async () => {
                                                    if (!product) {
                                                        console.error('Product is not available');
                                                        return;
                                                    }
                                                    
                                                    console.log('Contact button clicked. Product data:', {
                                                        product_id: product?.id,
                                                        store: product?.store,
                                                        store_id: product?.store_id,
                                                        user_id: product?.user_id,
                                                        seller_id: product?.seller_id,
                                                        seller: product?.seller,
                                                        storeData: storeData?.data
                                                    });
                                                    
                                                    // For individual sellers: check product.user_id, product.seller_id, or product.seller
                                                    let vendorUserId = product?.user_id || product?.seller_id || product?.seller?.id || product?.seller?.user_id;
                                                    
                                                    // For store-based vendors: get from store
                                                    if (!vendorUserId) {
                                                        const storeId = product?.store?.id || product?.store?.slug || product?.store_id;
                                                        vendorUserId = product?.store?.user_id || storeData?.data?.user_id;
                                                        
                                                        // If still no user_id, fetch store data on click
                                                        if (!vendorUserId && storeId) {
                                                            try {
                                                                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/stores/${storeId}`);
                                                                const data = await response.json();
                                                                vendorUserId = data?.data?.user_id;
                                                                console.log('Fetched store data:', data);
                                                            } catch (error) {
                                                                console.error('Error fetching store user_id:', error);
                                                            }
                                                        }
                                                    }
                                                    
                                                    if (vendorUserId) {
                                                        // Trigger Daraz chat widget to open with vendor/seller
                                                        const event = new CustomEvent('openVendorChat', {
                                                            detail: { vendorId: vendorUserId }
                                                        });
                                                        window.dispatchEvent(event);
                                                    } else {
                                                        console.warn('Could not find vendor/seller user_id for product:', product?.id);
                                                        alert('Unable to find seller information. Please try again later.');
                                                    }
                                                }}
                                                className="mt-2 w-full bg-primary hover:bg-primary-dark text-white text-sm py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                                {t('product.contactVendor') || 'Contact Vendor'}
                                            </button>
                                    </div>
                                </div>
                                <hr className="border-gray-200" />
                                <div className="flex gap-3 items-start">
                                    <FaRepeat className="text-2xl" />
                                    <div>
                                        <h3 className="text-sm font-medium text-slate-900">Return Delivery</h3>
                                        <p className="text-xs text-gray-500">Free 30 Days Delivery Returns. Details</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <ReviewSlider productId={product.id} />
                    </div>
                </div>
            </div>

            <CheckOutModal isOpen={isCheckOutModalOpen} onClose={() => setIsCheckOutModalOpen(false)} />
        </>,
        document.body
    );
}