// src/components/CartSummary.jsx
"use client";

import React, { useState } from "react";
import Button from "@/components/UI/Button";
import Accordion from "@/components/UI/Accordion";
import { FaTrashAlt } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { removeItem, updateQuantity } from "../store/slices/cartSlice";
import { useI18n } from '@/contexts/I18nContext';
import { useCurrency } from '@/contexts/CurrencyContext';

const CartSummary = () => {
  const { t } = useI18n();
  const { formatPrice } = useCurrency();
  const dispatch = useDispatch();
  const { items, total } = useSelector((state) => state.cart);
  const [expandedItems, setExpandedItems] = useState({});

  // Toggle description expansion
  const toggleDescription = (itemKey) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemKey]: !prev[itemKey]
    }));
  };

  // Common function to handle quantity change or removal
  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity >= 1) {
      dispatch(updateQuantity({
        id: item.id,
        color: item.color,
        size: item.size,
        quantity: newQuantity
      }));
    } else {
      dispatch(removeItem({
        id: item.id,
        color: item.color,
        size: item.size
      }));
    }
  };

  return (
    <Accordion title={`${t('cart.cartSummary')} (${items.length} ${items.length !== 1 ? t('common.items') : t('common.item')})`}>
      {items.length > 0 ? (
        <>
          {items.map((item) => {
            const itemKey = `${item.id}-${item.color || 'no-color'}-${item.size || 'no-size'}`;
            const isExpanded = expandedItems[itemKey];
            const productName = item.product?.name || item.name || 'Product';
            const description = item.product?.description || '';
            const shouldTruncate = description.length > 60;
            const displayDescription = isExpanded || !shouldTruncate 
              ? description 
              : description.substring(0, description.lastIndexOf(" ", 60)) + "...";
            
            return (
              <div key={itemKey} className="flex items-start space-x-4 pb-4 mb-4 border-b last:border-b-0">
                <div className="flex items-start gap-4 w-full">
                  <div className="w-[95px] h-[94px] p-2 bg-cultured rounded-md flex-shrink-0">
                    <img
                      src={(() => {
                        const imageUrl = item.product?.featured_image?.url ||
                          item.product?.featured_image?.path ||
                          item.product?.image ||
                          "/images/product-image-placeholder.png";
                        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                          return imageUrl;
                        }
                        return `${process.env.NEXT_PUBLIC_API_URL}/${imageUrl.replace(/^\//, '')}`;
                      })()}
                      alt={productName}
                      className="w-full h-full object-cover rounded"
                      onError={(e) => {
                        e.target.src = '/images/product-image-placeholder.png';
                      }}
                    />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    {/* Product Name and Price */}
                    <div className="mb-1">
                      <p className="font-semibold text-oxford-blue text-sm">
                        {productName}
                      </p>
                      <p className="text-vivid-red font-medium text-sm mt-0.5">
                        {formatPrice(item.price)} {item.quantity > 1 && `× ${item.quantity}`}
                      </p>
                    </div>

                    {/* Description with See More */}
                    {description && (
                      <p className="text-xs font-normal text-oxford-blue/60 mb-2">
                        {displayDescription}
                        {shouldTruncate && (
                          <button
                            onClick={() => toggleDescription(itemKey)}
                            className="text-vivid-red cursor-pointer hover:underline ml-1"
                          >
                            {isExpanded ? t('common.seeLess') || 'See Less' : t('common.seeMore') || 'See More'}
                          </button>
                        )}
                      </p>
                    )}

                    {/* Product Details: Color, Size, RAM, Storage, Battery Life */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mb-2">
                      {item.color && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-oxford-blue">{t('common.color')}:</span>
                          <span
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: item.color }}
                            title={item.color}
                          />
                        </div>
                      )}
                      {item.size && (
                        <div className="flex items-center gap-1">
                          {item.color && <span className="mx-1">|</span>}
                          <span className="font-medium text-oxford-blue">{t('common.size')}:</span>
                          <span>{item.size}</span>
                        </div>
                      )}
                      {item.ram && (
                        <div className="flex items-center gap-1">
                          {(item.color || item.size) && <span className="mx-1">|</span>}
                          <span className="font-medium text-oxford-blue">RAM:</span>
                          <span>{item.ram}</span>
                        </div>
                      )}
                      {item.storage && (
                        <div className="flex items-center gap-1">
                          {(item.color || item.size || item.ram) && <span className="mx-1">|</span>}
                          <span className="font-medium text-oxford-blue">Storage:</span>
                          <span>{item.storage}</span>
                        </div>
                      )}
                      {item.batteryLife && (
                        <div className="flex items-center gap-1">
                          {(item.color || item.size || item.ram || item.storage) && <span className="mx-1">|</span>}
                          <span className="font-medium text-oxford-blue">Battery:</span>
                          <span>{item.batteryLife}hrs</span>
                        </div>
                      )}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border rounded overflow-hidden">
                        <button
                          onClick={() => handleQuantityChange(item, item.quantity - 1)}
                          className="px-3 h-9 flex items-center justify-center text-lg hover:bg-vivid-red hover:text-white transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <FaTrashAlt className="h-4 w-5" />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          readOnly
                          className="w-12 h-9 text-center border-l border-r appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none focus:outline-none"
                        />
                        <button
                          onClick={() => handleQuantityChange(item, item.quantity + 1)}
                          className="px-3 h-9 py-1 text-lg hover:bg-vivid-red hover:text-white transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      ) : (
        <p className="text-center text-gray-500">{t('common.yourCartIsEmpty')}.</p>
      )}
    </Accordion>
  );
};

export default CartSummary;