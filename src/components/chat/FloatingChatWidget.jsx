'use client';

import { useState, useEffect, useRef } from 'react';
import { useGetRequest } from '@/controller/getRequests';
import { usePostRequest } from '@/controller/postRequests';

const FloatingChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);
  const initRef = useRef(false);
  
  const { data: initData, sendGetRequest: initChat } = useGetRequest();
  const { data: conversationsData, sendGetRequest: fetchConversations } = useGetRequest();
  const { data: conversationData, sendGetRequest: fetchConversation } = useGetRequest();
  const { sendPostRequest: createSupportChat } = usePostRequest();
  const { sendPostRequest: sendMessage } = usePostRequest();

  // Initialize when widget opens
  useEffect(() => {
    if (!isOpen || initRef.current) return;
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
  }, [isOpen]);

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

  // Update conversations
  useEffect(() => {
    if (conversationsData?.success && conversationsData?.data) {
      setConversations(conversationsData.data);
      // Auto-select first conversation if none selected
      if (!activeConversation && conversationsData.data.length > 0) {
        setActiveConversation(conversationsData.data[0]);
      }
    }
  }, [conversationsData]);

  // Fetch conversation details
  useEffect(() => {
    if (activeConversation) {
      fetchConversation(`/chat/conversations/${activeConversation.id}`, true);
    }
  }, [activeConversation]);

  // Update messages
  useEffect(() => {
    if (conversationData?.success && conversationData?.data?.messages) {
      setMessages(conversationData.data.messages);
    }
  }, [conversationData]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      // Refresh messages
      setTimeout(() => {
        fetchConversation(`/chat/conversations/${activeConversation.id}`, true);
        fetchConversations('/chat/conversations', true);
      }, 300);
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
          className="fixed bottom-6 right-6 w-16 h-16 bg-primary hover:bg-primary-dark text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-50"
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

