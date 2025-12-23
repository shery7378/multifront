'use client';

import { useState, useEffect, useRef } from 'react';
import { useGetRequest } from '@/controller/getRequests';
import { usePostRequest } from '@/controller/postRequests';

const ChatPage = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);
  const [initStep, setInitStep] = useState('Starting...');
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);
  const initRef = useRef(false);
  const { data: initData, loading: initLoading, sendGetRequest: initChat } = useGetRequest();
  const { data: conversationsData, sendGetRequest: fetchConversations } = useGetRequest();
  const { data: conversationData, sendGetRequest: fetchConversation } = useGetRequest();
  const { sendPostRequest: createSupportChat } = usePostRequest();
  const { sendPostRequest: sendMessage } = usePostRequest();

  // Initialize - get credentials
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initialize = async () => {
      try {
        setInitStep('Connecting to server...');
        await initChat('/chat/initialize', true);
      } catch (error) {
        console.error('Initialization error:', error);
        setInitError(error.message || 'Failed to connect to server. Please check if the API is running.');
      }
    };

    initialize();
  }, []);

  // Handle initData when it arrives
  useEffect(() => {
    if (initData) {
      if (initData?.success && initData?.data) {
        setIsInitialized(true);
        setInitStep('Ready!');
        // Fetch conversations
        fetchConversations('/chat/conversations', true);
      } else {
        setInitError(initData?.message || 'Failed to get chat credentials');
      }
    }
  }, [initData]);

  // Update conversations when data arrives
  useEffect(() => {
    if (conversationsData?.success && conversationsData?.data) {
      setConversations(conversationsData.data);
    }
  }, [conversationsData]);

  // Fetch conversation details
  useEffect(() => {
    if (activeConversation) {
      fetchConversation(`/chat/conversations/${activeConversation.id}`, true);
    }
  }, [activeConversation]);

  // Update messages when conversation data arrives
  useEffect(() => {
    if (conversationData?.success && conversationData?.data?.messages) {
      setMessages(conversationData.data.messages);
    }
  }, [conversationData]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStartSupportChat = async () => {
    try {
      await createSupportChat('/chat/support', {}, true);
      // Refresh conversations
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
      }, true);
      setMessageText('');
      // Refresh messages
      setTimeout(() => {
        fetchConversation(`/chat/conversations/${activeConversation.id}`, true);
      }, 300);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (initError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4 text-lg font-semibold">Error: {initError}</p>
          <p className="text-gray-600 mb-4 text-sm">
            Make sure:
            <br />1. The API server is running
            <br />2. You are logged in
            <br />3. The Chat module is properly installed
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-6 py-2 rounded hover:bg-primary-dark transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (initLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">{initStep}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Messages</h1>
        <button
          onClick={handleStartSupportChat}
          className="bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition-colors"
        >
          Start Support Chat
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations Sidebar */}
        <div className="lg:col-span-1 border rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold">Conversations</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No conversations yet. Click "Start Support Chat" to begin.
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversation(conv)}
                  className={`w-full p-4 text-left border-b hover:bg-gray-50 transition-colors ${
                    activeConversation?.id === conv.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="font-semibold">{conv.title}</div>
                  <div className="text-sm text-gray-500 truncate">{conv.last_message || 'No messages'}</div>
                  {conv.last_message_at && (
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(conv.last_message_at).toLocaleDateString()}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2 border rounded-lg flex flex-col">
          {activeConversation ? (
            <>
              <div className="p-4 border-b bg-gray-50">
                <h2 className="font-semibold text-lg">
                  {activeConversation.is_support
                    ? 'Support Chat'
                    : activeConversation.other_user?.name || 'Chat'}
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">No messages yet. Start the conversation!</div>
                ) : (
                  messages.map((msg, idx) => {
                    const userId = parseInt(localStorage.getItem('user_id') || localStorage.getItem('id') || '0');
                    const isOwn = msg.sender_id === userId;
                    return (
                      <div
                        key={idx}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isOwn
                              ? 'bg-primary text-white'
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          <div className="text-sm font-medium mb-1">
                            {isOwn ? 'You' : (msg.sender_name || 'Support Bot')}
                          </div>
                          <div className="text-sm">{msg.message}</div>
                          <div
                            className={`text-xs mt-1 ${
                              isOwn ? 'text-white/70' : 'text-gray-500'
                            }`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
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
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
