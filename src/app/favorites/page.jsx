//src/app/favorites/page.jsx
"use client";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import ResponsiveText from "@/components/UI/ResponsiveText";

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
    // Load favorites from localStorage
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

    const fetchAll = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${base}/api/products/getAllProducts`, { cache: "no-store" });
        const data = await res.json();
        const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setAllProducts(items);
      } catch {
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  
    const fetchStores = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${base}/api/stores/getAllStores`, { cache: "no-store" });
        const data = await res.json();
        const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setAllStores(items);
      } catch {
        setAllStores([]);
      } finally {
        setLoadingStores(false);
      }
    };
    fetchStores();
  }, []);

  // React to favorites changes made elsewhere (e.g., Home page StoreCard)
  useEffect(() => {
    const refreshFavStores = () => {
      try {
        const saved = JSON.parse(localStorage.getItem("favoriteStores") || "{}");
        setFavStoresMap(saved);
      } catch {}
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('favoriteStoresUpdated', refreshFavStores);
      const storageHandler = (e) => { if (e.key === 'favoriteStores') refreshFavStores(); };
      window.addEventListener('storage', storageHandler);
      return () => {
        window.removeEventListener('favoriteStoresUpdated', refreshFavStores);
        window.removeEventListener('storage', storageHandler);
      };
    }
  }, []);

  const favorites = useMemo(() => {
    const keys = new Set(Object.keys(favMap || {}));
    return allProducts.filter((p) => keys.has(String(p?.id ?? p?.name)));
  }, [allProducts, favMap]);

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
    const keys = new Set(Object.keys(favStoresMap || {}));
    return allStores.filter((s) => keys.has(String(s?.slug ?? s?.id ?? s?.name)));
  }, [allStores, favStoresMap]);

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
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <ResponsiveText as="h1" minSize="1.25rem" maxSize="1.75rem" className="font-semibold text-oxford-blue">
            Favorites
          </ResponsiveText>
          <div className="flex bg-white border border-gray-200 rounded-full p-1">
            <button
              className={`px-3 py-1.5 text-sm rounded-full ${activeTab==='products' ? 'bg-vivid-red text-white' : 'text-oxford-blue'}`}
              onClick={() => setActiveTab('products')}
            >
              Products
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-full ${activeTab==='stores' ? 'bg-vivid-red text-white' : 'text-oxford-blue'}`}
              onClick={() => setActiveTab('stores')}
            >
              Stores
            </button>
          </div>
        </div>
        {activeTab === 'products' && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{sortedFavorites.length} item(s)</span>
            <select
              className="text-sm border border-gray-200 rounded-full px-3 py-1.5 bg-white"
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
          <div className="text-sm text-gray-500">{favoriteStores.length} store(s)</div>
        )}
      </div>

      {activeTab === 'products' ? (
        sortedFavorites.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-300 rounded-xl bg-white">
            <div className="text-2xl mb-2">No favorites yet</div>
            <div className="text-gray-500 mb-6">Tap the heart on a product to save it here.</div>
            <a href="/home" className="inline-block bg-vivid-red text-white px-5 py-2 rounded-full text-sm font-medium">Explore products</a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
          <div className="text-center py-20 border border-dashed border-gray-300 rounded-xl bg-white">
            <div className="text-2xl mb-2">No saved stores yet</div>
            <div className="text-gray-500 mb-6">Tap the heart on a store to save it here.</div>
            <a href="/browse-stores" className="inline-block bg-vivid-red text-white px-5 py-2 rounded-full text-sm font-medium">Browse stores</a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {favoriteStores.map((store, index) => (
              <div key={String(store?.slug ?? store?.id ?? store?.name)} className="bg-white rounded-xl border p-4 flex flex-col">
                <div className="h-36 bg-cultured rounded-lg flex items-center justify-center overflow-hidden">
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
                <div className="mt-3 font-medium text-oxford-blue truncate">{store?.name || 'Unnamed Store'}</div>
                <div className="text-sm text-gray-500 truncate">{store?.address || ''}</div>
                <div className="mt-3 flex justify-between items-center">
                  <a href={`/store/${store?.slug || store?.id || ''}`} className="text-sm text-vivid-red font-semibold">View store</a>
                  <button onClick={() => toggleFavoriteStore(index)} className="text-sm text-gray-600 hover:text-vivid-red">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
