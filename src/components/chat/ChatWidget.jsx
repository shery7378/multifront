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
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-primary text-white rounded-full p-4 shadow-lg hover:bg-primary-dark transition-colors z-50"
          aria-label="Open chat"
        >
          <svg
            className="w-6 h-6"
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

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          <div className="bg-primary text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-semibold">
              {isSupport ? 'Support Chat' : 'Messages'}
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-hidden relative">
            {CometChatComponent && isInitialized ? (
              <CometChatComponent />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
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
