'use client';

import { useState, useEffect, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { FaStop, FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import axios from 'axios';
import { useI18n } from '@/contexts/I18nContext';

export default function LiveSellingHost({ session, onEnd }) {
  const { t } = useI18n();
  const [isLive, setIsLive] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [error, setError] = useState(null);
  const [viewerCount, setViewerCount] = useState(session.viewer_count || 0);

  const localVideoRef = useRef(null);
  const clientRef = useRef(null);
  const localTracksRef = useRef({
    videoTrack: null,
    audioTrack: null,
  });

  useEffect(() => {
    if (session && session.status === 'live') {
      startBroadcast();
    }

    return () => {
      stopBroadcast();
    };
  }, [session]);

  const startBroadcast = async () => {
    try {
      setError(null);

      // Initialize Agora client
      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      clientRef.current = client;

      // Get token from backend
      const response = await axios.post(`/api/live-selling/${session.id}/start`);
      const { agora_token, channel_name } = response.data.data;

      // Join channel
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || response.data.data.app_id;
      const uid = await client.join(
        appId,
        channel_name,
        agora_token,
        session.vendor_id
      );

      // Create and publish local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
        {},
        {
          encoderConfig: {
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
            frameRate: { min: 15, ideal: 30, max: 60 },
            bitrateMin: 1000,
            bitrateMax: 3000,
          },
        }
      );

      localTracksRef.current.audioTrack = audioTrack;
      localTracksRef.current.videoTrack = videoTrack;

      // Set user role as host
      await client.setClientRole('host');

      // Publish tracks
      await client.publish([audioTrack, videoTrack]);

      // Display local video
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }

      setIsLive(true);

      // Listen for remote users (viewers)
      client.on('user-joined', (user) => {
        setViewerCount((prev) => prev + 1);
      });

      client.on('user-left', (user) => {
        setViewerCount((prev) => Math.max(0, prev - 1));
      });
    } catch (err) {
      console.error('Error starting broadcast:', err);
      setError(err.message || 'Failed to start broadcast');
    }
  };

  const stopBroadcast = async () => {
    try {
      // Unpublish and stop local tracks
      if (clientRef.current) {
        const tracks = [
          localTracksRef.current.videoTrack,
          localTracksRef.current.audioTrack,
        ].filter(Boolean);

        if (tracks.length > 0) {
          await clientRef.current.unpublish(tracks);
        }

        tracks.forEach((track) => {
          track.stop();
          track.close();
        });

        await clientRef.current.leave();
        clientRef.current = null;
      }

      localTracksRef.current = { videoTrack: null, audioTrack: null };
      setIsLive(false);

      // Call onEnd callback
      if (onEnd) {
        onEnd();
      }
    } catch (err) {
      console.error('Error stopping broadcast:', err);
    }
  };

  const toggleVideo = async () => {
    if (localTracksRef.current.videoTrack) {
      await localTracksRef.current.videoTrack.setEnabled(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = async () => {
    if (localTracksRef.current.audioTrack) {
      await localTracksRef.current.audioTrack.setEnabled(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-black">
      {/* Video Container */}
      <div className="flex-1 relative">
        <div
          ref={localVideoRef}
          className="w-full h-full"
          style={{ objectFit: 'contain' }}
        />

        {/* Controls Overlay */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${
              isVideoEnabled ? 'bg-white text-gray-800' : 'bg-red-500 text-white'
            }`}
            aria-label={isVideoEnabled ? 'Disable video' : 'Enable video'}
          >
            {isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
          </button>

          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full ${
              isAudioEnabled ? 'bg-white text-gray-800' : 'bg-red-500 text-white'
            }`}
            aria-label={isAudioEnabled ? 'Disable audio' : 'Enable audio'}
          >
            {isAudioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
          </button>

          <button
            onClick={stopBroadcast}
            className="p-3 rounded-full bg-red-500 text-white"
            aria-label="End broadcast"
          >
            <FaStop />
          </button>
        </div>

        {/* Viewer Count */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-full text-sm">
          👁️ {viewerCount} viewers
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500 text-white p-4 text-center">
          {error}
        </div>
      )}
    </div>
  );
}

