//src/app/favorites/page.jsx
"use client";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import ResponsiveText from "@/components/UI/ResponsiveText";
import { productFavorites, storeFavorites } from "@/utils/favoritesApi";

export default function FavoritesPage() {
  const [allProducts, setAllProducts] = useState([]);
  const [allStores, setAllStores] = useState([]);
  const [favMap, setFavMap] = useState({});
  const [favStoresMap, setFavStoresMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingStores, setLoadingStores] = useState(true);
  const [sort, setSort] = useState("recent");
  const [activeTab, setActiveTab] = useState("products"); // products | stores

  useEffect(() => {
    // Load favorites from database (with localStorage fallback)
    if (typeof window === 'undefined') return;
    
    const loadFavorites = async () => {
      try {
        // Try to load from database first
        const productIds = await productFavorites.getAll();
        const storeIds = await storeFavorites.getAll();
        
        // Convert arrays to maps for compatibility
        const productMap = {};
        productIds.forEach(id => {
          productMap[String(id)] = true;
        });
        
        const storeMap = {};
        storeIds.forEach(id => {
          storeMap[String(id)] = true;
        });
        
        console.log('💾 [Favorites] Loaded from database:', {
          products: productIds.length,
          stores: storeIds.length
        });
        
        setFavMap(productMap);
        setFavStoresMap(storeMap);
        
        // Also sync to localStorage as backup
        localStorage.setItem("favorites", JSON.stringify(productMap));
        localStorage.setItem("favoriteStores", JSON.stringify(storeMap));
      } catch (e) {
        console.error('❌ [Favorites] Error loading from database, using localStorage:', e);
        // Fallback to localStorage
        try {
          const saved = JSON.parse(localStorage.getItem("favorites") || "{}");
          setFavMap(saved);
        } catch {
          setFavMap({});
        }
        try {
          const savedStores = JSON.parse(localStorage.getItem("favoriteStores") || "{}");
          setFavStoresMap(savedStores);
        } catch {
          setFavStoresMap({});
        }
      }
    };
    
    loadFavorites();

    const fetchAll = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL;
        
        // First, get favorite product IDs
        const favoriteIds = await productFavorites.getAll();
        console.log('📦 [Favorites] Favorite product IDs:', favoriteIds);
        
        if (favoriteIds.length === 0) {
          console.log('📦 [Favorites] No favorite products, fetching all products');
          // If no favorites, fetch all products normally
          const res = await fetch(`${base}/api/products/getAllProducts`, { cache: "no-store" });
          const data = await res.json();
          let items = [];
          if (Array.isArray(data?.data)) {
            items = data.data;
          } else if (Array.isArray(data)) {
            items = data;
          } else if (data?.data && typeof data.data === 'object') {
            items = data.data.products || data.data.items || [];
          }
          setAllProducts(items);
        } else {
          // Fetch favorite products directly by their IDs
          try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('sanctum_token');
            const headers = {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            };
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }
            
            const res = await fetch(`${base}/api/favorites/products/data`, {
              headers,
              credentials: 'include',
              cache: "no-store"
            });
            
            if (res.ok) {
              const data = await res.json();
              const items = Array.isArray(data?.data) ? data.data : [];
              console.log('✅ [Favorites] Fetched favorite products directly:', items.length);
              setAllProducts(items);
              
              // Update favMap to mark all fetched products as favorites
              const productMap = {};
              items.forEach(product => {
                if (product?.id) {
                  productMap[String(product.id)] = true;
                }
              });
              setFavMap(productMap);
              localStorage.setItem("favorites", JSON.stringify(productMap));
              console.log('✅ [Favorites] Updated favMap with fetched products:', Object.keys(productMap).length);
            } else {
              // Fallback: fetch all products and filter
              console.log('⚠️ [Favorites] Could not fetch favorite products directly, fetching all');
              const res2 = await fetch(`${base}/api/products/getAllProducts`, { cache: "no-store" });
              const data2 = await res2.json();
              let items = [];
              if (Array.isArray(data2?.data)) {
                items = data2.data;
              } else if (Array.isArray(data2)) {
                items = data2;
              } else if (data2?.data && typeof data2.data === 'object') {
                items = data2.data.products || data2.data.items || [];
              }
              setAllProducts(items);
            }
          } catch (e) {
            console.error('❌ [Favorites] Error fetching favorite products directly:', e);
            // Fallback: fetch all products
            const res = await fetch(`${base}/api/products/getAllProducts`, { cache: "no-store" });
            const data = await res.json();
            let items = [];
            if (Array.isArray(data?.data)) {
              items = data.data;
            } else if (Array.isArray(data)) {
              items = data;
            } else if (data?.data && typeof data.data === 'object') {
              items = data.data.products || data.data.items || [];
            }
            setAllProducts(items);
          }
        }
        
        // Reload favorites from database after products are fetched to ensure proper matching
        try {
          const productIds = await productFavorites.getAll();
          const productMap = {};
          productIds.forEach(id => {
            productMap[String(id)] = true;
          });
          console.log('💾 [Favorites] Reloaded from database after products fetched:', {
            productIds: productIds.length,
            productMap: Object.keys(productMap).length
          });
          setFavMap(productMap);
          // Also sync to localStorage
          localStorage.setItem("favorites", JSON.stringify(productMap));
        } catch (e) {
          console.error('❌ [Favorites] Error loading favorites from database:', e);
          // Fallback to localStorage
          try {
            const saved = JSON.parse(localStorage.getItem("favorites") || "{}");
            console.log('💾 [Favorites] Fallback to localStorage:', Object.keys(saved).length, 'keys');
            setFavMap(saved);
          } catch {
            setFavMap({});
          }
        }
      } catch (e) {
        console.error('❌ [Favorites] Error fetching products:', e);
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  
    const fetchStores = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL;
        
        // First, get favorite store IDs
        const favoriteStoreIds = await storeFavorites.getAll();
        console.log('🏪 [Favorites] Favorite store IDs:', favoriteStoreIds);
        
        if (favoriteStoreIds.length === 0) {
          console.log('🏪 [Favorites] No favorite stores, fetching all stores');
          // If no favorites, fetch all stores normally
          const res = await fetch(`${base}/api/stores/getAllStores`, { cache: "no-store" });
          const data = await res.json();
          let items = [];
          if (Array.isArray(data?.data)) {
            items = data.data;
          } else if (Array.isArray(data)) {
            items = data;
          } else if (data?.data && typeof data.data === 'object') {
            items = data.data.stores || data.data.items || [];
          }
          setAllStores(items);
        } else {
          // Fetch favorite stores directly by their IDs
          try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('sanctum_token');
            const headers = {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            };
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }
            
            const res = await fetch(`${base}/api/favorites/stores/data`, {
              headers,
              credentials: 'include',
              cache: "no-store"
            });
            
            if (res.ok) {
              const data = await res.json();
              const items = Array.isArray(data?.data) ? data.data : [];
              console.log('✅ [Favorites] Fetched favorite stores directly:', items.length);
              setAllStores(items);
              
              // Update favStoresMap to mark all fetched stores as favorites
              const storeMap = {};
              items.forEach(store => {
                if (store?.id) {
                  const idKey = String(store.id);
                  const slugKey = store.slug ? String(store.slug) : null;
                  const nameKey = store.name ? String(store.name) : null;
                  storeMap[idKey] = true;
                  if (slugKey) storeMap[slugKey] = true;
                  if (nameKey) storeMap[nameKey] = true;
                }
              });
              setFavStoresMap(storeMap);
              localStorage.setItem("favoriteStores", JSON.stringify(storeMap));
              console.log('✅ [Favorites] Updated favStoresMap with fetched stores:', Object.keys(storeMap).length);
            } else {
              // Fallback: fetch all stores and filter
              console.log('⚠️ [Favorites] Could not fetch favorite stores directly, fetching all');
              const res2 = await fetch(`${base}/api/stores/getAllStores`, { cache: "no-store" });
              const data2 = await res2.json();
              let allItems = [];
              if (Array.isArray(data2?.data)) {
                allItems = data2.data;
              } else if (Array.isArray(data2)) {
                allItems = data2;
              } else if (data2?.data && typeof data2.data === 'object') {
                allItems = data2.data.stores || data2.data.items || [];
              }
              
              // Filter to only favorite stores
              const favoriteStoreSet = new Set(favoriteStoreIds.map(id => String(id)));
              const favoriteStores = allItems.filter(store => {
                const storeId = String(store?.id);
                const storeSlug = store?.slug ? String(store.slug) : null;
                const storeName = store?.name ? String(store.name) : null;
                
                // Check all possible identifiers
                return favoriteStoreSet.has(storeId) || 
                       (storeSlug && favoriteStoreSet.has(storeSlug)) ||
                       (storeName && favoriteStoreSet.has(storeName));
              });
              
              console.log('✅ [Favorites] Filtered favorite stores:', favoriteStores.length, 'out of', allItems.length);
              setAllStores(favoriteStores);
              
              // Update favStoresMap to mark all filtered stores as favorites
              const storeMap = {};
              favoriteStores.forEach(store => {
                if (store?.id) {
                  const idKey = String(store.id);
                  const slugKey = store.slug ? String(store.slug) : null;
                  const nameKey = store.name ? String(store.name) : null;
                  storeMap[idKey] = true;
                  if (slugKey) storeMap[slugKey] = true;
                  if (nameKey) storeMap[nameKey] = true;
                }
              });
              setFavStoresMap(storeMap);
              localStorage.setItem("favoriteStores", JSON.stringify(storeMap));
              console.log('✅ [Favorites] Updated favStoresMap with filtered stores:', Object.keys(storeMap).length);
            }
          } catch (e) {
            console.error('❌ [Favorites] Error fetching favorite stores directly:', e);
            // Fallback: fetch all stores and filter
            const res = await fetch(`${base}/api/stores/getAllStores`, { cache: "no-store" });
            const data = await res.json();
            let allItems = [];
            if (Array.isArray(data?.data)) {
              allItems = data.data;
            } else if (Array.isArray(data)) {
              allItems = data;
            } else if (data?.data && typeof data.data === 'object') {
              allItems = data.data.stores || data.data.items || [];
            }
            
            // Filter to only favorite stores
            const favoriteStoreSet = new Set(favoriteStoreIds.map(id => String(id)));
            const favoriteStores = allItems.filter(store => {
              const storeId = String(store?.id);
              const storeSlug = store?.slug ? String(store.slug) : null;
              const storeName = store?.name ? String(store.name) : null;
              
              return favoriteStoreSet.has(storeId) || 
                     (storeSlug && favoriteStoreSet.has(storeSlug)) ||
                     (storeName && favoriteStoreSet.has(storeName));
            });
            
            setAllStores(favoriteStores);
          }
        }
      } catch (e) {
        console.error('❌ [Favorites] Error fetching stores:', e);
        setAllStores([]);
      } finally {
        setLoadingStores(false);
      }
    };
    fetchStores();
  }, []);

  // Reload favorites from database when products/stores finish loading (handles refresh case)
  useEffect(() => {
    const reloadFavorites = async () => {
      if (!loading && allProducts.length > 0) {
        try {
          const productIds = await productFavorites.getAll();
          const productMap = {};
          productIds.forEach(id => {
            productMap[String(id)] = true;
          });
          console.log('🔄 [Favorites] Reloaded from database (products loaded):', {
            productIds: productIds.length,
            productMap: Object.keys(productMap).length
          });
          setFavMap(productMap);
          localStorage.setItem("favorites", JSON.stringify(productMap));
        } catch (e) {
          console.error('❌ [Favorites] Error reloading from database:', e);
          // Fallback to localStorage
          try {
            const saved = JSON.parse(localStorage.getItem("favorites") || "{}");
            setFavMap(saved);
          } catch {
            setFavMap({});
          }
        }
      }
    };
    reloadFavorites();
  }, [loading, allProducts.length]);

  useEffect(() => {
    const reloadStoreFavorites = async () => {
      if (!loadingStores && allStores.length > 0) {
        try {
          const storeIds = await storeFavorites.getAll();
          const storeMap = {};
          storeIds.forEach(id => {
            storeMap[String(id)] = true;
          });
          console.log('🔄 [Favorites] Reloaded stores from database:', {
            storeIds: storeIds.length,
            storeMap: Object.keys(storeMap).length
          });
          setFavStoresMap(storeMap);
          localStorage.setItem("favoriteStores", JSON.stringify(storeMap));
        } catch (e) {
          console.error('❌ [Favorites] Error reloading stores from database:', e);
          // Fallback to localStorage
          try {
            const savedStores = JSON.parse(localStorage.getItem("favoriteStores") || "{}");
            setFavStoresMap(savedStores);
          } catch {
            setFavStoresMap({});
          }
        }
      }
    };
    reloadStoreFavorites();
  }, [loadingStores, allStores.length]);

  // React to favorites changes made elsewhere (e.g., Home page StoreCard, ProductCard)
  useEffect(() => {
    const refreshFavStores = async () => {
      try {
        // Reload from database
        const storeIds = await storeFavorites.getAll();
        const storeMap = {};
        storeIds.forEach(id => {
          storeMap[String(id)] = true;
        });
        setFavStoresMap(storeMap);
        localStorage.setItem("favoriteStores", JSON.stringify(storeMap));
      } catch (e) {
        // Fallback to localStorage
        try {
          const saved = JSON.parse(localStorage.getItem("favoriteStores") || "{}");
          setFavStoresMap(saved);
        } catch {}
      }
    };
    const refreshFavProducts = async () => {
      try {
        // Reload from database
        const productIds = await productFavorites.getAll();
        const productMap = {};
        productIds.forEach(id => {
          productMap[String(id)] = true;
        });
        setFavMap(productMap);
        localStorage.setItem("favorites", JSON.stringify(productMap));
      } catch (e) {
        // Fallback to localStorage
        try {
          const saved = JSON.parse(localStorage.getItem("favorites") || "{}");
          setFavMap(saved);
        } catch {}
      }
    };
    if (typeof window !== 'undefined') {
      // Listen for store favorites updates
      window.addEventListener('favoriteStoresUpdated', refreshFavStores);
      const storageHandlerStores = (e) => { if (e.key === 'favoriteStores') refreshFavStores(); };
      window.addEventListener('storage', storageHandlerStores);
      
      // Listen for product favorites updates
      window.addEventListener('favoriteUpdated', refreshFavProducts);
      const storageHandlerProducts = (e) => { if (e.key === 'favorites') refreshFavProducts(); };
      window.addEventListener('storage', storageHandlerProducts);
      
      return () => {
        window.removeEventListener('favoriteStoresUpdated', refreshFavStores);
        window.removeEventListener('storage', storageHandlerStores);
        window.removeEventListener('favoriteUpdated', refreshFavProducts);
        window.removeEventListener('storage', storageHandlerProducts);
      };
    }
  }, []);

  const favorites = useMemo(() => {
    console.log('🔍 [Favorites] Computing favorites:', {
      favMapSize: favMap ? Object.keys(favMap).length : 0,
      allProductsLength: allProducts ? allProducts.length : 0,
      favMapKeys: favMap ? Object.keys(favMap) : [],
      loading: loading,
      allProducts: allProducts
    });
    
    // Don't compute if still loading
    if (loading) {
      console.log('⏳ [Favorites] Still loading products, skipping computation');
      return [];
    }
    
    // If we fetched favorite products directly, they're already the favorites - no need to filter
    // Check if allProducts match favorite IDs (meaning we fetched them directly)
    if (allProducts && allProducts.length > 0) {
      const favoriteIds = Object.keys(favMap || {});
      const productIds = allProducts.map(p => String(p?.id)).filter(Boolean);
      
      // If all products match favorite IDs, they're already favorites
      const allMatch = favoriteIds.length > 0 && 
                       productIds.length === favoriteIds.length &&
                       productIds.every(id => favoriteIds.includes(id));
      
      if (allMatch) {
        console.log('✅ [Favorites] Products already match favorites (fetched directly), returning all');
        return allProducts;
      }
    }
    
    if (!favMap || Object.keys(favMap).length === 0) {
      console.log('🔍 [Favorites] No favorites in favMap');
      return [];
    }
    if (!allProducts || allProducts.length === 0) {
      console.log('🔍 [Favorites] No products loaded yet (after loading finished)');
      return [];
    }
    
    const keys = new Set(Object.keys(favMap));
    console.log('🔍 [Favorites] Favorite keys:', Array.from(keys));
    console.log('🔍 [Favorites] Total products to check:', allProducts.length);
    
    const matched = allProducts.filter((p) => {
      if (!p) return false;
      
      // ProductCard saves with: String(product?.id ?? product?.name)
      const productId = p?.id;
      const productName = p?.name;
      
      // Try all possible key formats that ProductCard might have used
      const possibleKeys = [];
      
      // The exact format ProductCard uses
      if (productId != null || productName) {
        possibleKeys.push(String(productId ?? productName));
      }
      
      // Individual keys
      if (productId != null) {
        possibleKeys.push(String(productId));
        // Handle number conversion (in case ID was saved as number string)
        const numId = Number(productId);
        if (!isNaN(numId)) {
          possibleKeys.push(String(numId));
        }
      }
      
      if (productName) {
        possibleKeys.push(String(productName));
      }
      
      // Check if any of the possible keys exist in localStorage
      const isMatch = possibleKeys.some(key => keys.has(key));
      
      if (isMatch) {
        const matchedKey = possibleKeys.find(key => keys.has(key));
        console.log('✅ [Favorites] Matched product:', {
          id: productId,
          idType: typeof productId,
          name: productName,
          matchedKey: matchedKey,
          allPossibleKeys: possibleKeys,
          allFavKeys: Array.from(keys)
        });
      } else if (productId != null || productName) {
        // Log unmatched products for debugging
        console.log('❌ [Favorites] Product NOT matched:', {
          id: productId,
          idType: typeof productId,
          name: productName,
          possibleKeys: possibleKeys,
          availableFavKeys: Array.from(keys)
        });
      }
      
      return isMatch;
    });
    
    console.log('🔍 [Favorites] Matched products count:', matched.length);
    if (matched.length > 0) {
      console.log('✅ [Favorites] Matched products:', matched.map(p => ({ id: p?.id, name: p?.name })));
    }
    return matched;
  }, [allProducts, favMap, loading]);

  const toggleFavorite = (index) => {
    const product = favorites[index];
    if (!product) return;
    const key = String(product?.id ?? product?.name);
    try {
      const saved = JSON.parse(localStorage.getItem("favorites") || "{}");
      if (saved[key]) delete saved[key]; else saved[key] = true;
      localStorage.setItem("favorites", JSON.stringify(saved));
      setFavMap(saved);
    } catch {}
  };

  const sortedFavorites = useMemo(() => {
    const list = [...favorites];
    switch (sort) {
      case "price_low":
        return list.sort((a, b) => (Number(a?.price_tax_excl||0)) - (Number(b?.price_tax_excl||0)));
      case "price_high":
        return list.sort((a, b) => (Number(b?.price_tax_excl||0)) - (Number(a?.price_tax_excl||0)));
      default:
        return list; // recent (as stored)
    }
  }, [favorites, sort]);

  const favoriteStores = useMemo(() => {
    console.log('🏪 [Favorites] Computing favorite stores:', {
      favStoresMapSize: favStoresMap ? Object.keys(favStoresMap).length : 0,
      allStoresLength: allStores ? allStores.length : 0,
      favStoresMapKeys: favStoresMap ? Object.keys(favStoresMap) : [],
      loadingStores: loadingStores
    });
    
    // Don't compute if still loading
    if (loadingStores) {
      console.log('⏳ [Favorites] Still loading stores, skipping computation');
      return [];
    }
    
    // If we fetched favorite stores directly (filtered), they're already the favorites
    if (allStores && allStores.length > 0) {
      const favoriteStoreIds = Object.keys(favStoresMap || {});
      const storeIds = allStores.map(s => String(s?.id)).filter(Boolean);
      
      // If all stores match favorite IDs, they're already favorites
      const allMatch = favoriteStoreIds.length > 0 && 
                       storeIds.length === favoriteStoreIds.length &&
                       storeIds.every(id => favoriteStoreIds.includes(id));
      
      if (allMatch || (favoriteStoreIds.length > 0 && storeIds.every(id => favoriteStoreIds.includes(id)))) {
        console.log('✅ [Favorites] Stores already match favorites (fetched directly), returning all');
        return allStores;
      }
    }
    
    if (!favStoresMap || Object.keys(favStoresMap).length === 0) {
      console.log('🔍 [Favorites] No favorite stores in favStoresMap');
      return [];
    }
    if (!allStores || allStores.length === 0) {
      console.log('🔍 [Favorites] No stores loaded yet (after loading finished)');
      return [];
    }
    
    const keys = new Set(Object.keys(favStoresMap));
    console.log('🔍 [Favorites] Favorite store keys:', Array.from(keys));
    console.log('🔍 [Favorites] Total stores to check:', allStores.length);
    
    const matched = allStores.filter((s) => {
      if (!s) return false;
      
      // Check all possible keys that StoreCard might have saved
      const idKey = s?.id != null ? String(s.id) : null;
      const slugKey = s?.slug ? String(s.slug) : null;
      const nameKey = s?.name ? String(s.name) : null;
      const favKey = String(s?.id ?? s?.slug ?? s?.name);
      
      // Return true if ANY of the possible keys exist in localStorage
      const isMatch = keys.has(favKey) || 
             (idKey && keys.has(idKey)) || 
             (slugKey && keys.has(slugKey)) || 
             (nameKey && keys.has(nameKey));
      
      if (isMatch) {
        console.log('✅ [Favorites] Matched store:', {
          id: s?.id,
          slug: s?.slug,
          name: s?.name,
          matchedKey: favKey
        });
      }
      
      return isMatch;
    });
    
    console.log('🔍 [Favorites] Matched stores count:', matched.length);
    return matched;
  }, [allStores, favStoresMap, loadingStores]);

  const toggleFavoriteStore = (index) => {
    const store = favoriteStores[index];
    if (!store) return;
    const idKey = store?.id != null ? String(store.id) : null;
    const slugKey = store?.slug ? String(store.slug) : null;
    const nameKey = store?.name ? String(store.name) : null;
    const key = String(slugKey ?? idKey ?? nameKey);
    try {
      const saved = JSON.parse(localStorage.getItem("favoriteStores") || "{}");
      const exists = saved[key] || (idKey && saved[idKey]) || (slugKey && saved[slugKey]) || (nameKey && saved[nameKey]);
      if (exists) {
        if (key) delete saved[key];
        if (idKey) delete saved[idKey];
        if (slugKey) delete saved[slugKey];
        if (nameKey) delete saved[nameKey];
      } else {
        if (key) saved[key] = true;
        if (idKey) saved[idKey] = true;
        if (slugKey) saved[slugKey] = true;
        if (nameKey) saved[nameKey] = true;
      }
      localStorage.setItem("favoriteStores", JSON.stringify(saved));
      setFavStoresMap(saved);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('favoriteStoresUpdated'));
      }
    } catch {}
  };

  if (loading || loadingStores) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="animate-pulse text-gray-500">Loading favorites…</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <ResponsiveText as="h1" minSize="1.125rem" maxSize="1.75rem" className="font-semibold text-oxford-blue">
            Favorites
          </ResponsiveText>
          <div className="flex bg-white border border-gray-200 rounded-full p-1">
            <button
              className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-full ${activeTab==='products' ? 'bg-vivid-red text-white' : 'text-oxford-blue'}`}
              onClick={() => setActiveTab('products')}
            >
              Products
            </button>
            <button
              className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-full ${activeTab==='stores' ? 'bg-vivid-red text-white' : 'text-oxford-blue'}`}
              onClick={() => setActiveTab('stores')}
            >
              Stores
            </button>
          </div>
        </div>
        {activeTab === 'products' && (
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm text-gray-500">{sortedFavorites.length} item(s)</span>
            <select
              className="text-xs sm:text-sm border border-gray-200 rounded-full px-2 sm:px-3 py-1 sm:py-1.5 bg-white"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="recent">Recent</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        )}
        {activeTab === 'stores' && (
          <div className="text-xs sm:text-sm text-gray-500">{favoriteStores.length} store(s)</div>
        )}
      </div>

      {activeTab === 'products' ? (
        sortedFavorites.length === 0 ? (
          <div className="text-center py-12 sm:py-20 border border-dashed border-gray-300 rounded-xl bg-white px-4">
            <div className="text-xl sm:text-2xl mb-2">No favorites yet</div>
            <div className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">Tap the heart on a product to save it here.</div>
            <a href="/home" className="inline-block bg-vivid-red text-white px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium">Explore products</a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {sortedFavorites.map((product, index) => (
              <ProductCard
                key={String(product?.id ?? product?.name)}
                product={product}
                index={index}
                isFavorite={true}
                toggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )
      ) : (
        favoriteStores.length === 0 ? (
          <div className="text-center py-12 sm:py-20 border border-dashed border-gray-300 rounded-xl bg-white px-4">
            <div className="text-xl sm:text-2xl mb-2">No saved stores yet</div>
            <div className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">Tap the heart on a store to save it here.</div>
            <a href="/browse-stores" className="inline-block bg-vivid-red text-white px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium">Browse stores</a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {favoriteStores.map((store, index) => (
              <div key={String(store?.slug ?? store?.id ?? store?.name)} className="bg-white rounded-xl border p-3 sm:p-4 flex flex-col">
                <div className="h-28 sm:h-36 bg-cultured rounded-lg flex items-center justify-center overflow-hidden">
                  <img
                    src={(() => {
                      const base = process.env.NEXT_PUBLIC_API_URL || '';
                      const raw = store?.logo?.url || store?.logo || store?.logo_url || store?.image || store?.image_url;
                      if (!raw) return '/images/NoImageLong.jpg';
                      const s = String(raw);
                      return s.startsWith('http') ? s : `${base}/${s}`;
                    })()}
                    alt={store?.name || 'Store'}
                    className="max-h-full object-contain"
                  />
                </div>
                <div className="mt-2 sm:mt-3 text-sm sm:text-base font-medium text-oxford-blue truncate">{store?.name || 'Unnamed Store'}</div>
                <div className="text-xs sm:text-sm text-gray-500 truncate">{store?.address || ''}</div>
                <div className="mt-2 sm:mt-3 flex justify-between items-center gap-2">
                  <a href={`/store/${store?.slug || store?.id || ''}`} className="text-xs sm:text-sm text-vivid-red font-semibold">View store</a>
                  <button onClick={() => toggleFavoriteStore(index)} className="text-xs sm:text-sm text-gray-600 hover:text-vivid-red">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
