'use client';

import dynamic from 'next/dynamic';

const DarazChatWidget = dynamic(() => import('./DarazChatWidget'), {
  ssr: false,
});

export default function DarazChatWidgetWrapper() {
  return <DarazChatWidget />;
}

