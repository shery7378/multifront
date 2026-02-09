'use client';

import dynamic from 'next/dynamic';

// Disable SSR for chat page to avoid React 19 compatibility issues
const ChatPage = dynamic(() => import('@/components/chat/ChatPage'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center ">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading chat...</p>
      </div>
    </div>
  ),
});

export default function Chat() {
  return <ChatPage />;
}

