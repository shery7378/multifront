'use client';

import { useState, useEffect, useRef } from 'react';
import { useGetRequest } from '@/controller/getRequests';
import { usePostRequest } from '@/controller/postRequests';

const DarazChatWidget = ({ initialVendorId = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const initRef = useRef(false);
  const pollIntervalRef = useRef(null);
  
  const { data: initData, sendGetRequest: initChat } = useGetRequest();
  const { data: conversationsData, sendGetRequest: fetchConversations } = useGetRequest();
  const { data: conversationData, sendGetRequest: fetchConversation } = useGetRequest();
  const { sendPostRequest: createConversation } = usePostRequest();
  const { sendPostRequest: createSupportChat } = usePostRequest();
  const { sendPostRequest: sendMessage } = usePostRequest();

  // Initialize when widget opens
  useEffect(() => {
    if (!isOpen || initRef.current) return;
    
    // Check if user is authenticated before initializing
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!authToken) {
      setInitError('Please login to use chat');
      return;
    }
    
    initRef.current = true;

    const initialize = async () => {
      try {
        await initChat('/chat/initialize', true);
      } catch (error) {
        console.error('Initialization error:', error);
        // Handle 401 specifically
        if (error?.response?.status === 401 || error?.message?.includes('Unauthorized')) {
          setInitError('Please login to use chat');
        } else {
          setInitError(error.message || 'Failed to connect to server.');
        }
      }
    };

    initialize();
  }, [isOpen, initChat]);

  // Handle initData
  useEffect(() => {
    if (initData) {
      if (initData?.success && initData?.data) {
        setIsInitialized(true);
        fetchConversations('/chat/conversations', true);
      } else {
        setInitError(initData?.message || 'Failed to get chat credentials');
      }
    }
  }, [initData, fetchConversations]);

  // Update conversations and calculate unread count
  useEffect(() => {
    if (conversationsData?.success && conversationsData?.data) {
      setConversations(conversationsData.data);
      
      // Calculate total unread messages (if available from backend)
      const totalUnread = conversationsData.data.reduce((sum, conv) => {
        return sum + (conv.unread_count || 0);
      }, 0);
      setUnreadCount(totalUnread);
      
      // Auto-select first conversation if none selected
      if (!activeConversation && conversationsData.data.length > 0) {
        setActiveConversation(conversationsData.data[0]);
      }
      
      // If initialVendorId provided, find or create conversation
      if (initialVendorId && !activeConversation) {
        const vendorConv = conversationsData.data.find(
          conv => conv.other_user?.id === parseInt(initialVendorId) && !conv.is_support
        );
        if (vendorConv) {
          setActiveConversation(vendorConv);
        } else {
          // Create new conversation with vendor
          createConversation('/chat/conversations', { vendor_id: initialVendorId }, true)
            .then(() => {
              setTimeout(() => fetchConversations('/chat/conversations', true), 500);
            })
            .catch(console.error);
        }
      }
    }
  }, [conversationsData, initialVendorId, activeConversation, createConversation, fetchConversations]);

  // Fetch conversation details when active conversation changes
  useEffect(() => {
    if (activeConversation && isInitialized) {
      fetchConversation(`/chat/conversations/${activeConversation.id}`, true);
    }
  }, [activeConversation, isInitialized, fetchConversation]);

  // Update messages
  useEffect(() => {
    if (conversationData?.success && conversationData?.data?.messages) {
      setMessages(conversationData.data.messages);
    }
  }, [conversationData]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for new messages when chat is open
  useEffect(() => {
    if (isOpen && isInitialized) {
      pollIntervalRef.current = setInterval(() => {
        fetchConversations('/chat/conversations', true);
        if (activeConversation) {
          fetchConversation(`/chat/conversations/${activeConversation.id}`, true);
        }
      }, 2000); // Poll every 2 seconds for faster bot response
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isOpen, isInitialized, activeConversation, fetchConversations, fetchConversation]);

  // Handle opening chat with vendor from external trigger
  useEffect(() => {
    const handleOpenVendorChat = (event) => {
      const vendorId = event.detail?.vendorId;
      if (vendorId) {
        setIsOpen(true);
        // Create conversation if it doesn't exist
        const existingConv = conversations.find(
          conv => conv.other_user?.id === parseInt(vendorId) && !conv.is_support
        );
        if (existingConv) {
          setActiveConversation(existingConv);
        } else {
          // Create new conversation
          createConversation('/chat/conversations', { vendor_id: vendorId }, true)
            .then(() => {
              setTimeout(() => fetchConversations('/chat/conversations', true), 500);
            })
            .catch(console.error);
        }
      }
    };

    window.addEventListener('openVendorChat', handleOpenVendorChat);
    return () => window.removeEventListener('openVendorChat', handleOpenVendorChat);
  }, [conversations, createConversation, fetchConversations]);

  const handleStartSupportChat = async () => {
    try {
      await createSupportChat('/chat/support', {}, true);
      setTimeout(() => {
        fetchConversations('/chat/conversations', true);
      }, 500);
    } catch (error) {
      console.error('Error starting support chat:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConversation) return;

    try {
      await sendMessage('/chat/messages', {
        conversation_id: activeConversation.id,
        message: messageText,
        type: 'text',
      }, true);
      
      setMessageText('');
      // Refresh messages immediately and then again after a short delay for bot response
      fetchConversation(`/chat/conversations/${activeConversation.id}`, true);
      fetchConversations('/chat/conversations', true);
      
      // Refresh again after 1.5 seconds to catch bot response
      setTimeout(() => {
        fetchConversation(`/chat/conversations/${activeConversation.id}`, true);
        fetchConversations('/chat/conversations', true);
      }, 1500);
      
      // And again after 3 seconds to be sure
      setTimeout(() => {
        fetchConversation(`/chat/conversations/${activeConversation.id}`, true);
        fetchConversations('/chat/conversations', true);
      }, 3000);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getUserId = () => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('user_id') || localStorage.getItem('id') || '0');
    }
    return 0;
  };

  return (
    <>
      {/* Floating Chat Button - Daraz Style */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-[#F85606] hover:bg-[#E04A05] text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-[9999] group"
          aria-label="Open chat"
        >
          <svg
            className="w-7 h-7"
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
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window - Daraz Style */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[420px] h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-[9999] border border-gray-200 animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-[#F85606] text-white p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="font-semibold text-lg">Chat</h3>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                setActiveConversation(null);
                setMessages([]);
              }}
              className="text-white hover:text-gray-200 transition-colors p-1"
              aria-label="Close chat"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {initError ? (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <p className="text-red-600 mb-4 text-sm">{initError}</p>
                  <button
                    onClick={() => {
                      setInitError(null);
                      initRef.current = false;
                      initChat('/chat/initialize', true);
                    }}
                    className="bg-[#F85606] text-white px-4 py-2 rounded hover:bg-[#E04A05] transition-colors text-sm"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : !isInitialized ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F85606] mx-auto mb-3"></div>
                  <p className="text-sm text-gray-500">Connecting...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Conversations Sidebar */}
                <div className="flex-1 flex overflow-hidden">
                  <div className="w-[140px] border-r border-gray-200 flex flex-col bg-gray-50">
                    <div className="p-2 border-b border-gray-200">
                      <button
                        onClick={handleStartSupportChat}
                        className="w-full bg-[#F85606] text-white py-2 px-2 rounded text-xs font-medium hover:bg-[#E04A05] transition-colors"
                      >
                        + Support
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {conversations.length === 0 ? (
                        <div className="p-3 text-center text-xs text-gray-500">
                          No chats
                        </div>
                      ) : (
                        conversations.map((conv) => {
                          const isActive = activeConversation?.id === conv.id;
                          const hasUnread = (conv.unread_count || 0) > 0;
                          return (
                            <button
                              key={conv.id}
                              onClick={() => setActiveConversation(conv)}
                              className={`w-full text-left p-2 border-b border-gray-100 hover:bg-gray-100 transition-colors relative ${
                                isActive ? 'bg-white border-l-4 border-l-[#F85606]' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-[#F85606] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  {conv.is_support ? 'S' : (conv.other_user?.name?.[0] || 'V')}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-xs text-gray-900 truncate">
                                    {conv.is_support ? 'Support' : (conv.other_user?.name || conv.title || 'Vendor')}
                                  </div>
                                  {conv.last_message && (
                                    <div className="text-[10px] text-gray-500 truncate mt-0.5">
                                      {conv.last_message.length > 20 
                                        ? conv.last_message.substring(0, 20) + '...' 
                                        : conv.last_message}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {hasUnread && (
                                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                  {conv.unread_count > 9 ? '9+' : conv.unread_count}
                                </span>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 flex flex-col">
                    {activeConversation ? (
                      <>
                        {/* Chat Header */}
                        <div className="p-3 border-b border-gray-200 bg-white">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#F85606] flex items-center justify-center text-white text-xs font-bold">
                              {activeConversation.is_support ? 'S' : (activeConversation.other_user?.name?.[0] || 'V')}
                            </div>
                            <div>
                              <div className="font-medium text-sm text-gray-900">
                                {activeConversation.is_support ? 'Support' : (activeConversation.other_user?.name || 'Vendor')}
                              </div>
                              <div className="text-xs text-gray-500">Online</div>
                            </div>
                          </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                          {messages.length === 0 ? (
                            <div className="text-center text-gray-500 text-sm py-8">
                              No messages yet. Start the conversation!
                            </div>
                          ) : (
                            messages.map((msg) => {
                              const userId = getUserId();
                              const isOwn = msg.sender_id === userId;
                              return (
                                <div
                                  key={msg.id}
                                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div
                                    className={`max-w-[75%] rounded-lg px-3 py-2 ${
                                      isOwn
                                        ? 'bg-[#F85606] text-white rounded-tr-none'
                                        : 'bg-white text-gray-900 rounded-tl-none border border-gray-200'
                                    }`}
                                  >
                                    <p className="text-sm leading-relaxed">{msg.message}</p>
                                    <p className={`text-xs mt-1 ${
                                      isOwn ? 'text-white/70' : 'text-gray-500'
                                    }`}>
                                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                </div>
                              );
                            })
                          )}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-3 bg-white">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={messageText}
                              onChange={(e) => setMessageText(e.target.value)}
                              placeholder="Type a message..."
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#F85606] focus:border-transparent text-sm"
                            />
                            <button
                              type="submit"
                              disabled={!messageText.trim()}
                              className="bg-[#F85606] text-white px-5 py-2 rounded-full hover:bg-[#E04A05] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                            </button>
                          </div>
                        </form>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center bg-gray-50">
                        <div className="text-center text-gray-500 p-6">
                          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <p className="mb-2 text-sm">Select a conversation to start chatting</p>
                          <button
                            onClick={handleStartSupportChat}
                            className="bg-[#F85606] text-white px-4 py-2 rounded-full hover:bg-[#E04A05] transition-colors text-sm"
                          >
                            Start Support Chat
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DarazChatWidget;
