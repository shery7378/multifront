'use client';

import { useState, useEffect, useRef } from 'react';
import { useGetRequest } from '@/controller/getRequests';
import { usePostRequest } from '@/controller/postRequests';
import getEcho from '@/config/echo';

const FloatingChatWidget = () => {
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
  const backgroundPollIntervalRef = useRef(null);
  const lastMessageIdsRef = useRef({}); // Track last message ID per conversation
  const notificationPermissionRef = useRef(null);
  
  const { data: initData, sendGetRequest: initChat } = useGetRequest();
  const { data: conversationsData, sendGetRequest: fetchConversations } = useGetRequest();
  const { data: conversationData, sendGetRequest: fetchConversation } = useGetRequest();
  const { sendPostRequest: createSupportChat } = usePostRequest();
  const { sendPostRequest: sendMessage } = usePostRequest();

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        console.log('[Chat] Requesting notification permission');
        Notification.requestPermission().then(permission => {
          notificationPermissionRef.current = permission;
          console.log('[Chat] Notification permission result:', permission);
        });
      } else {
        notificationPermissionRef.current = Notification.permission;
        console.log('[Chat] Notification permission:', Notification.permission);
      }
    } else {
      console.log('[Chat] Browser does not support notifications');
    }
  }, []);

  // Function to show browser notification
  const showMessageNotification = (conversation) => {
    if (!('Notification' in window)) {
      console.log('[Chat] Notifications not supported in this browser');
      return; // Browser doesn't support notifications
    }

    // Get sender name from various possible sources
    const senderName = conversation.sender_name 
      || (conversation.is_support ? 'Support' : (conversation.other_user?.name || 'Someone'));
    const message = conversation.last_message || 'New message';
    const conversationId = conversation.id || conversation.conversation_id;

    console.log('[Chat] Attempting to show notification:', { senderName, message, conversationId, permission: Notification.permission });

    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification(`${senderName} sent you a message`, {
          body: message.length > 100 ? message.substring(0, 100) + '...' : message,
          icon: '/images/profile/profile.png',
          badge: '/images/profile/profile.png',
          tag: `chat-${conversationId}`, // Prevent duplicate notifications
          requireInteraction: false,
        });

        console.log('[Chat] Notification shown successfully');

        // Open chat when notification is clicked
        notification.onclick = () => {
          window.focus();
          setIsOpen(true);
          if (conversationId) {
            // Find the conversation in the list
            const conv = conversations.find(c => c.id === conversationId);
            if (conv) {
              setActiveConversation(conv);
            }
          }
          notification.close();
        };

        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);
      } catch (error) {
        console.error('[Chat] Error showing notification:', error);
      }
    } else if (Notification.permission === 'default') {
      // Request permission
      console.log('[Chat] Requesting notification permission');
      Notification.requestPermission().then(permission => {
        notificationPermissionRef.current = permission;
        console.log('[Chat] Notification permission:', permission);
        if (permission === 'granted') {
          showMessageNotification(conversation);
        }
      });
    } else {
      console.log('[Chat] Notification permission denied');
    }
  };

  // Initialize on mount (not just when widget opens) to enable background polling
  useEffect(() => {
    if (initRef.current) return;
    
    // Check if user is authenticated before initializing
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!authToken) {
      return; // Don't initialize if not authenticated
    }
    
    initRef.current = true;

    const initialize = async () => {
      try {
        await initChat('/chat/initialize', true);
      } catch (error) {
        console.error('Initialization error:', error);
        setInitError(error.message || 'Failed to connect to server.');
      }
    };

    initialize();
  }, [initChat]);

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
  }, [initData]);

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
    }
  }, [conversationsData, isOpen, activeConversation]);

  // Fetch conversation details
  useEffect(() => {
    if (activeConversation) {
      fetchConversation(`/chat/conversations/${activeConversation.id}`, true);
      // Refresh conversations list immediately to update unread count
      // The backend marks messages as read when conversation is viewed
      setTimeout(() => {
        fetchConversations('/chat/conversations', true);
      }, 300);
    }
  }, [activeConversation, fetchConversation, fetchConversations]);

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

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set up Pusher real-time listeners instead of polling
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') {
      console.log('[Chat] Pusher setup skipped:', { isInitialized, isWindow: typeof window !== 'undefined' });
      return;
    }

    const echo = getEcho();
    if (!echo) {
      console.error('[Chat] Echo instance not available');
      return;
    }

    console.log('[Chat] Setting up Pusher listeners');

    const getUserId = () => {
      if (typeof window !== 'undefined') {
        return parseInt(localStorage.getItem('user_id') || localStorage.getItem('id') || '0');
      }
      return 0;
    };

    const userId = getUserId();
    if (!userId) {
      console.error('[Chat] User ID not found');
      return;
    }

    console.log('[Chat] User ID:', userId);

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
      console.log('[Chat] Message received via Pusher on user channel:', data);
      
      // Check if message is from current user (don't notify for own messages)
      const currentUserId = getUserId();
      if (data.sender_id === currentUserId) {
        console.log('[Chat] Message from self, skipping notification');
        return;
      }

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
      const shouldNotify = activeConversation?.id !== data.conversation_id || !isOpen;
      console.log('[Chat] Should show notification?', { shouldNotify, activeConversationId: activeConversation?.id, conversationId: data.conversation_id, isOpen });
      
      if (shouldNotify) {
        showMessageNotification({
          id: data.conversation_id,
          conversation_id: data.conversation_id,
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

    // Debug: Log when channel is subscribed
    userChannel.subscribed(() => {
      console.log('[Chat] User channel subscribed successfully:', `user.${userId}`);
    });

    userChannel.error((error) => {
      console.error('[Chat] User channel error:', error);
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
    backgroundPollIntervalRef.current = setInterval(() => {
      fetchConversations('/chat/conversations', true);
    }, 30000); // 30 seconds as backup

    return () => {
      // Clean up Pusher listeners
      if (userChannel) {
        userChannel.stopListening('.conversation.updated');
        userChannel.stopListening('.message.sent');
      }
      conversationChannels.forEach((channel) => {
        channel.stopListening('.message.sent');
      });
      
      // Clean up polling
      if (backgroundPollIntervalRef.current) {
        clearInterval(backgroundPollIntervalRef.current);
      }
    };
  }, [isInitialized, conversations, activeConversation, isOpen, fetchConversations]);

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
      // Refresh messages immediately (no delay) - Pusher will handle real-time updates
      fetchConversation(`/chat/conversations/${activeConversation.id}`, true);
      fetchConversations('/chat/conversations', true);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <>
      {/* Floating Chat Button - Rounded Circle */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-primary hover:bg-primary-dark text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-50 relative"
          aria-label="Open chat"
        >
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
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
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200 animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-primary text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-semibold text-lg">Chat Support</h3>
            <button
              onClick={() => {
                setIsOpen(false);
                setActiveConversation(null);
                setMessages([]);
              }}
              className="text-white hover:text-gray-200 transition-colors"
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
                  <p className="text-red-600 mb-4">{initError}</p>
                  <button
                    onClick={() => {
                      setInitError(null);
                      initRef.current = false;
                      initChat('/chat/initialize', true);
                    }}
                    className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : !isInitialized ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
                  <p className="text-sm text-gray-500">Connecting...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Conversations Sidebar */}
                <div className="flex-1 flex overflow-hidden">
                  <div className="w-1/3 border-r border-gray-200 flex flex-col">
                    <div className="p-3 border-b border-gray-200">
                      <button
                        onClick={handleStartSupportChat}
                        className="w-full bg-primary text-white py-2 px-3 rounded text-sm font-medium hover:bg-primary-dark transition-colors"
                      >
                        + New Support Chat
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {conversations.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No conversations yet
                        </div>
                      ) : (
                        conversations.map((conv) => (
                          <button
                            key={conv.id}
                            onClick={() => setActiveConversation(conv)}
                            className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                              activeConversation?.id === conv.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                            }`}
                          >
                            <div className="font-medium text-sm text-gray-900 truncate">
                              {conv.title || (conv.is_support ? 'Support' : 'Chat')}
                            </div>
                            {conv.last_message && (
                              <div className="text-xs text-gray-500 truncate mt-1">
                                {conv.last_message}
                              </div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 flex flex-col">
                    {activeConversation ? (
                      <>
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                          {messages.length === 0 ? (
                            <div className="text-center text-gray-500 text-sm py-8">
                              No messages yet. Start the conversation!
                            </div>
                          ) : (
                            messages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex ${msg.sender_id === activeConversation.other_user?.id ? 'justify-start' : 'justify-end'}`}
                              >
                                <div
                                  className={`max-w-[75%] rounded-lg px-4 py-2 ${
                                    msg.sender_id === activeConversation.other_user?.id
                                      ? 'bg-gray-100 text-gray-900'
                                      : 'bg-primary text-white'
                                  }`}
                                >
                                  <p className="text-sm">{msg.message}</p>
                                  <p className={`text-xs mt-1 ${
                                    msg.sender_id === activeConversation.other_user?.id
                                      ? 'text-gray-500'
                                      : 'text-primary-100'
                                  }`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-3">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={messageText}
                              onChange={(e) => setMessageText(e.target.value)}
                              placeholder="Type a message..."
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                            <button
                              type="submit"
                              disabled={!messageText.trim()}
                              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Send
                            </button>
                          </div>
                        </form>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <p className="mb-2">Select a conversation to start chatting</p>
                          <button
                            onClick={handleStartSupportChat}
                            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors"
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

export default FloatingChatWidget;

