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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const tokenResponse = await axios.post(`${apiUrl}/api/live-selling/${session.id}/token`);
      
      console.log('Token response:', tokenResponse.data);
      
      const { token, channel_name, app_id, uid } = tokenResponse.data.data || {};

      // Initialize Agora client
      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      clientRef.current = client;

      // Join channel as audience
      // Prioritize app_id from response (it should match the token)
      // Trim whitespace to prevent issues
      const agoraAppId = (app_id || process.env.NEXT_PUBLIC_AGORA_APP_ID || '').trim();
      
      console.log('Agora App ID check:', {
        fromResponse: app_id,
        fromEnv: process.env.NEXT_PUBLIC_AGORA_APP_ID,
        final: agoraAppId,
        finalLength: agoraAppId.length,
        tokenLength: token?.length,
        channelName: channel_name,
        tokenPreview: token ? token.substring(0, 50) + '...' : null,
        fullResponse: tokenResponse.data,
      });
      
      if (!agoraAppId) {
        const errorMsg = 'Agora App ID is not configured. Please set NEXT_PUBLIC_AGORA_APP_ID in your .env.local file or ensure the backend returns app_id.';
        console.error(errorMsg, { 
          app_id, 
          env: process.env.NEXT_PUBLIC_AGORA_APP_ID,
          responseData: tokenResponse.data 
        });
        setError(errorMsg);
        return;
      }
      
      if (!token) {
        const errorMsg = 'Agora token is missing from server response';
        console.error(errorMsg, { responseData: tokenResponse.data });
        setError(errorMsg);
        return;
      }
      
      if (!channel_name) {
        const errorMsg = 'Channel name is missing from server response';
        console.error(errorMsg, { responseData: tokenResponse.data });
        setError(errorMsg);
        return;
      }
      
      // Validate app_id format (should be 32 hex characters)
      const cleanAppId = agoraAppId.replace(/\s/g, ''); // Remove any whitespace
      if (cleanAppId.length !== 32 || !/^[a-f0-9]{32}$/i.test(cleanAppId)) {
        const errorMsg = `Invalid Agora App ID format. Expected 32 hex characters, got: "${agoraAppId}" (length: ${agoraAppId.length}, cleaned: ${cleanAppId.length}). Please check your Agora App ID in the .env file.`;
        console.error(errorMsg);
        setError(errorMsg);
        return;
      }
      
      // Use cleaned App ID
      const finalAppId = cleanAppId;
      
      console.log('Attempting to join Agora channel...', {
        appId: finalAppId,
        appIdOriginal: agoraAppId,
        channel: channel_name,
        uid: uid || null,
      });
      
      try {
        console.log('Calling client.join with:', {
          appId: finalAppId,
          appIdOriginal: agoraAppId,
          appIdType: typeof finalAppId,
          appIdLength: finalAppId?.length,
          channel: channel_name,
          tokenLength: token?.length,
          uid: uid || null,
        });
        
        await client.join(
          finalAppId,
          channel_name,
          token,
          uid || null
        );
        
        console.log('Successfully joined Agora channel');
      } catch (joinError) {
        console.error('Agora join error details:', {
          error: joinError,
          appId: finalAppId,
          appIdOriginal: agoraAppId,
          appIdType: typeof finalAppId,
          appIdLength: finalAppId?.length,
          channel: channel_name,
          errorMessage: joinError.message,
          errorCode: joinError.code,
          errorName: joinError.name,
          fullError: JSON.stringify(joinError, Object.getOwnPropertyNames(joinError)),
        });
        
        // Provide more helpful error message
        if (joinError.message && joinError.message.includes('invalid vendor key')) {
          const helpfulMsg = `Agora RTC Error: The App ID "${finalAppId}" appears to be invalid or from a Chat-only project. Please ensure you're using an App ID from an RTC-enabled project in your Agora console. Verify the App ID in your .env files matches your RTC project.`;
          console.error(helpfulMsg);
          setError(helpfulMsg);
        } else {
          setError(joinError.message || 'Failed to join Agora channel');
        }
        throw joinError;
      }

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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        await axios.post(`${apiUrl}/api/live-selling/${session.id}/leave`);
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

