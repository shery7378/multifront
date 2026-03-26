'use client';

import { useEffect, useState, useMemo, useRef, useCallback, lazy, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import IconButton from "@/components/UI/IconButton";
import { ShareIcon, HeartIcon, CheckIcon, TruckIcon, ShieldCheckIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { FaRecycle, FaRepeat, FaTruckFast } from "react-icons/fa6";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { addItem } from "../../../store/slices/cartSlice";
import ResponsiveText from "@/components/UI/ResponsiveText";
import { useGetRequest } from "@/controller/getRequests";
import { usePostRequest } from "@/controller/postRequests";
import ReviewSlider from "@/components/ReviewSlider";
import { useI18n } from '@/contexts/I18nContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import BackButton from "@/components/UI/BackButton";
import SharedLayout from "@/components/SharedLayout";
import { productFavorites } from "@/utils/favoritesApi";
import ProductDetailSection from "./ProductDetailSection";
import CheckoutSubscriptionSelector from "@/components/Subscriptions/CheckoutSubscriptionSelector";

// ─── Lazy-load heavy below-fold components ─────────────────────────────────────
const TestimonialSection = lazy(() => import("@/components/new-design/TestimonialSection"));

// ─── Color Name Resolver ───────────────────────────────────────────────────────
const COLOR_MAP = {
  black: "#000000", "space black": "#1c1c1e", "midnight black": "#0a0a0a",
  "matte black": "#1a1a1a", graphite: "#4a4a4a", "space gray": "#8e8e93",
  "space grey": "#8e8e93", titanium: "#8a8a8f", "dark gray": "#333333",
  "dark grey": "#333333", gray: "#808080", grey: "#808080",
  "light gray": "#d1d5db", "light grey": "#d1d5db", silver: "#c0c0c0",
  starlight: "#f0ece3", "natural titanium": "#c8c5bb", "desert titanium": "#c2a882",
  white: "#ffffff", "pearl white": "#f8f4f0", "alpine white": "#f5f5f0",
  "ceramic white": "#f9f9f9", cream: "#fffdd0", ivory: "#fffff0",
  champagne: "#f7e7ce", blue: "#2563eb", "dark blue": "#1e3a8a",
  "light blue": "#bfdbfe", "sky blue": "#0ea5e9", navy: "#001f5b",
  "midnight blue": "#003366", "sierra blue": "#a8c5da", "pacific blue": "#3d7ebf",
  "ocean blue": "#1e6fa8", "alpine blue": "#4a90d9", "glacier blue": "#b0d4e8",
  teal: "#0d9488", cyan: "#06b6d4", green: "#16a34a", "dark green": "#14532d",
  "light green": "#86efac", olive: "#6b7280", "midnight green": "#1c3d2e",
  "alpine green": "#2d5a27", "forest green": "#228b22", mint: "#3eb489",
  sage: "#8fa37e", purple: "#9333ea", "deep purple": "#4c1d95", violet: "#7c3aed",
  lavender: "#c4b5fd", mauve: "#e0b0ff", pink: "#ec4899", "hot pink": "#ff69b4",
  rose: "#f43f5e", magenta: "#d946ef", "light purple": "#c084fc",
  "ultra violet": "#5f4b8b", nebula: "#6b4f8e", red: "#dc2626",
  "dark red": "#7f1d1d", crimson: "#b91c1c", scarlet: "#c0392b",
  orange: "#f97316", "cosmic orange": "#e8602c", "sunset orange": "#fd5e53",
  "burnt orange": "#cc5500", coral: "#f97070", salmon: "#fa8072",
  tomato: "#ff6347", "product red": "#bf0000", yellow: "#eab308",
  gold: "#f59e0b", "light gold": "#fde68a", amber: "#f59e0b",
  "warm gold": "#d4a017", brown: "#92400e", tan: "#d2b48c", beige: "#f5f5dc",
  bronze: "#cd7f32", copper: "#b87333", mocha: "#6b4423",
  midnight: "#1d1d2e", aurora: "#00c9a7",
};

// Module-level color cache — never re-created on renders
const colorCache = new Map();
function resolveColor(colorName) {
  if (!colorName) return "#cccccc";
  if (colorCache.has(colorName)) return colorCache.get(colorName);
  const trimmed = String(colorName).trim();
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) { colorCache.set(colorName, trimmed); return trimmed; }
  if (/^(rgb|hsl)a?\(/.test(trimmed)) { colorCache.set(colorName, trimmed); return trimmed; }
  const lower = trimmed.toLowerCase();
  if (COLOR_MAP[lower]) { colorCache.set(colorName, COLOR_MAP[lower]); return COLOR_MAP[lower]; }
  const partial = Object.keys(COLOR_MAP).find(k => lower.includes(k) || k.includes(lower));
  if (partial) { colorCache.set(colorName, COLOR_MAP[partial]); return COLOR_MAP[partial]; }
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) hash = trimmed.charCodeAt(i) + ((hash << 5) - hash);
  const result = `hsl(${Math.abs(hash) % 360}, 55%, 45%)`;
  colorCache.set(colorName, result);
  return result;
}

// Module-level buildImageUrl — never re-created on renders
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
function buildImageUrl(url) {
  if (!url) return '/images/NoImageLong.jpg';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (API_BASE) return url.startsWith('/') ? `${API_BASE}${url}` : `${API_BASE}/${url}`;
  return url.startsWith('/') ? url : `/${url}`;
}
// ──────────────────────────────────────────────────────────────────────────────

// ─── Built-in Image Zoom Modal ─────────────────────────────────────────────────
// Fully replaces ProductImageZoom. Supports:
//   • Scroll wheel zoom (zooms the IMAGE, not the browser page)
//   • Pinch-to-zoom on touch devices
//   • Click-and-drag to pan when zoomed in
//   • Double-click to toggle zoom
//   • +/− buttons + Reset button
//   • Prev/Next navigation between images
//   • Thumbnail strip at the bottom
function ImageZoomModal({ isOpen, onClose, images, currentIndex, productName }) {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const lastPinchDist = useRef(null);

  // Sync active index & reset zoom when modal opens or image changes from outside
  useEffect(() => {
    setActiveIndex(currentIndex);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex, isOpen]);

  // ── Prevent BROWSER page zoom while modal is open ─────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const preventWheel = (e) => { if (e.ctrlKey || e.metaKey) e.preventDefault(); };
    const preventTouch = (e) => { if (e.touches.length > 1) e.preventDefault(); };
    window.addEventListener('wheel', preventWheel, { passive: false });
    window.addEventListener('touchmove', preventTouch, { passive: false });
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('wheel', preventWheel);
      window.removeEventListener('touchmove', preventTouch);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ── Keyboard navigation ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') changeImage((activeIndex + 1) % images.length);
      if (e.key === 'ArrowLeft') changeImage((activeIndex - 1 + images.length) % images.length);
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, activeIndex, images.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scroll-wheel zoom on the image ────────────────────────────────────────
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setScale(prev => {
      const next = Math.min(Math.max(prev + delta, 1), 5);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  }, []);

  // ── Mouse drag to pan ─────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, posX: position.x, posY: position.y };
  }, [scale, position]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setPosition({
      x: dragStart.current.posX + (e.clientX - dragStart.current.x),
      y: dragStart.current.posY + (e.clientY - dragStart.current.y),
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  // ── Touch: drag to pan + pinch to zoom ────────────────────────────────────
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1 && scale > 1) {
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, posX: position.x, posY: position.y };
    }
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, [scale, position]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    if (e.touches.length === 1 && scale > 1) {
      setPosition({
        x: dragStart.current.posX + (e.touches[0].clientX - dragStart.current.x),
        y: dragStart.current.posY + (e.touches[0].clientY - dragStart.current.y),
      });
    }
    if (e.touches.length === 2 && lastPinchDist.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ratio = dist / lastPinchDist.current;
      setScale(prev => Math.min(Math.max(prev * ratio, 1), 5));
      lastPinchDist.current = dist;
    }
  }, [scale]);

  const handleTouchEnd = useCallback(() => {
    lastPinchDist.current = null;
    if (scale <= 1) setPosition({ x: 0, y: 0 });
  }, [scale]);

  // ── Double-click toggles zoom ─────────────────────────────────────────────
  const handleDoubleClick = useCallback((e) => {
    e.preventDefault();
    if (scale > 1) { setScale(1); setPosition({ x: 0, y: 0 }); }
    else setScale(2.5);
  }, [scale]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setScale(prev => { const n = Math.max(prev - 0.5, 1); if (n === 1) setPosition({ x: 0, y: 0 }); return n; });
  const handleReset = () => { setScale(1); setPosition({ x: 0, y: 0 }); };
  const changeImage = (idx) => { setActiveIndex(idx); setScale(1); setPosition({ x: 0, y: 0 }); };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/92 flex flex-col"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/50 backdrop-blur-sm flex-shrink-0">
            <p className="text-white font-medium text-sm truncate max-w-[55vw]">{productName}</p>
            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={handleZoomOut}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white text-xl leading-none flex items-center justify-center transition"
                title="Zoom out (-)">−</button>
              <span className="text-white/80 text-xs w-11 text-center tabular-nums">{Math.round(scale * 100)}%</span>
              <button onClick={handleZoomIn}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white text-xl leading-none flex items-center justify-center transition"
                title="Zoom in (+)">+</button>
              <button onClick={handleReset}
                className="px-3 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white text-xs flex items-center justify-center transition ml-1"
                title="Reset zoom">Reset</button>
              <button onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white text-sm flex items-center justify-center transition ml-2"
                title="Close (Esc)">✕</button>
            </div>
          </div>

          {/* Main zoom area */}
          <div
            className="flex-1 flex items-center justify-center overflow-hidden relative select-none"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onDoubleClick={handleDoubleClick}
            style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
          >
            <motion.img
              key={activeIndex}
              src={images[activeIndex] || '/images/NoImageLong.jpg'}
              alt={`${productName} - image ${activeIndex + 1}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale, x: position.x, y: position.y }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              style={{
                maxWidth: '85vw',
                maxHeight: '72vh',
                objectFit: 'contain',
                transformOrigin: 'center center',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
              draggable={false}
              onError={e => { e.target.src = '/images/NoImageLong.jpg'; }}
            />

            {/* Hint text — only shown at default zoom */}
            {scale === 1 && (
              <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/40 text-xs pointer-events-none whitespace-nowrap">
                Scroll · Pinch · Double-click to zoom
              </p>
            )}
          </div>

          {/* Prev / Next arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => changeImage((activeIndex - 1 + images.length) % images.length)}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition text-2xl"
                title="Previous (←)"
              >‹</button>
              <button
                onClick={() => changeImage((activeIndex + 1) % images.length)}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition text-2xl"
                title="Next (→)"
              >›</button>
            </>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 justify-center py-3 px-4 bg-black/40 flex-shrink-0 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => changeImage(i)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${i === activeIndex ? 'border-white scale-105' : 'border-white/25 hover:border-white/60'}`}
                >
                  <img src={img} alt={`thumb-${i}`} className="w-full h-full object-contain bg-white/10"
                    onError={e => { e.target.src = '/images/NoImageLong.jpg'; }} />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
// ──────────────────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const { t } = useI18n();
  const { formatPrice } = useCurrency();
  const params = useParams();
  const router = useRouter();
  const productId = params?.id;
  const deliveryMode = useSelector((state) => state.delivery.mode);
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Redirect if productId is a route name (like "sign-up", "login", etc.)
  useEffect(() => {
    const invalidIds = ['sign-up', 'login', 'signup', 'signin', 'sign-in'];
    if (productId && invalidIds.includes(productId.toLowerCase())) {
      router.replace(`/${productId}`);
    }
  }, [productId, router]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [colorsArray, setColorsArray] = useState([]);
  const [sizeArray, setSizeArray] = useState([]);
  const [batteryLife, setBatteryLife] = useState(0);
  const [storage, setStorage] = useState('');
  const [ram, setRam] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [imageZoom, setImageZoom] = useState(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [postalCode, setPostalCode] = useState('');
  const [deliveryAvailable, setDeliveryAvailable] = useState(null);
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const handleAttributeSelect = useCallback((attrName, attrValue) => {
    setSelectedAttributes(prev => {
      const newAttrs = { ...prev };
      if (newAttrs[attrName] === attrValue) {
        delete newAttrs[attrName];
      } else {
        newAttrs[attrName] = attrValue;
      }
      return newAttrs;
    });
  }, []);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: productsData, error: productsError, loading: productsLoading, sendGetRequest: getProducts } = useGetRequest();
  const { data: singleProductData, error: singleProductError, loading: singleProductLoading, sendGetRequest: getSingleProduct } = useGetRequest();
  const { data: ratingData, error: ratingError, loading: ratingLoading, sendGetRequest: getRating } = useGetRequest();
  const { data: vendorData, error: vendorError, loading: vendorLoading, sendGetRequest: getVendorRating } = useGetRequest();
  const { data: storeData, error: storeError, loading: storeLoading, sendGetRequest: getStoreData } = useGetRequest();
  const { data: flashData, error: flashError, loading: flashLoading, sendGetRequest: getFlash } = useGetRequest();
  const { sendPostRequest: logView } = usePostRequest();

  const fetchedRatingRef = useRef(null);
  const fetchedVendorRatingRef = useRef(null);
  const fetchedStoreDataRef = useRef(null);
  const hasLoggedViewRef = useRef(false);

  // ── Derived data ───────────────────────────────────────────────────────────
  const singleProduct = useMemo(() => {
    return singleProductData?.data || singleProductData || null;
  }, [singleProductData]);

  const allProducts = useMemo(() => {
    return productsData?.data?.data || productsData?.data || [];
  }, [productsData]);

  const flashProducts = useMemo(() => {
    return (flashData?.data?.products || []).reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
  }, [flashData?.data?.products]);

  const listProduct = useMemo(() => {
    return allProducts.find((p) => String(p?.id) === String(productId));
  }, [allProducts, productId]);

  const baseProduct = useMemo(() => {
    return singleProduct || listProduct || null;
  }, [singleProduct, listProduct]);

  const productWithFlash = useMemo(() => {
    if (baseProduct && flashProducts[baseProduct.id]) {
      return { ...baseProduct, flash_price: flashProducts[baseProduct.id].flash_price };
    }
    return baseProduct;
  }, [baseProduct, flashProducts]);

  const storeInfo = useMemo(() => {
    if (!productWithFlash?.store) return null;
    if (Array.isArray(productWithFlash.store)) return productWithFlash.store[0];
    return productWithFlash.store;
  }, [productWithFlash]);

  const displayVariant = useMemo(() => {
    return selectedVariant || productWithFlash;
  }, [selectedVariant, productWithFlash]);

  const currentQuantity = useMemo(() => {
    if (selectedVariant) return selectedVariant?.quantity ?? selectedVariant?.qty ?? 0;
    return productWithFlash?.quantity ?? productWithFlash?.qty ?? 0;
  }, [selectedVariant, productWithFlash]);

  const currentPrice = useMemo(() => {
    if (selectedVariant) return selectedVariant?.price_tax_excl || selectedVariant?.price || 0;
    return productWithFlash?.flash_price || productWithFlash?.price_tax_excl || productWithFlash?.price || 0;
  }, [selectedVariant, productWithFlash]);

  useEffect(() => {
    if (currentQuantity > 0 && quantity > currentQuantity) {
      setQuantity(Math.min(quantity, currentQuantity));
    } else if (currentQuantity === 0) {
      setQuantity(1);
    }
  }, [currentQuantity, quantity]);

  const getVariantAttributes = useMemo(() => {
    if (!productWithFlash?.product_variants || !Array.isArray(productWithFlash.product_variants)) return {};
    const attributes = {};
    productWithFlash.product_variants.forEach(variant => {
      if (variant?.attributes && Array.isArray(variant.attributes)) {
        variant.attributes.forEach(attr => {
          if (attr.attribute_name && attr.attribute_value) {
            const attrName = attr.attribute_name;
            if (!attributes[attrName]) attributes[attrName] = new Set();
            attributes[attrName].add(Array.isArray(attr.attribute_value) ? attr.attribute_value.join(', ') : String(attr.attribute_value));
          }
        });
      }
      if (productWithFlash?.product_attributes && Array.isArray(productWithFlash.product_attributes)) {
        productWithFlash.product_attributes.filter(attr => attr.variant_id === variant.id).forEach(attr => {
          if (attr.attribute_name && attr.attribute_value) {
            const attrName = attr.attribute_name;
            if (!attributes[attrName]) attributes[attrName] = new Set();
            attributes[attrName].add(Array.isArray(attr.attribute_value) ? attr.attribute_value.join(', ') : String(attr.attribute_value));
          }
        });
      }
      if (variant?.name && typeof variant.name === 'string' && variant.name.includes(' - ')) {
        const parts = variant.name.split(' - ');
        if (parts.length === 2) {
          const s = parts[0].trim();
          const c = parts[1].trim();
          if (s && !s.toLowerCase().includes('color')) { if (!attributes['Storage']) attributes['Storage'] = new Set(); attributes['Storage'].add(s); }
          if (c && !c.toLowerCase().includes('storage')) { if (!attributes['Color']) attributes['Color'] = new Set(); attributes['Color'].add(c); }
        }
      }
    });
    const result = {};
    Object.keys(attributes).forEach(key => { result[key] = Array.from(attributes[key]).sort(); });
    return result;
  }, [productWithFlash]);

  const findMatchingVariant = useCallback((attributes) => {
    if (!productWithFlash?.product_variants || !Array.isArray(productWithFlash.product_variants)) return null;
    if (Object.keys(attributes).length === 0) return null;
    return productWithFlash.product_variants.find(variant => {
      const variantAttrs = {};
      if (variant?.attributes && Array.isArray(variant.attributes)) {
        variant.attributes.forEach(attr => {
          if (attr.attribute_name && attr.attribute_value) {
            variantAttrs[attr.attribute_name] = Array.isArray(attr.attribute_value) ? attr.attribute_value.join(', ') : String(attr.attribute_value);
          }
        });
      }
      if (productWithFlash?.product_attributes && Array.isArray(productWithFlash.product_attributes)) {
        productWithFlash.product_attributes.filter(a => a.variant_id === variant.id).forEach(attr => {
          if (attr.attribute_name && attr.attribute_value) {
            variantAttrs[attr.attribute_name] = Array.isArray(attr.attribute_value) ? attr.attribute_value.join(', ') : String(attr.attribute_value);
          }
        });
      }
      return Object.keys(attributes).every(attrName => {
        const selectedValue = String(attributes[attrName]).toLowerCase();
        const variantValue = String(variantAttrs[attrName] || '').toLowerCase();
        return variantValue === selectedValue || variantValue.includes(selectedValue) || selectedValue.includes(variantValue);
      });
    }) || null;
  }, [productWithFlash]);

  useEffect(() => {
    const matchingVariant = findMatchingVariant(selectedAttributes);
    if (!matchingVariant && Object.keys(selectedAttributes).length === 0) {
      if (productWithFlash?.product_variants && Array.isArray(productWithFlash.product_variants) && productWithFlash.product_variants.length > 0) {
        const variantWithStock = productWithFlash.product_variants.find(v => {
          const qty = v?.quantity ?? v?.qty ?? 0;
          return qty > 0 || v?.in_stock === true;
        });
        const variantToSelect = variantWithStock || productWithFlash.product_variants[0];
        setSelectedVariant(variantToSelect);
        return;
      }
    }
    setSelectedVariant(matchingVariant);
  }, [selectedAttributes, findMatchingVariant, productWithFlash?.product_variants]);

  // ── Refresh helper ─────────────────────────────────────────────────────────
  const refreshProductData = useCallback(() => {
    if (!productId) return;
    fetchedRatingRef.current = null;
    fetchedVendorRatingRef.current = null;
    fetchedStoreDataRef.current = null;
    const cacheBuster = `?_t=${Date.now()}`;
    getSingleProduct(`/products/${productId}${cacheBuster}`, false, { background: true });
    const modeParam = `mode=${deliveryMode}`;
    const lat = localStorage.getItem('lat');
    const lng = localStorage.getItem('lng');
    const url = lat && lng
      ? `/products/getNearbyProducts?lat=${lat}&lng=${lng}&${modeParam}${cacheBuster}`
      : `/products/getAllProducts?${modeParam}${cacheBuster}`;
    getProducts(url, false, { background: true });
    getFlash(`/flash-sales/active${cacheBuster}`, false, { background: true });
  }, [productId, deliveryMode, getProducts, getFlash, getSingleProduct]);

  // ── Primary fetch: single product FIRST, then list + flash deferred ────────
  useEffect(() => {
    if (!productId) return;

    // Check for a recent order placed before loading
    try {
      const lastOrderStr = localStorage.getItem('lastOrderPlaced');
      if (lastOrderStr) {
        const lastOrder = JSON.parse(lastOrderStr);
        const timeSinceOrder = Date.now() - lastOrder.timestamp;
        const productIdNum = parseInt(String(productId));
        if (timeSinceOrder < 30000 && lastOrder.productIds?.includes(productIdNum)) {
          localStorage.removeItem('lastOrderPlaced');
          setTimeout(() => refreshProductData(), 2000);
        }
      }
    } catch (e) { console.warn('Error checking last order:', e); }

    fetchedRatingRef.current = null;
    fetchedVendorRatingRef.current = null;
    fetchedStoreDataRef.current = null;

    // Single product immediately — fastest path to render
    getSingleProduct(`/products/${productId}`);

    // Defer list + flash — not needed for above-fold content
    const modeParam = `mode=${deliveryMode}`;
    const lat = localStorage.getItem('lat');
    const lng = localStorage.getItem('lng');
    const url = lat && lng
      ? `/products/getNearbyProducts?lat=${lat}&lng=${lng}&${modeParam}`
      : `/products/getAllProducts?${modeParam}`;
    const t1 = setTimeout(() => getProducts(url), 100);
    const t2 = setTimeout(() => getFlash('/flash-sales/active'), 200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [productId, deliveryMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Order placed event ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleOrderPlaced = () => setTimeout(() => refreshProductData(), 1000);
    if (typeof window !== 'undefined') {
      window.addEventListener('orderPlaced', handleOrderPlaced);
      return () => window.removeEventListener('orderPlaced', handleOrderPlaced);
    }
  }, [refreshProductData]);

  // ── Visibility change ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && productId) {
        try {
          const lastOrderStr = localStorage.getItem('lastOrderPlaced');
          if (lastOrderStr) {
            const lastOrder = JSON.parse(lastOrderStr);
            const timeSinceOrder = Date.now() - lastOrder.timestamp;
            const productIdNum = parseInt(String(productId));
            if (timeSinceOrder < 60000 && lastOrder.productIds?.includes(productIdNum)) {
              localStorage.removeItem('lastOrderPlaced');
              setTimeout(() => refreshProductData(), 500);
            }
          }
        } catch (e) { console.warn('Error checking order on visibility:', e); }
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  }, [productId, refreshProductData]);

  // ── Mount timer order check ────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (productId) {
        try {
          const lastOrderStr = localStorage.getItem('lastOrderPlaced');
          if (lastOrderStr) {
            const lastOrder = JSON.parse(lastOrderStr);
            const timeSinceOrder = Date.now() - lastOrder.timestamp;
            const productIdNum = parseInt(String(productId));
            if (timeSinceOrder < 60000 && lastOrder.productIds?.includes(productIdNum)) {
              localStorage.removeItem('lastOrderPlaced');
              refreshProductData();
            }
          }
        } catch (e) { console.warn('Error checking order on mount:', e); }
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [productId, refreshProductData]);

  // ── Rating / vendor / store (fetched once per product) ────────────────────
  useEffect(() => {
    const productIdValue = productWithFlash?.id;
    if (productIdValue && fetchedRatingRef.current !== productIdValue) {
      fetchedRatingRef.current = productIdValue;
      getRating(`/products/${productIdValue}/rating`);
    }
    const storeId = productWithFlash?.store?.id || productWithFlash?.store?.slug || productWithFlash?.store_id;
    if (storeId && fetchedVendorRatingRef.current !== storeId) {
      fetchedVendorRatingRef.current = storeId;
      getVendorRating(`/stores/${storeId}/rating`);
    }
    if (storeId && !productWithFlash?.store?.user_id && fetchedStoreDataRef.current !== storeId) {
      fetchedStoreDataRef.current = storeId;
      getStoreData(`/stores/${storeId}`);
    }
  }, [productWithFlash?.id, productWithFlash?.store?.id, productWithFlash?.store?.slug, productWithFlash?.store_id, getRating, getVendorRating, getStoreData]);

  // ── Product attributes parsing ─────────────────────────────────────────────
  useEffect(() => {
    if (productWithFlash?.product_attributes?.length) {
      const colorValues = productWithFlash.product_attributes
        .filter(item => item.variant_id == null && item.attribute_name === 'Color')
        .map(item => {
          if (Array.isArray(item.attribute_value)) return item.attribute_value.map(v => v.toLowerCase());
          return item.attribute_value?.toLowerCase();
        });
      const batteryLifeValue = productWithFlash.product_attributes.find(item => item.variant_id == null && item.attribute_name === 'Battery Life');
      setBatteryLife(Number(batteryLifeValue?.attribute_value) || 0);
      const storageValue = productWithFlash.product_attributes.filter(item => item.variant_id == null && item.attribute_name === 'Storage').map(item => item.attribute_value);
      const ramValue = productWithFlash.product_attributes.filter(item => item.variant_id == null && item.attribute_name === 'RAM').map(item => item.attribute_value);
      const sizeValues = productWithFlash.product_attributes.filter(item => item.variant_id == null && item.attribute_name === 'Size').map(item => item.attribute_value);
      setColorsArray(colorValues.flat().filter(Boolean));
      setSizeArray(sizeValues.flat().filter(Boolean));
      setStorage([...new Set(storageValue.filter(Boolean))]);
      setRam([...new Set(ramValue.filter(Boolean))]);
    }
  }, [productWithFlash]);

  useEffect(() => {
    if (colorsArray.length > 0 && !selectedColor) setSelectedColor(colorsArray[0]);
  }, [colorsArray, selectedColor]);

  // ── Recently viewed + log view (deferred 500ms — non-blocking) ────────────
  useEffect(() => {
    if (!productWithFlash?.id) return;
    const t = setTimeout(() => {
      try {
        const key = 'recentlyViewedProductIds';
        const dataKey = 'recentlyViewedProductsData';
        let ids = JSON.parse(localStorage.getItem(key) || '[]');
        let data = JSON.parse(localStorage.getItem(dataKey) || '[]');
        if (!Array.isArray(ids)) ids = [];
        if (!Array.isArray(data)) data = [];
        const idStr = String(productWithFlash.id);
        ids = [idStr, ...ids.filter(x => String(x) !== idStr)].slice(0, 20);
        data = [productWithFlash, ...data.filter(p => String(p?.id) !== idStr)].slice(0, 20);
        localStorage.setItem(key, JSON.stringify(ids));
        localStorage.setItem(dataKey, JSON.stringify(data));
      } catch (error) {
        console.error('Error saving recently viewed product to localStorage:', error);
      }
      if (token && !hasLoggedViewRef.current) {
        hasLoggedViewRef.current = true;
        try {
          logView('/personalized-feed/log-view', { product_id: productWithFlash.id }, false);
        } catch (error) {
          console.error('Error logging product view to server:', error);
        }
      }
    }, 500);
    return () => clearTimeout(t);
  }, [token, productWithFlash?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleQuantityChange = (e) => {
    setQuantity(Math.max(1, parseInt(e.target.value) || 1));
  };

  const handleAddToCart = useCallback(() => {
    if (!productWithFlash) return;
    let variantToUse = selectedVariant;
    if (!variantToUse && productWithFlash?.product_variants && Array.isArray(productWithFlash.product_variants) && productWithFlash.product_variants.length > 0) {
      variantToUse = productWithFlash.product_variants.find(v => {
        const qty = v?.quantity ?? v?.qty ?? 0;
        return qty > 0 || v?.in_stock === true;
      }) || productWithFlash.product_variants[0];
    }
    const numericBase = variantToUse
      ? Number(variantToUse?.price_tax_excl || variantToUse?.price || 0)
      : Number(productWithFlash?.price_tax_excl || productWithFlash?.price || 0);
    const numericFlash = productWithFlash?.flash_price != null ? Number(productWithFlash.flash_price) : null;
    const chosenPrice = Number.isFinite(numericFlash) ? numericFlash : numericBase;
    let cartStoreInfo = null;
    if (productWithFlash.store) {
      cartStoreInfo = Array.isArray(productWithFlash.store) ? productWithFlash.store[0] : productWithFlash.store;
    }
    const payload = {
      id: productWithFlash.id,
      product: productWithFlash,
      price: chosenPrice,
      quantity,
      ...(size ? { size } : {}),
      color: selectedColor,
      batteryLife,
      storage: storage[0],
      ram: ram[0],
      ...(variantToUse?.id && { variant_id: variantToUse.id, variant: variantToUse }),
      ...(cartStoreInfo && { store: cartStoreInfo }),
      ...(productWithFlash.store_id && { storeId: productWithFlash.store_id }),
      ...(cartStoreInfo?.id && { storeId: cartStoreInfo.id }),
      ...(productWithFlash.shipping_charge_regular && { shipping_charge_regular: productWithFlash.shipping_charge_regular }),
      ...(productWithFlash.shipping_charge_same_day && { shipping_charge_same_day: productWithFlash.shipping_charge_same_day }),
      ...(subscriptionData && { subscription: subscriptionData }),
    };
    dispatch(addItem(payload));
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  }, [productWithFlash, selectedVariant, quantity, size, selectedColor, batteryLife, storage, ram, subscriptionData, dispatch]);

  const handleCheckDelivery = async () => {
    if (!postalCode.trim() || !productWithFlash) return;
    setCheckingDelivery(true);
    setDeliveryAvailable(null);
    try {
      const { getLatLngFromPostcode } = await import('@/controller/getLatLngFromPostcode');
      const coords = await getLatLngFromPostcode(postalCode.trim(), 'UK');
      if (!coords) { setDeliveryAvailable(false); setCheckingDelivery(false); return; }
      const storeLat = productWithFlash?.store?.latitude;
      const storeLng = productWithFlash?.store?.longitude;
      const deliveryRadius = productWithFlash?.delivery_radius || 10;
      if (storeLat && storeLng) {
        const R = 6371;
        const dLat = (coords.lat - storeLat) * Math.PI / 180;
        const dLng = (coords.lng - storeLng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(storeLat * Math.PI / 180) * Math.cos(coords.lat * Math.PI / 180) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        setDeliveryAvailable(distance <= deliveryRadius);
      } else {
        setDeliveryAvailable(true);
      }
    } catch (error) {
      console.error('Error checking delivery:', error);
      setDeliveryAvailable(false);
    } finally {
      setCheckingDelivery(false);
    }
  };

  // ── Favorite check (deferred 100ms) ───────────────────────────────────────
  useEffect(() => {
    if (!productWithFlash?.id) return;
    const timer = setTimeout(async () => {
      if (!token) {
        try {
          const saved = JSON.parse(localStorage.getItem('favorites') || '{}');
          setIsFavorite(!!saved[String(productWithFlash.id)]);
        } catch (e) { setIsFavorite(false); }
        return;
      }
      try {
        setIsFavorite(await productFavorites.check(productWithFlash.id));
      } catch (error) {
        console.error('Error checking favorite:', error);
        try {
          const saved = JSON.parse(localStorage.getItem('favorites') || '{}');
          setIsFavorite(!!saved[String(productWithFlash.id)]);
        } catch (e) { setIsFavorite(false); }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [productWithFlash?.id, token]);

  const toggleFavorite = useCallback(async () => {
    if (!productWithFlash?.id) return;
    const wasFavorite = isFavorite;
    setIsFavorite(!wasFavorite);
    try {
      if (wasFavorite) await productFavorites.remove(productWithFlash.id);
      else await productFavorites.add(productWithFlash.id);
      try {
        const key = String(productWithFlash.id);
        const saved = JSON.parse(localStorage.getItem('favorites') || '{}');
        if (wasFavorite) delete saved[key]; else saved[key] = true;
        localStorage.setItem('favorites', JSON.stringify(saved));
      } catch { /* ignore */ }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('favoriteUpdated', {
          detail: { productId: productWithFlash.id, isFavorite: !wasFavorite }
        }));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setIsFavorite(wasFavorite);
    }
  }, [isFavorite, productWithFlash?.id]);

  // ── Images ─────────────────────────────────────────────────────────────────
  const productImages = useMemo(() => {
    if (productWithFlash?.images?.length > 0) return productWithFlash.images;
    if (productWithFlash?.featured_image) return [{ url: productWithFlash.featured_image.url, alt_text: productWithFlash.name }];
    return [];
  }, [productWithFlash]);

  const mainImageUrl = useMemo(() => {
    if (selectedVariant?.image) return buildImageUrl(selectedVariant.image);
    if (productImages[selectedImageIndex]?.url) return buildImageUrl(productImages[selectedImageIndex].url);
    if (productWithFlash?.featured_image?.url) return buildImageUrl(productWithFlash.featured_image.url);
    return '/images/NoImageLong.jpg';
  }, [selectedVariant, productImages, selectedImageIndex, productWithFlash?.featured_image?.url]);

  // ── Loading: only block on single product (fastest path to render) ─────────
  if (singleProductLoading && !baseProduct) {
    return (
      <SharedLayout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#F44323] mb-4"></div>
              <p className="text-gray-600">{t('common.loading')}...</p>
            </div>
          </div>
        </div>
      </SharedLayout>
    );
  }

  const combinedError = productsError || singleProductError;
  if (combinedError || !productWithFlash) {
    return (
      <SharedLayout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <BackButton />
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-4 text-center">
            <p className="text-red-600 font-medium">
              {t('common.error')}: {combinedError || 'Product not found'}
            </p>
          </div>
        </div>
      </SharedLayout>
    );
  }

  const discount = productWithFlash.compared_price && productWithFlash.compared_price > (productWithFlash.flash_price || productWithFlash.price_tax_excl)
    ? Math.round(((productWithFlash.compared_price - (productWithFlash.flash_price || productWithFlash.price_tax_excl)) / productWithFlash.compared_price) * 100)
    : 0;

  return (
    <SharedLayout>
      <div className="min-h-screen bg-white lg:pb-10 pb-10 font-sans">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">

          {/* Back Button */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <BackButton />
          </div>

          <section className="w-full bg-white py-0">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* LEFT SIDE - IMAGES */}
              <div className="flex gap-6">
                {/* Thumbnails */}
                {productImages.length > 0 && (
                  <div className="flex flex-col gap-4">
                    {productImages.map((img, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`w-20 h-20 rounded-lg flex items-center justify-center border cursor-pointer overflow-hidden ${selectedImageIndex === index ? "border-black" : "border-gray-200"}`}
                      >
                        <img
                          src={buildImageUrl(img?.url || img)}
                          alt="thumb"
                          className="w-full h-full object-contain"
                          loading="lazy"
                          onError={(e) => { e.target.src = '/images/NoImageLong.jpg'; }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Main Image — click opens zoom modal */}
                <div
                  className="flex-1 bg-gray-50 rounded-2xl p-10 flex items-center justify-center cursor-zoom-in"
                  onClick={() => setIsZoomModalOpen(true)}
                >
                  <img
                    src={mainImageUrl}
                    alt={productWithFlash.name}
                    className="w-full h-full object-contain max-h-96"
                    onError={(e) => { e.target.src = '/images/NoImageLong.jpg'; }}
                  />
                </div>
              </div>

              {/* RIGHT SIDE - DETAILS */}
              <div>
                <h1 className="text-4xl font-semibold text-gray-900">
                  {productWithFlash.name}
                </h1>

                {/* Price */}
                <div className="flex items-center gap-4 mt-6">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(currentPrice)}
                  </span>
                  {!productWithFlash.compared_price || productWithFlash.compared_price === 0 ? (
                    <span className="text-3xl text-gray-500 line-through">
                      {formatPrice(currentPrice)}
                    </span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-gray-900">
                        {formatPrice(currentPrice)}
                      </span>
                      {productWithFlash.compared_price > currentPrice && (
                        <span className="text-2xl md:text-[25px] text-[#A0A0A0] line-through">
                          {formatPrice(productWithFlash.compared_price)}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Colors */}
                {(() => {
                  const colorEntries = Object.entries(getVariantAttributes).filter(([attrName]) => attrName.toLowerCase() === 'color');
                  if (colorEntries.length === 0) return null;
                  const [attrName, values] = colorEntries[0];
                  return (
                    <div className="mt-8">
                      <p className="text-gray-600 mb-3">
                        Select color : <span className="font-medium text-gray-800">{selectedAttributes[attrName] || ''}</span>
                      </p>
                      <div className="flex gap-4 flex-wrap">
                        {values.map((value) => {
                          const isSelected = selectedAttributes[attrName] === value;
                          const cssColor = resolveColor(value);
                          return (
                            <button
                              key={value}
                              title={value}
                              onClick={() => handleAttributeSelect(attrName, value)}
                              style={{ backgroundColor: cssColor }}
                              className={`w-10 h-10 rounded-full transition-all ${isSelected ? "ring-2 ring-offset-2 ring-black scale-110" : "ring-1 ring-gray-300 hover:ring-gray-400"}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Storage */}
                {(() => {
                  const storageEntries = Object.entries(getVariantAttributes).filter(([attrName]) => attrName.toLowerCase().includes('storage'));
                  if (storageEntries.length === 0) return null;
                  const [attrName, values] = storageEntries[0];
                  return (
                    <div className="mt-8 flex gap-4 flex-wrap">
                      {values.map((sz) => (
                        <button
                          key={sz}
                          onClick={() => handleAttributeSelect(attrName, sz)}
                          className={`px-6 py-3 rounded-lg border text-sm font-medium transition ${selectedAttributes[attrName] === sz ? "border-red-500 text-red-500 bg-red-50" : "border-gray-300 text-gray-600 hover:border-gray-400"}`}
                        >{sz}</button>
                      ))}
                    </div>
                  );
                })()}

                {/* Description */}
                <div className="mt-8">
                  <p className={`text-gray-500 leading-relaxed max-w-lg ${!isDescriptionExpanded ? 'line-clamp-3' : ''}`}>
                    {productWithFlash.short_description || productWithFlash.description || "No description available"}
                  </p>
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="text-orange-500 font-semibold text-sm mt-3 hover:text-orange-600 transition"
                  >
                    {isDescriptionExpanded ? 'See Less' : 'See More'}
                  </button>
                </div>

                {/* Info Section */}
                <div className="grid grid-cols-3 gap-6 mt-10">
                  {(() => {
                    const deliveryTime = productWithFlash?.ready_in_minutes
                      ? productWithFlash.ready_in_minutes < 60
                        ? `${productWithFlash.ready_in_minutes} min`
                        : `${Math.ceil(productWithFlash.ready_in_minutes / 60)} hours`
                      : '1-2 days';
                    return (
                      <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                          <TruckIcon className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Delivery</p>
                          <p className="text-sm font-semibold">{deliveryTime}</p>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                      <CheckIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">In Stock</p>
                      <p className="text-sm font-semibold">{currentQuantity > 0 ? (currentQuantity < 10 ? `0${currentQuantity}` : currentQuantity) : '00'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                      <ShieldCheckIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Category</p>
                      <p className="text-sm font-semibold truncate">
                        {productWithFlash.categories && productWithFlash.categories.length > 0
                          ? productWithFlash.categories[0].name
                          : 'Products'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subscription Section */}
                <div className="mt-10 border border-gray-300 rounded-lg p-6 bg-gray-50">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                    Subscription for {productWithFlash.name}{selectedAttributes['Storage'] ? ` – ${selectedAttributes['Storage']}` : ''}
                  </h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="subscription-checkbox"
                        checked={subscriptionData?.enabled || false}
                        onChange={(e) => setSubscriptionData({ ...subscriptionData, enabled: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-400 cursor-pointer"
                      />
                      <label htmlFor="subscription-checkbox" className="text-gray-900 font-medium text-sm cursor-pointer">
                        Enable subscription
                      </label>
                    </div>
                    <a href="#" className="text-blue-500 text-xs font-medium hover:underline">
                      Automatic deliveries
                    </a>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={handleAddToCart}
                    disabled={currentQuantity === 0}
                    className={`flex-1 py-4 rounded-xl text-lg font-medium transition ${currentQuantity > 0
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-gray-400 text-white cursor-not-allowed'
                      }`}
                  >
                    {currentQuantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Bottom Info Section */}
          <div className="pt-8 sm:pt-12 md:pt-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 lg:gap-24 items-stretch">

              {/* Product Information Column */}
              <div className="flex flex-col lg:gap-8 gap-4">
                <div className="border border-[#D8DADC] rounded-[8px] p-4 sm:p-6 md:p-8 h-full">
                  <h3 className="text-xl sm:text-2xl font-semibold text-[#000000] mb-4 sm:mb-6">
                    Product Information
                  </h3>
                  <div className="text-[#9D9D9D] font-medium text-sm leading-7 space-y-4 mb-8">
                    <p>
                      {productWithFlash.description
                        ? productWithFlash.description
                        : "Just as a book is judged by its cover, the first thing you notice when you pick up a modern smartphone is the display. Nothing surprising, because advanced technologies allow you to practically level the display frames and cutouts for the front camera and speaker, leaving no room for bold design solutions. And how good that in such realities Apple everything is fine with displays."}
                    </p>
                  </div>

                  {/* Screen Details Section */}
                  {(() => {
                    const screenDiagonal = productWithFlash.product_attributes?.find(a => a.attribute_name?.toLowerCase() === 'screen diagonal')?.attribute_value;
                    const screenResolution = productWithFlash.product_attributes?.find(a => a.attribute_name?.toLowerCase() === 'the screen resolution' || a.attribute_name?.toLowerCase() === 'resolution')?.attribute_value;
                    const screenRefreshRate = productWithFlash.product_attributes?.find(a => a.attribute_name?.toLowerCase() === 'the screen refresh rate' || a.attribute_name?.toLowerCase() === 'refresh rate')?.attribute_value;
                    const pixelDensity = productWithFlash.product_attributes?.find(a => a.attribute_name?.toLowerCase() === 'the pixel density' || a.attribute_name?.toLowerCase() === 'pixel density')?.attribute_value;
                    const screenType = productWithFlash.product_attributes?.find(a => a.attribute_name?.toLowerCase() === 'screen type')?.attribute_value;
                    const additionally = productWithFlash.product_attributes?.find(a => a.attribute_name?.toLowerCase() === 'additionally')?.attribute_value;
                    const hasScreenData = screenDiagonal || screenResolution || screenRefreshRate || pixelDensity || screenType || additionally;
                    if (!hasScreenData) return null;
                    return (
                      <div className="mb-8">
                        <div className="pb-3">
                          <h4 className="lg:text-xl text-base font-semibold text-[#000000] mb-2">Screen</h4>
                        </div>
                        <div className="space-y-2">
                          {screenDiagonal && (<div className="py-2 pt-2 font-medium flex justify-between items-center text-sm border-b border-[#CDCDCD]"><span className="text-[#000000] font-normal">Screen diagonal</span><span className="text-[#000000] font-normal">{Array.isArray(screenDiagonal) ? screenDiagonal.join(', ') : screenDiagonal}</span></div>)}
                          {screenResolution && (<div className="py-2 font-medium flex justify-between items-center text-sm border-b border-[#CDCDCD]"><span className="text-[#000000] font-normal">The screen resolution</span><span className="text-[#000000] font-normal">{Array.isArray(screenResolution) ? screenResolution.join(', ') : screenResolution}</span></div>)}
                          {screenRefreshRate && (<div className="py-2 font-medium flex justify-between items-center text-sm border-b border-[#CDCDCD]"><span className="text-[#000000] font-normal">The screen refresh rate</span><span className="text-[#000000] font-normal">{Array.isArray(screenRefreshRate) ? screenRefreshRate.join(', ') : screenRefreshRate}</span></div>)}
                          {pixelDensity && (<div className="py-2 font-medium flex justify-between items-center text-sm border-b border-[#CDCDCD]"><span className="text-[#000000] font-normal">The pixel density</span><span className="text-[#000000] font-normal">{Array.isArray(pixelDensity) ? pixelDensity.join(', ') : pixelDensity}</span></div>)}
                          {screenType && (<div className="py-2 font-medium flex justify-between items-center text-sm border-b border-[#CDCDCD]"><span className="text-[#000000] font-normal">Screen type</span><span className="text-[#000000] font-normal">{Array.isArray(screenType) ? screenType.join(', ') : screenType}</span></div>)}
                          {additionally && (
                            <div className="px-6 py-3 flex justify-between items-start text-sm">
                              <span className="text-[#000000] font-normal">Additionally</span>
                              <div className="text-right text-[#000000] font-normal space-y-1">
                                {(Array.isArray(additionally) ? additionally : String(additionally).split(',')).map((item, idx) => (
                                  <div key={idx}>{String(item).trim()}</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Box Contents */}
                  {productWithFlash.box_contents && (
                    <div className="mb-8">
                      <div className="pb-3 border-b border-[#CDCDCD]">
                        <h4 className="lg:text-xl text-base font-semibold text-[#000000] mb-2">What's in the Box</h4>
                      </div>
                      <div className="py-4 text-[#6C6C6C] text-sm leading-relaxed">
                        {productWithFlash.box_contents}
                      </div>
                    </div>
                  )}

                  {/* Specifications */}
                  {(() => {
                    const allProductAttributes = productWithFlash.product_attributes || [];
                    const productLevelAttributes = allProductAttributes.filter(attr => !attr.variant_id);
                    const specs = {};
                    productLevelAttributes.forEach(attr => {
                      if (attr.attribute_name) {
                        const name = String(attr.attribute_name).trim();
                        const value = Array.isArray(attr.attribute_value) ? attr.attribute_value.join(', ') : String(attr.attribute_value).trim();
                        if (name && value) specs[name] = value;
                      }
                    });
                    if (productWithFlash.condition) specs['Condition'] = productWithFlash.condition;
                    if (productWithFlash.warranty) specs['Warranty'] = productWithFlash.warranty;
                    if (Number(productWithFlash.weight) > 0) specs['Weight'] = `${productWithFlash.weight} kg`;
                    if (Number(productWithFlash.width) > 0 || Number(productWithFlash.height) > 0 || Number(productWithFlash.depth) > 0) {
                      specs['Dimensions'] = `${productWithFlash.width || '0'} x ${productWithFlash.height || '0'} x ${productWithFlash.depth || '0'} cm`;
                    }
                    const specEntries = Object.entries(specs);
                    if (specEntries.length === 0) return null;
                    return (
                      <div className="mb-8">
                        <div className="pb-3 border-b border-[#CDCDCD] mb-4">
                          <h4 className="lg:text-xl text-base font-semibold text-[#000000] mb-2">Specifications</h4>
                        </div>
                        <div className="space-y-3">
                          {specEntries.map(([specName, specValue], idx) => (
                            <div key={`${specName}-${idx}`} className="flex justify-between items-center text-sm pb-2 border-b border-gray-50 last:border-0">
                              <span className="text-gray-900 font-medium">{specName}</span>
                              <span className="text-gray-500 font-medium text-right max-w-xs">{specValue}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Tags / Features */}
                  {productWithFlash.tags && productWithFlash.tags.length > 0 && (
                    <div className="flex justify-between items-start text-sm pt-4 mt-2">
                      <span className="text-gray-900 font-medium">Features</span>
                      <div className="text-right text-gray-500 font-medium space-y-1">
                        {productWithFlash.tags.map(tag => (
                          <div key={tag.name || tag}>{typeof tag === 'object' ? tag.name : tag}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping & Delivery Column */}
              <div className="flex flex-col">
                <div className="border border-[#D8DADC] rounded-[8px] p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 flex-1">
                  <h3 className="text-xl sm:text-2xl font-semibold text-[#000000] mb-4 sm:mb-6">Shipping & Delivery</h3>
                  <div className="text-[#000000] font-medium text-sm leading-6 sm:leading-7 space-y-3 sm:space-y-4 mb-4 sm:mb-6 md:mb-8">
                    <p>
                      {productWithFlash.shipping_policy || storeInfo?.shipping_policy || "Standard shipping policy applies to all orders. Please check availability at checkout."}
                    </p>
                  </div>
                  <h4 className="lg:text-xl text-base font-semibold text-[#000000] mb-3 sm:mb-4">Details</h4>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center text-xs sm:text-sm pb-2 sm:pb-3 border-b border-[#CDCDCD] last:border-0">
                      <span className="text-[#000000] font-normal">Regular Shipping</span>
                      <span className="text-[#000000] font-normal">{formatPrice(productWithFlash.shipping_charge_regular ?? storeInfo?.shipping_charge_regular ?? 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pb-3 border-b border-[#CDCDCD] last:border-0">
                      <span className="text-[#000000] font-normal">Same Day Delivery</span>
                      <span className="text-[#000000] font-normal">{formatPrice(productWithFlash.shipping_charge_same_day ?? storeInfo?.shipping_charge_same_day ?? 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pb-3 border-b border-[#CDCDCD] last:border-0">
                      <span className="text-[#000000] font-normal">Delivery Radius</span>
                      <span className="text-[#000000] font-normal">{productWithFlash.delivery_radius ?? storeInfo?.delivery_radius ?? 10} km</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pb-3 border-b border-[#CDCDCD] last:border-0">
                      <span className="text-[#000000] font-normal">Ready in</span>
                      <span className="text-[#000000] font-normal">{productWithFlash.ready_in_minutes ?? storeInfo?.ready_in_minutes ?? 45} Minutes</span>
                    </div>
                  </div>
                </div>

                {/* Store & Returns Card */}
                <div className="border border-[#D8DADC] rounded-[8px] mb-4 sm:mb-6 flex-1">
                  <div className="p-3 sm:p-4 flex items-start gap-3 sm:gap-4 border-b border-[#CDCDCD]">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
                      <TruckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#717171]" />
                    </div>
                    <div>
                      <h4 className="text-[#092E3B] font-medium text-sm sm:text-base mb-1">
                        {productWithFlash.store?.name || 'Verified Store'}
                      </h4>
                      <p className="text-[#000000] font-medium text-xs">Enter your postal code for Delivery Availability</p>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 flex items-start gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
                      <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                    </div>
                    <div>
                      <h4 className="text-[#092E3B] font-bold text-xs sm:text-sm mb-1">Return Delivery</h4>
                      <p className="text-gray-500 text-xs text-left">
                        {productWithFlash.returns || productWithFlash.return_policy || storeInfo?.return_policy || "Free 30 Days Delivery Returns. Details"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-gray-100"></div>
          </div>

          {/* Success Toast */}
          <AnimatePresence>
            {showSuccessMessage && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-4 right-4 sm:bottom-10 sm:right-10 z-50 bg-gray-900 text-white px-4 py-3 sm:px-6 sm:py-4 rounded-xl shadow-2xl flex items-center gap-2 sm:gap-3 max-w-[90vw] sm:max-w-none"
              >
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold">Added to Cart</p>
                  <p className="text-gray-400 text-sm">{productWithFlash.name}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Below-fold sections — lazy loaded so they don't block first paint */}
      <Suspense fallback={null}>
        <TestimonialSection productId={productId} />
      </Suspense>
      {/* <ProductDetailSection /> */}

      {/* Built-in Image Zoom Modal
          - Scroll wheel / pinch-to-zoom zooms the PRODUCT IMAGE, not the browser page
          - Click-and-drag to pan when zoomed
          - Double-click to toggle zoom
          - Keyboard: Esc closes, ←/→ changes image, +/- adjusts zoom
          - Thumbnail strip + Prev/Next arrows for multi-image products        */}
      <ImageZoomModal
        isOpen={isZoomModalOpen}
        onClose={() => setIsZoomModalOpen(false)}
        images={productImages.map(img => buildImageUrl(img?.url) || '/images/NoImageLong.jpg')}
        currentIndex={selectedImageIndex}
        productName={productWithFlash?.name}
      />
    </SharedLayout>
  );
}