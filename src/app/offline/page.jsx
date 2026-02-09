'use client';

import { useEffect, useState } from 'react';
import { useOffline } from '@/hooks/useOffline';
import Link from 'next/link';

export default function OfflinePage() {
  const { isOnline } = useOffline();
  const [cachedPages, setCachedPages] = useState([]);

  useEffect(() => {
    // Check if we're back online
    if (isOnline) {
      // Redirect to home after a brief delay
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }

    // Get list of cached pages
    if ('caches' in window) {
      caches.open('multikonnect-runtime-v2').then((cache) => {
        cache.keys().then((keys) => {
          const pages = keys
            .map((request) => {
              const url = new URL(request.url);
              return url.pathname;
            })
            .filter((path) => path !== '/' && !path.startsWith('/_next/') && !path.startsWith('/api/'))
            .slice(0, 5);
          setCachedPages(pages);
        });
      });
    }
  }, [isOnline]);

  if (isOnline) {
    return (
      <div className=" flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <svg
              className="mx-auto h-24 w-24 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">You're Back Online!</h1>
          <p className="text-gray-600 mb-8">Redirecting you to the homepage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className=" flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <svg
            className="mx-auto h-24 w-24 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">You're Offline</h1>
        <p className="text-gray-600 mb-8">
          It looks like you've lost your internet connection. Don't worry - you can still browse cached pages and view your saved items.
        </p>

        {cachedPages.length > 0 && (
          <div className="mb-8 text-left">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Offline Pages:</h2>
            <ul className="space-y-2">
              {cachedPages.map((page) => (
                <li key={page}>
                  <Link
                    href={page}
                    className="text-[#F44422] hover:underline block"
                  >
                    {page === '/home' ? 'Home' : page.replace('/', '').replace(/-/g, ' ')}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="bg-[#F44422] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#d6391a] transition-colors w-full"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="block text-gray-600 hover:text-gray-900 underline"
          >
            Go to Homepage
          </Link>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg text-left">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Your cart, favorites, and recently viewed items are saved locally and will sync when you're back online.
          </p>
        </div>
      </div>
    </div>
  );
}

