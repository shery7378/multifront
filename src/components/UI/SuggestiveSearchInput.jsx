'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MagnifyingGlassIcon, ClockIcon, FireIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetRequest } from '@/controller/getRequests';
import { usePostRequest } from '@/controller/postRequests';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/contexts/I18nContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function SuggestiveSearchInput({ placeholder }) {
  const { t } = useI18n();
  const { formatPrice } = useCurrency();
  const { isDark } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState({
    products: [],
    categories: [],
    popular_searches: [],
    trending_products: [],
    related_searches: [],
  });
  const [recentSearches, setRecentSearches] = useState([]);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchPlaceholder = placeholder || t('landing.searchPlaceholder');

  const { data, loading, sendGetRequest } = useGetRequest();
  const { sendPostRequest } = usePostRequest();

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recent_searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent searches', e);
      }
    }
  }, []);

  // Fetch suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      // Get location parameters from localStorage (same as home page)
      const lat = localStorage.getItem('lat');
      const lng = localStorage.getItem('lng');
      const city = localStorage.getItem('city');
      const postcode = localStorage.getItem('postcode');
      const deliveryMode = localStorage.getItem('deliveryMode') || 'delivery';
      
      // Build query string with location parameters
      let queryParams = `limit=8`;
      if (query.length >= 2) {
        queryParams += `&q=${encodeURIComponent(query)}`;
      }
      
      // Add location parameters if available
      if (lat && lng) {
        queryParams += `&lat=${lat}&lng=${lng}`;
      }
      if (city) {
        queryParams += `&city=${encodeURIComponent(city)}`;
      }
      if (postcode) {
        queryParams += `&postcode=${encodeURIComponent(postcode)}`;
      }
      if (deliveryMode) {
        queryParams += `&mode=${deliveryMode}`;
      }
      
      if (query.length >= 2) {
        await sendGetRequest(`/search/suggestions?${queryParams}`, false);
      } else if (query.length === 0) {
        // Show popular and trending when input is empty
        await sendGetRequest(`/search/suggestions?${queryParams}`, false);
      }
    };

    const delay = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(delay);
  }, [query, sendGetRequest]);

  // Update suggestions from API response
  useEffect(() => {
    if (data) {
      console.log('[SuggestiveSearchInput] Received data:', data);
      // API returns data directly: {categories: [], products: [], remaining: 0}
      // Transform products to match frontend expectations
      const transformedProducts = (data.products || []).map(product => {
        // Extract image path from base_image object
        let imagePath = null;
        if (product.base_image) {
          if (typeof product.base_image === 'string') {
            imagePath = product.base_image;
          } else if (product.base_image.path) {
            imagePath = product.base_image.path;
          } else if (product.base_image.url) {
            imagePath = product.base_image.url;
          }
        }
        
        // Extract price from formatted_price string
        let price = null;
        if (product.formatted_price) {
          const priceMatch = product.formatted_price.match(/[\d.]+/);
          if (priceMatch) {
            price = parseFloat(priceMatch[0]);
          }
        }
        
        return {
          id: product.slug || product.id, // Use slug as id for routing
          slug: product.slug,
          name: product.name,
          price: price,
          compared_price: null, // API doesn't return this in suggestions
          image: imagePath,
          url: product.url,
        };
      });
      
      // Transform categories to match frontend expectations
      const transformedCategories = (data.categories || []).map(category => ({
        id: category.slug,
        slug: category.slug,
        name: category.name,
        url: category.url,
      }));
      
      setSuggestions({
        products: transformedProducts,
        categories: transformedCategories,
        popular_searches: data.popular_searches || [],
        trending_products: data.trending_products || [],
        related_searches: data.related_searches || [],
      });
      
      console.log('[SuggestiveSearchInput] Transformed suggestions:', {
        productsCount: transformedProducts.length,
        categoriesCount: transformedCategories.length,
        products: transformedProducts,
        categories: transformedCategories,
      });
    } else {
      console.log('[SuggestiveSearchInput] No data received');
    }
  }, [data]);

  // Save search to recent searches
  const saveRecentSearch = useCallback((searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 2) return;

    const updated = [
      searchQuery,
      ...recentSearches.filter(s => s.toLowerCase() !== searchQuery.toLowerCase())
    ].slice(0, 10); // Keep only last 10

    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  }, [recentSearches]);

  // Remove recent search
  const removeRecentSearch = (e, searchQuery) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== searchQuery);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  };

  // Handle search submission
  const handleSearch = useCallback(async (searchQuery = query) => {
    if (!searchQuery || searchQuery.trim().length < 2) return;

    // Save to recent searches
    saveRecentSearch(searchQuery);

    // Log search
    try {
      await sendPostRequest('/search/log', { q: searchQuery }, false);
    } catch (e) {
      console.error('Failed to log search', e);
    }

    // Navigate to search results
    router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    setIsOpen(false);
    setQuery('');
  }, [query, router, saveRecentSearch, sendPostRequest]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    const allItems = [
      ...(query.length >= 2 ? suggestions.products : []),
      ...(query.length >= 2 ? suggestions.categories : []),
      ...(query.length === 0 ? suggestions.trending_products : []),
      ...(query.length === 0 ? suggestions.popular_searches.map(s => ({ type: 'popular', query: s })) : []),
      ...(query.length === 0 ? recentSearches.map(s => ({ type: 'recent', query: s })) : []),
      ...(query.length >= 2 ? suggestions.related_searches.map(s => ({ type: 'related', query: s })) : []),
    ];

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < allItems.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allItems[selectedIndex]) {
          const item = allItems[selectedIndex];
          if (item.type === 'popular' || item.type === 'recent' || item.type === 'related') {
            setQuery(item.query);
            handleSearch(item.query);
          } else if (item.id) {
            router.push(`/product/${item.id}`);
            setIsOpen(false);
          } else if (item.slug) {
            router.push(item.url || `/products?category=${item.slug}`);
            setIsOpen(false);
          }
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        inputRef.current && !inputRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleSelectProduct = (product) => {
    if (product?.id || product?.slug) {
      // Use slug for routing if available, otherwise use id
      const productId = product.slug || product.id;
      router.push(`/product/${productId}`);
      setIsOpen(false);
      setQuery('');
    } else if (product?.url) {
      // If product has a direct URL, use it
      router.push(product.url);
      setIsOpen(false);
      setQuery('');
    }
  };

  const handleSelectCategory = (category) => {
    router.push(category.url || `/products?category=${category.slug}`);
    setIsOpen(false);
    setQuery('');
  };

  const handleSelectSearch = (searchQuery) => {
    setQuery(searchQuery);
    handleSearch(searchQuery);
  };

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  let itemIndex = -1;

  return (
    <div className="relative" ref={inputRef}>
      {/* Search Input */}
      <div
        className={`flex items-center w-[298px] h-[47px] px-[17px] py-[14px] rounded-[45px] shadow-sm gap-2.5 focus-within:ring-2 focus-within:ring-vivid-red transition duration-300 hover:border-red-500 hover:shadow-[0_0_10px_#ef4444] ${
          isDark 
            ? 'bg-slate-800 border-slate-700 border' 
            : 'bg-white border-gray-200 border'
        }`}
      >
        <MagnifyingGlassIcon className="w-5 h-5 text-vivid-red" />
        <input
          ref={inputRef}
          type="text"
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-sm text-oxford-blue dark:text-gray-200 placeholder:text-oxford-blue dark:placeholder:text-gray-400 focus:outline-none"
          aria-label="Search products"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="search-suggestions"
        />
      </div>

      {/* Dropdown Suggestions */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            id="search-suggestions"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="
              absolute z-50 mt-2 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg
              max-h-96 overflow-auto
            "
            role="listbox"
          >
            {loading && (
              <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-vivid-red"></div>
                <span className="ml-2">Searching...</span>
              </div>
            )}

            {!loading && (
              <>
                {/* Recent Searches */}
                {query.length === 0 && recentSearches.length > 0 && (
                  <div className="border-b border-gray-100 dark:border-slate-700">
                    <div className="px-4 py-2 bg-gray-50 dark:bg-slate-700 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase flex items-center gap-2">
                      <ClockIcon className="w-4 h-4" />
                      Recent Searches
                    </div>
                    {recentSearches.map((search, idx) => {
                      itemIndex++;
                      const currentIndex = itemIndex;
                      return (
                        <div
                          key={`recent-${idx}`}
                          data-index={currentIndex}
                          onClick={() => handleSelectSearch(search)}
                          className={`
                            flex items-center justify-between px-4 py-2 cursor-pointer
                            hover:bg-gray-100 dark:hover:bg-slate-700 transition
                            ${selectedIndex === currentIndex ? 'bg-vivid-red/10 dark:bg-vivid-red/20' : ''}
                          `}
                          role="option"
                          aria-selected={selectedIndex === currentIndex}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <ClockIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{search}</span>
                          </div>
                          <button
                            onClick={(e) => removeRecentSearch(e, search)}
                            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                            aria-label="Remove recent search"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Popular Searches */}
                {query.length === 0 && suggestions.popular_searches?.length > 0 && (
                  <div className="border-b border-gray-100 dark:border-slate-700">
                    <div className="px-4 py-2 bg-gray-50 dark:bg-slate-700 text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase flex items-center gap-2">
                      <FireIcon className="w-4 h-4" />
                      Popular Searches
                    </div>
                    {suggestions.popular_searches.map((search, idx) => {
                      itemIndex++;
                      const currentIndex = itemIndex;
                      return (
                        <div
                          key={`popular-${idx}`}
                          data-index={currentIndex}
                          onClick={() => handleSelectSearch(search)}
                          className={`
                            px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition
                            ${selectedIndex === currentIndex ? 'bg-vivid-red/10 dark:bg-vivid-red/20' : ''}
                          `}
                          role="option"
                          aria-selected={selectedIndex === currentIndex}
                        >
                          <span className="text-sm text-gray-800 dark:text-gray-200">{search}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Trending Products */}
                {query.length === 0 && suggestions.trending_products?.length > 0 && (
                  <div className="border-b border-gray-100 dark:border-slate-700">
                    <div className="px-4 py-2 bg-gray-50 dark:bg-slate-700 text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">
                      Trending Products
                    </div>
                    {suggestions.trending_products.map((product, idx) => {
                      itemIndex++;
                      const currentIndex = itemIndex;
                      return (
                        <div
                          key={`trending-${product.id}`}
                          data-index={currentIndex}
                          onClick={() => handleSelectProduct(product)}
                          className={`
                            flex items-center gap-3 px-4 py-2 cursor-pointer
                            hover:bg-gray-100 dark:hover:bg-slate-700 transition
                            ${selectedIndex === currentIndex ? 'bg-vivid-red/10 dark:bg-vivid-red/20' : ''}
                          `}
                          role="option"
                          aria-selected={selectedIndex === currentIndex}
                        >
                          <img
                            src={product.image ? `${baseUrl}/${product.image}` : '/images/NoImageLong.jpg'}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: product.name }} />
                            {product.price && (
                              <div className="mt-1">
                                <span className="text-xs font-bold text-jasper">
                                  {formatPrice(product.price)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Search Results - Products */}
                {query.length >= 2 && suggestions.products?.length > 0 && (
                  <div className="border-b border-gray-100 dark:border-slate-700">
                    <div className="px-4 py-2 bg-gray-50 dark:bg-slate-700 text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">
                      Products
                    </div>
                    {suggestions.products.map((product, idx) => {
                      itemIndex++;
                      const currentIndex = itemIndex;
                      return (
                        <div
                          key={`product-${product.id}`}
                          data-index={currentIndex}
                          onClick={() => handleSelectProduct(product)}
                          className={`
                            flex items-center gap-3 px-4 py-2 cursor-pointer
                            hover:bg-gray-100 dark:hover:bg-slate-700 transition
                            ${selectedIndex === currentIndex ? 'bg-vivid-red/10 dark:bg-vivid-red/20' : ''}
                          `}
                          role="option"
                          aria-selected={selectedIndex === currentIndex}
                        >
                          <img
                            src={product.image ? `${baseUrl}/${product.image}` : '/images/NoImageLong.jpg'}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: product.name }} />
                            {product.price && (
                              <div className="mt-1 flex items-center space-x-2">
                                <span className="text-xs font-bold text-jasper">
                                  {formatPrice(product.price)}
                                </span>
                                {product.compared_price && product.compared_price > product.price && (
                                  <span className="text-xs text-sonic-silver line-through">
                                    {formatPrice(product.compared_price)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Search Results - Categories */}
                {query.length >= 2 && suggestions.categories?.length > 0 && (
                  <div className="border-b border-gray-100 dark:border-slate-700">
                    <div className="px-4 py-2 bg-gray-50 dark:bg-slate-700 text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">
                      Categories
                    </div>
                    {suggestions.categories.map((category, idx) => {
                      itemIndex++;
                      const currentIndex = itemIndex;
                      return (
                        <div
                          key={`category-${category.id}`}
                          data-index={currentIndex}
                          onClick={() => handleSelectCategory(category)}
                          className={`
                            px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition
                            ${selectedIndex === currentIndex ? 'bg-vivid-red/10 dark:bg-vivid-red/20' : ''}
                          `}
                          role="option"
                          aria-selected={selectedIndex === currentIndex}
                        >
                          <span className="text-sm text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: category.name }} />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Related Searches */}
                {query.length >= 2 && suggestions.related_searches?.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-gray-50 dark:bg-slate-700 text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">
                      Related Searches
                    </div>
                    {suggestions.related_searches.map((search, idx) => {
                      itemIndex++;
                      const currentIndex = itemIndex;
                      return (
                        <div
                          key={`related-${idx}`}
                          data-index={currentIndex}
                          onClick={() => handleSelectSearch(search)}
                          className={`
                            px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition
                            ${selectedIndex === currentIndex ? 'bg-vivid-red/10 dark:bg-vivid-red/20' : ''}
                          `}
                          role="option"
                          aria-selected={selectedIndex === currentIndex}
                        >
                          <span className="text-sm text-gray-800 dark:text-gray-200">{search}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* No Results */}
                {query.length >= 2 && 
                 suggestions.products?.length === 0 && 
                 suggestions.categories?.length === 0 && 
                 suggestions.related_searches?.length === 0 &&
                 !loading && (
                  <div className="p-4 text-sm text-gray-800 dark:text-gray-200 font-medium text-center">
                    No results found for "{query}"
                  </div>
                )}

                {/* View All Results */}
                {query.length >= 2 && (suggestions.products?.length > 0 || suggestions.categories?.length > 0) && (
                  <div className="border-t border-gray-100 dark:border-slate-700">
                    <button
                      onClick={() => handleSearch()}
                      className="w-full px-4 py-3 text-sm font-semibold text-vivid-red hover:bg-gray-50 dark:hover:bg-slate-700 text-center transition"
                    >
                      View All Results for "{query}"
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

