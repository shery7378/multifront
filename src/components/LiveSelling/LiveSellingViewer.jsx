'use client';

import { useState, useEffect, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { FaTimes, FaShoppingCart } from 'react-icons/fa';
import axios from 'axios';
import { useI18n } from '@/contexts/I18nContext';
import ProductCard from '@/components/ProductCard';

export default function LiveSellingViewer({ session, onClose }) {
  const { t } = useI18n();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [showProducts, setShowProducts] = useState(false);

  const remoteVideoRef = useRef(null);
  const clientRef = useRef(null);
  const remoteTracksRef = useRef([]);

  useEffect(() => {
    if (session) {
      joinSession();
      loadFeaturedProducts();
    }

    return () => {
      leaveSession();
    };
  }, [session]);

  const joinSession = async () => {
    try {
      setError(null);

      // Get token from backend
      const tokenResponse = await axios.post(`/api/live-selling/${session.id}/token`);
      const { token, channel_name, app_id, uid } = tokenResponse.data.data;

      // Initialize Agora client
      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      clientRef.current = client;

      // Join channel as audience
      const agoraAppId = app_id || process.env.NEXT_PUBLIC_AGORA_APP_ID;
      if (!agoraAppId) {
        throw new Error('Agora App ID is not configured');
      }
      
      await client.join(
        agoraAppId,
        channel_name,
        token,
        uid || null
      );

      // Set user role as audience (subscriber)
      await client.setClientRole('audience');

      // Listen for remote tracks
      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);

        if (mediaType === 'video') {
          const remoteVideoTrack = user.videoTrack;
          remoteTracksRef.current.push(remoteVideoTrack);
          if (remoteVideoRef.current) {
            remoteVideoTrack.play(remoteVideoRef.current);
          }
        }

        if (mediaType === 'audio') {
          const remoteAudioTrack = user.audioTrack;
          remoteTracksRef.current.push(remoteAudioTrack);
          remoteAudioTrack.play();
        }
      });

      client.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') {
          const videoTrack = user.videoTrack;
          videoTrack?.stop();
        }
        if (mediaType === 'audio') {
          const audioTrack = user.audioTrack;
          audioTrack?.stop();
        }
      });

      setIsConnected(true);
    } catch (err) {
      console.error('Error joining session:', err);
      setError(err.response?.data?.message || err.message || 'Failed to join session');
    }
  };

  const leaveSession = async () => {
    try {
      // Stop all remote tracks
      remoteTracksRef.current.forEach((track) => {
        track?.stop();
      });
      remoteTracksRef.current = [];

      // Leave channel
      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current = null;
      }

      // Notify backend
      try {
        await axios.post(`/api/live-selling/${session.id}/leave`);
      } catch (err) {
        console.error('Error notifying leave:', err);
      }

      setIsConnected(false);
    } catch (err) {
      console.error('Error leaving session:', err);
    }
  };

  const loadFeaturedProducts = async () => {
    if (!session.featured_products || session.featured_products.length === 0) {
      return;
    }

    try {
      const productIds = session.featured_products.join(',');
      const response = await axios.get(`/api/products?ids=${productIds}`);
      setFeaturedProducts(response.data.data || []);
    } catch (err) {
      console.error('Error loading featured products:', err);
    }
  };

  const handleClose = () => {
    leaveSession();
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Video Container */}
      <div className="flex-1 relative">
        <div
          ref={remoteVideoRef}
          className="w-full h-full"
          style={{ objectFit: 'contain' }}
        />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition"
          aria-label="Close"
        >
          <FaTimes />
        </button>

        {/* Products Toggle */}
        {featuredProducts.length > 0 && (
          <button
            onClick={() => setShowProducts(!showProducts)}
            className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-opacity-70 transition"
          >
            <FaShoppingCart />
            Products ({featuredProducts.length})
          </button>
        )}

        {/* Error Message */}
        {error && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Connection Status */}
        {!isConnected && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Connecting to live stream...</p>
            </div>
          </div>
        )}
      </div>

      {/* Products Sidebar */}
      {showProducts && featuredProducts.length > 0 && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-white overflow-y-auto p-4 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Featured Products</h3>
            <button
              onClick={() => setShowProducts(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes />
            </button>
          </div>
          <div className="space-y-4">
            {featuredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                isFavorite={false}
                toggleFavorite={() => {}}
                onPreviewClick={() => {}}
                productModal={() => {}}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

