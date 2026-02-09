'use client';

import { useState, useEffect, useRef } from 'react';
import { useGetRequest } from '@/controller/getRequests';
import { usePostRequest } from '@/controller/postRequests';
import getEcho from '@/config/echo';

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
  const backgroundPollIntervalRef = useRef(null);
  const lastMessageIdsRef = useRef({}); // Track last message ID per conversation
  const notificationPermissionRef = useRef(null);
  
  const { data: initData, sendGetRequest: initChat } = useGetRequest();
  const { data: conversationsData, sendGetRequest: fetchConversations } = useGetRequest();
  const { data: conversationData, sendGetRequest: fetchConversation } = useGetRequest();
  const { sendPostRequest: createConversation } = usePostRequest();
  const { sendPostRequest: createSupportChat } = usePostRequest();
  const { sendPostRequest: sendMessage } = usePostRequest();

  // Initialize on mount (not just when widget opens) to enable background polling
  useEffect(() => {
    if (initRef.current) return;
    
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
  }, [initChat]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        notificationPermissionRef.current = permission;
      });
    } else if ('Notification' in window) {
      notificationPermissionRef.current = Notification.permission;
    }
  }, []);

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

  // Function to show browser notification
  const showMessageNotification = (conversation) => {
    if (!('Notification' in window)) {
      return; // Browser doesn't support notifications
    }

    if (Notification.permission === 'granted') {
      const senderName = conversation.is_support 
        ? 'Support' 
        : (conversation.other_user?.name || 'Someone');
      const message = conversation.last_message || 'New message';
      
      const notification = new Notification(`${senderName} sent you a message`, {
        body: message.length > 100 ? message.substring(0, 100) + '...' : message,
        icon: '/images/profile/profile.png',
        badge: '/images/profile/profile.png',
        tag: `chat-${conversation.id}`, // Prevent duplicate notifications
        requireInteraction: false,
      });

      // Open chat when notification is clicked
      notification.onclick = () => {
        window.focus();
        setIsOpen(true);
        if (conversation.id) {
          setActiveConversation(conversation);
        }
        notification.close();
      };

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
    } else if (Notification.permission === 'default') {
      // Request permission
      Notification.requestPermission().then(permission => {
        notificationPermissionRef.current = permission;
        if (permission === 'granted') {
          showMessageNotification(conversation);
        }
      });
    }
  };

  // Update conversations and calculate unread count
  useEffect(() => {
    if (conversationsData?.success && conversationsData?.data) {
      setConversations(prevConversations => {
        const previousConversations = prevConversations;
        
        // Check for new messages and show notifications
        conversationsData.data.forEach(conv => {
          // If conversation has unread messages and chat is closed or this is not the active conversation
          if (conv.unread_count > 0 && (!isOpen || activeConversation?.id !== conv.id)) {
            // Check if this is a new unread message (conversation didn't exist before or unread count increased)
            const prevConv = previousConversations.find(p => p.id === conv.id);
            if (!prevConv || (prevConv.unread_count || 0) < conv.unread_count) {
              showMessageNotification(conv);
            }
          }
        });
        
        return conversationsData.data;
      });
      
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
              fetchConversations('/chat/conversations', true);
            })
            .catch(console.error);
        }
      }
    }
  }, [conversationsData, initialVendorId, activeConversation, createConversation, fetchConversations, isOpen]);

  // Fetch conversation details when active conversation changes
  useEffect(() => {
    if (activeConversation && isInitialized) {
      fetchConversation(`/chat/conversations/${activeConversation.id}`, true);
      // Refresh conversations list after a short delay to update unread count
      // The backend marks messages as read when conversation is viewed
      setTimeout(() => {
        fetchConversations('/chat/conversations', true);
      }, 500);
    }
  }, [activeConversation, isInitialized, fetchConversation, fetchConversations]);

  // Update messages and detect new ones
  useEffect(() => {
    if (conversationData?.success && conversationData?.data?.messages) {
      const newMessages = conversationData.data.messages;
      const conversationId = activeConversation?.id;
      
      if (conversationId && newMessages.length > 0) {
        // Get the last message ID we've seen for this conversation
        const lastSeenId = lastMessageIdsRef.current[conversationId];
        const latestMessage = newMessages[newMessages.length - 1];
        
        // If we have a new message and chat is closed or this conversation is not active
        if (lastSeenId && latestMessage.id !== lastSeenId && (!isOpen || activeConversation?.id !== conversationId)) {
          const getUserId = () => {
            if (typeof window !== 'undefined') {
              return parseInt(localStorage.getItem('user_id') || localStorage.getItem('id') || '0');
            }
            return 0;
          };
          
          const userId = getUserId();
          // Only notify if the message is not from the current user
          if (latestMessage.sender_id !== userId) {
            showMessageNotification({
              id: conversationId,
              last_message: latestMessage.message,
              is_support: activeConversation?.is_support,
              other_user: activeConversation?.other_user
            });
          }
        }
        
        // Update last seen message ID
        lastMessageIdsRef.current[conversationId] = latestMessage.id;
      }
      
      setMessages(newMessages);
      
      // When messages are loaded, refresh conversations to update unread count
      // Backend marks messages as read when conversation is viewed
      if (isOpen && activeConversation) {
        // Small delay to ensure backend has processed the read status
        setTimeout(() => {
          fetchConversations('/chat/conversations', true);
        }, 500);
      }
    }
  }, [conversationData, activeConversation, isOpen, fetchConversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set up Pusher real-time listeners instead of polling
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;

    const echo = getEcho();
    if (!echo) return;

    const getUserId = () => {
      if (typeof window !== 'undefined') {
        return parseInt(localStorage.getItem('user_id') || localStorage.getItem('id') || '0');
      }
      return 0;
    };

    const userId = getUserId();
    if (!userId) return;

    let userChannel = null;
    let conversationChannels = [];

    // Listen to user channel for conversation updates
    userChannel = echo.private(`user.${userId}`);
    
    userChannel.listen('.conversation.updated', (data) => {
      console.log('[Chat] Conversation updated via Pusher:', data);
      
      // Update conversation in list and unread count immediately
      setConversations((prev) => {
        const updated = prev.map((conv) => 
          conv.id === data.conversation_id 
            ? { ...conv, last_message: data.last_message, last_message_at: data.last_message_at, unread_count: data.unread_count || 0 }
            : conv
        );
        
        // Calculate and update unread count immediately
        const totalUnread = updated.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
        setUnreadCount(totalUnread);
        
        console.log('[Chat] Updated unread count:', totalUnread, 'for conversation:', data.conversation_id);
        
        return updated;
      });
    });

    // Also listen to user channel for new messages (catches all messages, even if conversation not in list)
    userChannel.listen('.message.sent', (data) => {
      // Immediately update unread count
      setUnreadCount((prev) => prev + 1);
      
      // Update or add conversation to list
      setConversations((prev) => {
        const existingIndex = prev.findIndex((c) => c.id === data.conversation_id);
        
        if (existingIndex >= 0) {
          // Update existing conversation
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            last_message: data.message,
            last_message_at: data.created_at,
            unread_count: (updated[existingIndex].unread_count || 0) + 1,
          };
          return updated;
        } else {
          // New conversation - add it (will be fully loaded on next fetch)
          return [...prev, {
            id: data.conversation_id,
            last_message: data.message,
            last_message_at: data.created_at,
            unread_count: 1,
          }];
        }
      });

      // Show notification immediately if chat is closed or this is not the active conversation
      if (activeConversation?.id !== data.conversation_id || !isOpen) {
        showMessageNotification({
          id: data.conversation_id,
          last_message: data.message,
          sender_name: data.sender_name,
        });
      }

      // If this is the active conversation, add message to list
      if (activeConversation?.id === data.conversation_id && isOpen) {
        setMessages((prev) => {
          if (prev.some((msg) => msg.id === data.id)) {
            return prev;
          }
          return [...prev, data];
        });
      }
    });

    // Listen to conversation channels for new messages
    conversations.forEach((conv) => {
      const channel = echo.private(`conversation.${conv.id}`);
      
      channel.listen('.message.sent', (data) => {
        // If this is the active conversation, add message to list
        if (activeConversation?.id === data.conversation_id) {
          setMessages((prev) => {
            // Check if message already exists
            if (prev.some((msg) => msg.id === data.id)) {
              return prev;
            }
            return [...prev, data];
          });
        } else {
          // Update conversation list
          setConversations((prev) => {
            return prev.map((c) => 
              c.id === data.conversation_id 
                ? { ...c, last_message: data.message, last_message_at: data.created_at }
                : c
            );
          });
        }

        // Show notification if not viewing this conversation
        if (activeConversation?.id !== data.conversation_id || !isOpen) {
          const conversation = conversations.find((c) => c.id === data.conversation_id);
          if (conversation) {
            showMessageNotification({
              ...conversation,
              last_message: data.message,
            });
          }
        }
      });

      conversationChannels.push(channel);
    });

    // Fallback: Still poll every 30 seconds as backup (much less frequent)
    pollIntervalRef.current = setInterval(() => {
      fetchConversations('/chat/conversations', true);
      if (activeConversation) {
        fetchConversation(`/chat/conversations/${activeConversation.id}`, true);
      }
    }, 30000); // 30 seconds as backup

    return () => {
      // Clean up Pusher listeners
      if (userChannel) {
        userChannel.stopListening('.conversation.updated');
      }
      conversationChannels.forEach((channel) => {
        channel.stopListening('.message.sent');
      });
      
      // Clean up polling
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (backgroundPollIntervalRef.current) {
        clearInterval(backgroundPollIntervalRef.current);
      }
    };
  }, [isInitialized, conversations, activeConversation, isOpen, fetchConversations, fetchConversation]);

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
              fetchConversations('/chat/conversations', true);
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
      // Refresh messages immediately (no delay) - Pusher will handle real-time updates including bot responses
      fetchConversation(`/chat/conversations/${activeConversation.id}`, true);
      fetchConversations('/chat/conversations', true);
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
      {/* Floating Chat Button - Daraz Style - Responsive */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{ position: 'fixed !important' }}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-[#F85606] hover:bg-[#E04A05] text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-[9999] group active:scale-95 border-2 border-red-500"
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
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window - Daraz Style - Fully Responsive */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-4 sm:right-4 sm:w-[380px] sm:h-[580px] md:w-[420px] md:h-[600px] lg:w-[450px] lg:h-[650px] sm:rounded-lg sm:max-w-[calc(100vw-1rem)] sm:max-h-[calc(100vh-2rem)] bg-white shadow-2xl flex flex-col z-[9999] border border-gray-200 animate-in slide-in-from-bottom-5">
          {/* Header - Fully Responsive */}
          <div className="bg-[#F85606] text-white p-3 sm:p-4 md:p-4 sm:rounded-t-lg flex justify-between items-center flex-shrink-0 min-h-[60px] sm:min-h-[64px]">
            <div className="flex items-center gap-2 sm:gap-3">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="font-semibold text-base sm:text-lg md:text-lg">Chat</h3>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                setActiveConversation(null);
                setMessages([]);
              }}
              className="text-white hover:text-gray-200 active:text-gray-300 transition-colors p-2 sm:p-2 md:p-2 touch-manipulation"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {initError ? (
              <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <div className="text-center">
                  <p className="text-red-600 mb-3 sm:mb-4 text-xs sm:text-sm px-4">{initError}</p>
                  <button
                    onClick={() => {
                      setInitError(null);
                      initRef.current = false;
                      initChat('/chat/initialize', true);
                    }}
                    className="bg-[#F85606] text-white px-4 py-2 rounded hover:bg-[#E04A05] active:bg-[#D04404] transition-colors text-xs sm:text-sm"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : !isInitialized ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-[#F85606] mx-auto mb-2 sm:mb-3"></div>
                  <p className="text-xs sm:text-sm text-gray-500">Connecting...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Conversations Sidebar - Fully Responsive */}
                <div className="flex-1 flex overflow-hidden">
                  <div className="hidden md:flex lg:flex w-[140px] xl:w-[160px] border-r border-gray-200 flex flex-col bg-gray-50 flex-shrink-0">
                    <div className="p-2 sm:p-2.5 border-b border-gray-200">
                      <button
                        onClick={handleStartSupportChat}
                        className="w-full bg-[#F85606] text-white py-2 px-2 rounded text-xs font-medium hover:bg-[#E04A05] active:bg-[#D04404] transition-colors touch-manipulation"
                      >
                        + Support
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {conversations.length === 0 ? (
                        <div className="p-2 sm:p-3 text-center text-[10px] sm:text-xs text-gray-500">
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
                              className={`w-full text-left p-1.5 sm:p-2 border-b border-gray-100 hover:bg-gray-100 active:bg-gray-200 transition-colors ${
                                isActive ? 'bg-white border-l-4 border-l-[#F85606]' : ''
                              }`}
                            >
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#F85606] flex items-center justify-center text-white text-[10px] sm:text-xs font-bold flex-shrink-0">
                                  {conv.is_support ? 'S' : (conv.other_user?.name?.[0] || 'V')}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-[10px] sm:text-xs text-gray-900 truncate">
                                    {conv.is_support ? 'Support' : (conv.other_user?.name || conv.title || 'Vendor')}
                                  </div>
                                  {conv.last_message && (
                                    <div className="text-[9px] sm:text-[10px] text-gray-500 truncate mt-0.5">
                                      {conv.last_message.length > 20 
                                        ? conv.last_message.substring(0, 20) + '...' 
                                        : conv.last_message}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {hasUnread && (
                                <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold rounded-full w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center">
                                  {conv.unread_count > 9 ? '9+' : conv.unread_count}
                                </span>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Messages Area - Responsive */}
                  <div className="flex-1 flex flex-col min-w-0">
                    {activeConversation ? (
                      <>
                        {/* Chat Header - Fully Responsive */}
                        <div className="p-2.5 sm:p-3 md:p-3 border-b border-gray-200 bg-white flex-shrink-0 min-h-[56px] sm:min-h-[60px]">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#F85606] flex items-center justify-center text-white text-[10px] sm:text-xs font-bold flex-shrink-0">
                              {activeConversation.is_support ? 'S' : (activeConversation.other_user?.name?.[0] || 'V')}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm sm:text-base text-gray-900 truncate">
                                {activeConversation.is_support ? 'Support' : (activeConversation.other_user?.name || 'Vendor')}
                              </div>
                              <div className="text-[10px] sm:text-xs text-gray-500">Online</div>
                            </div>
                            {/* Mobile: Show support button if sidebar is hidden */}
                            <button
                              onClick={handleStartSupportChat}
                              className="md:hidden lg:hidden bg-[#F85606] text-white py-1.5 px-3 rounded text-xs font-medium hover:bg-[#E04A05] active:bg-[#D04404] transition-colors flex-shrink-0 touch-manipulation"
                            >
                              + Support
                            </button>
                          </div>
                        </div>

                        {/* Messages - Fully Responsive */}
                        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-4 space-y-2 sm:space-y-3 bg-gray-50">
                          {messages.length === 0 ? (
                            <div className="text-center text-gray-500 text-xs sm:text-sm py-6 sm:py-8">
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
                                    className={`max-w-[85%] sm:max-w-[75%] rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 ${
                                      isOwn
                                        ? 'bg-[#F85606] text-white rounded-tr-none'
                                        : 'bg-white text-gray-900 rounded-tl-none border border-gray-200'
                                    }`}
                                  >
                                    <p className="text-xs sm:text-sm leading-relaxed break-words">{msg.message}</p>
                                    <p className={`text-[10px] sm:text-xs mt-0.5 sm:mt-1 ${
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

                        {/* Message Input - Fully Responsive */}
                        <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-3 sm:p-3 md:p-3 bg-white flex-shrink-0">
                          <div className="flex gap-2 sm:gap-2 md:gap-2">
                            <input
                              type="text"
                              value={messageText}
                              onChange={(e) => setMessageText(e.target.value)}
                              placeholder="Type a message..."
                              className="flex-1 px-3.5 sm:px-4 md:px-4 py-2.5 sm:py-2.5 md:py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#F85606] focus:border-transparent text-sm sm:text-sm md:text-sm touch-manipulation"
                            />
                            <button
                              type="submit"
                              disabled={!messageText.trim()}
                              className="bg-[#F85606] text-white px-4.5 sm:px-5 md:px-5 py-2.5 sm:py-2.5 md:py-2.5 rounded-full hover:bg-[#E04A05] active:bg-[#D04404] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-[48px] sm:min-h-[48px]"
                            >
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                            </button>
                          </div>
                        </form>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center bg-gray-50">
                        <div className="text-center text-gray-500 p-4 sm:p-6">
                          <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <p className="mb-2 text-xs sm:text-sm px-4">Select a conversation to start chatting</p>
                          <button
                            onClick={handleStartSupportChat}
                            className="bg-[#F85606] text-white px-4 py-2 rounded-full hover:bg-[#E04A05] active:bg-[#D04404] transition-colors text-xs sm:text-sm"
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
