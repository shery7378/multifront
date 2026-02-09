'use client';

import { useState, useEffect, useRef } from 'react';
import { useGetRequest } from '@/controller/getRequests';
import { usePostRequest } from '@/controller/postRequests';

const ChatWidget = ({ vendorId = null, isSupport = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [CometChatComponent, setCometChatComponent] = useState(null);
  const initRef = useRef(false);
  const { data: initData, sendGetRequest: initChat } = useGetRequest();
  const { sendPostRequest: createConversation } = usePostRequest();

  // Optimized initialization
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initializeCometChat = async () => {
      try {
        // Check cache first
        const cached = localStorage.getItem('cometchat_init');
        let data = null;
        
        if (cached) {
          try {
            const cachedData = JSON.parse(cached);
            if (Date.now() - cachedData.timestamp < 3600000) {
              data = cachedData.data;
            }
          } catch (e) {
            // Continue
          }
        }

        if (!data) {
          await initChat('/chat/initialize', true);
          if (initData?.success && initData?.data) {
            data = initData.data;
            localStorage.setItem('cometchat_init', JSON.stringify({
              data: data,
              timestamp: Date.now()
            }));
          }
        }

        if (data) {
          // Dynamically import and initialize
          const { CometChatUIKit: UIKit, UIKitSettingsBuilder: Builder, CometChatConversationsWithMessages } = await import('@cometchat/chat-uikit-react');
          
          const UIKitSettings = new Builder()
            .setAppId(data.app_id)
            .setRegion(data.region)
            .setAuthKey(data.auth_key || data.auth_token)
            .subscribePresenceForAllUsers()
            .build();
          
          await UIKit.init(UIKitSettings);
          await UIKit.login(data.uid);
          
          // Wait to ensure ready
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          setCometChatComponent(() => CometChatConversationsWithMessages);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('CometChat initialization error:', error);
        localStorage.removeItem('cometchat_init');
      }
    };

    initializeCometChat();
  }, [initData]);

  // Create conversation if vendorId provided
  useEffect(() => {
    if (vendorId && isInitialized) {
      createConversation('/chat/conversations', { vendor_id: vendorId }, true).catch(console.error);
    }
  }, [vendorId, isInitialized]);

  return (
    <>
      {/* Chat Button - Fully Responsive */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-[9999] group active:scale-95 touch-manipulation"
          aria-label="Open chat"
        >
          <svg
            className="w-6 h-6 sm:w-7 sm:h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
      )}

      {/* Chat Window - Fully Responsive */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-4 sm:right-4 sm:w-[380px] sm:h-[580px] md:w-[420px] md:h-[600px] lg:w-[450px] lg:h-[650px] sm:rounded-lg sm:max-w-[calc(100vw-1rem)] sm:max-h-[calc(100vh-2rem)] bg-white shadow-2xl flex flex-col z-[9999] border border-gray-200 animate-in slide-in-from-bottom-5">
          <div className="bg-blue-600 text-white p-3 sm:p-4 md:p-4 sm:rounded-t-lg flex justify-between items-center flex-shrink-0 min-h-[60px] sm:min-h-[64px]">
            <h3 className="font-semibold text-base sm:text-lg md:text-lg">
              {isSupport ? 'Support Chat' : 'Messages'}
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 active:text-gray-300 transition-colors p-2 sm:p-2 md:p-2 touch-manipulation"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-hidden relative">
            {CometChatComponent && isInitialized ? (
              <div className="w-full h-full">
                <CometChatComponent />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full p-4 sm:p-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-blue-600 mx-auto mb-2 sm:mb-3"></div>
                  <p className="text-sm text-gray-500">Loading chat...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
