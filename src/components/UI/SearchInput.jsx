//src/components/UI/SearchInput.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetRequest } from '@/controller/getRequests';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/contexts/I18nContext';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function SearchInput({ placeholder }) {
  const { t } = useI18n();
  const { formatPrice } = useCurrency();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isResult, setIsResult] = useState([]);
  const inputRef = useRef(null);
  const searchPlaceholder = placeholder || t('landing.searchPlaceholder');

  // use custom GET controller
  const { data, loading, error, sendGetRequest } = useGetRequest();

  // Debounced search
  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim() || query.length < 3) {
        setIsOpen(false);
        setIsResult([]);
        return;
      }

      await sendGetRequest(`/products/search?query=${encodeURIComponent(query)}`);
      setIsOpen(true);
    };

    const delay = setTimeout(fetchResults, 300); // debounce 300ms
    return () => clearTimeout(delay);
  }, [query, sendGetRequest]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (inputRef.current && !inputRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Extract search results (ensure always array)
  useEffect(() => {
    console.log(data, 'search data');
    // The API returns { products: { data: [...] }, attributes: [...] }
    // So we need to access data.products.data
    const products = data?.products?.data || data?.data || [];
    setIsResult(Array.isArray(products) ? products : []);
  }, [data]);

  const results = isResult;

  const handleSelectProduct = (product) => {
    if (product?.id) {
      router.push(`/product/${product.id}`);
      setIsOpen(false);
      setQuery('');
    }
  };

  return (
    <>
      <div ref={inputRef} className="relative">
        {/* Search Input */}
        <div
          className="
            flex items-center w-[298px] h-[47px] px-[17px] py-[14px]
            bg-cultured border border-gray-200 rounded-[45px] shadow-sm gap-2.5
            focus-within:ring-2 focus-within:ring-vivid-red
            transition duration-300
            hover:border-red-500 hover:shadow-[0_0_10px_#ef4444]
          "
        >
          <MagnifyingGlassIcon className="w-5 h-5 text-vivid-red" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 3 && setIsOpen(true)}
            className="flex-1 bg-transparent text-sm text-oxford-blue placeholder:text-oxford-blue focus:outline-none"
          />
        </div>

        {/* Dropdown Results */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="
                absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg
                max-h-80 overflow-auto
              "
            >
              {loading && (
                <div className="p-3 text-sm text-gray-500 text-center">
                  {t('common.searching')}
                </div>
              )}

              {!loading && results.length === 0 && query && (
                <div className="p-3 text-sm text-gray-500 text-center">
                  {t('common.noResultsFound')}
                </div>
              )}

              {!loading &&
                results.map((item) => {
                  // Get product image - try base_image, featured_image, or image
                  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
                  const imagePath = item.base_image?.path || 
                                   item.featured_image?.url || 
                                   item.featured_image?.path || 
                                   item.image || 
                                   null;
                  const imageUrl = imagePath
                    ? `${baseUrl.replace(/\/$/, '')}/${String(imagePath).replace(/^\/+/, '')}`
                    : '/images/NoImageLong.jpg';
                  
                  const price = item.price_tax_excl ? parseFloat(item.price_tax_excl).toFixed(2) : null;
                  const compared_price = item.compared_price ? parseFloat(item.compared_price).toFixed(2) : null;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectProduct(item)}
                      className="
                        flex items-center gap-3 p-3 cursor-pointer
                        hover:bg-gray-100 transition
                      "
                    >
                      <img
                        src={imageUrl}
                        alt={item.name || 'Product'}
                        className="w-10 h-10 rounded object-cover"
                        onError={(e) => {
                          e.target.src = '/images/NoImageLong.jpg';
                        }}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {item.name}
                        </p>
                        {price && (
                          <div className="mt-1 flex items-center space-x-2">
                            <span className="text-base font-bold text-jasper">
                              {formatPrice(price)}
                            </span>
                            {compared_price && compared_price > 0 && (
                              <span className="text-sm text-sonic-silver line-through">
                                {formatPrice(compared_price)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

              {error && (
                <div className="p-3 text-sm text-red-500 text-center">{error}</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}