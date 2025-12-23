// src/components/CartSummary.jsx
"use client";

import React from "react";
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
          {items.map((item) => (
            <div key={`${item.id}-${item.color || 'no-color'}-${item.size || 'no-size'}`} className="flex items-center space-x-4 pb-4 mb-4">
              <div className="flex items-center gap-5">
                <div className="w-[95px] h-[94px] p-2 bg-cultured rounded-md">
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}/${item.product.featured_image?.url ||
                      "/images/product-image-placeholder.png"
                      }`}
                    alt={item.product.name}
                    className="w-16 h-16 mr-4" />
                </div>
                <div className="flex flex-col">
                  <p className="font-semibold text-oxford-blue">
                    {item.name} <span className="text-vivid-red">({formatPrice(item.price)})</span>
                  </p>
                  <p className="text-xs font-normal text-oxford-blue/60">
                    {item.product?.description && item.product.description.length > 60
                      ? item.product.description.substring(0, item.product.description.lastIndexOf(" ", 60)) + "..."
                      : item.product?.description || ""
                    }
                    <span className="text-vivid-red cursor-pointer">{t('common.seeMore')}.</span>
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    {item.color && (
                      <>
                        <span className="font-medium text-oxford-blue text-sm">{t('common.color')}:</span>
                        <span
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                      </>
                    )}
                    {item.color && item.size && <span>|</span>}
                    {item.size && (
                      <>
                        {t('common.size')}: {item.size}
                      </>
                    )}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border rounded">
                      <button
                        onClick={() => handleQuantityChange(item, item.quantity - 1)}
                        className="px-3 h-9 flex items-center justify-center text-lg hover:bg-vivid-red hover:text-white cursor-pointer"
                      >
                        <FaTrashAlt className="h-4 w-5" />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        readOnly
                        className="w-10 h-full text-center border-l border-r appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => handleQuantityChange(item, item.quantity + 1)}
                        className="px-3 py-1 text-lg hover:bg-vivid-red hover:text-white cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </>
      ) : (
        <p className="text-center text-gray-500">{t('common.yourCartIsEmpty')}.</p>
      )}
    </Accordion>
  );
};

export default CartSummary;