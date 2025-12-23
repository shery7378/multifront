/**
 * Offline sync utility
 * Handles syncing of offline actions when connection is restored
 */

import { offlineQueue } from './offlineStorage';

/**
 * Sync pending offline actions
 */
export async function syncOfflineActions() {
  try {
    const pendingActions = await offlineQueue.getPending();
    
    if (pendingActions.length === 0) {
      return { success: true, synced: 0 };
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    let synced = 0;
    let failed = 0;

    for (const action of pendingActions) {
      try {
        // Process different action types
        switch (action.type) {
          case 'add_to_cart':
            // Sync cart item
            await syncCartItem(action.data);
            await offlineQueue.markComplete(action.id);
            synced++;
            break;

          case 'add_to_favorites':
            // Sync favorite
            await syncFavorite(action.data);
            await offlineQueue.markComplete(action.id);
            synced++;
            break;

          case 'update_profile':
            // Sync profile update
            await syncProfileUpdate(action.data);
            await offlineQueue.markComplete(action.id);
            synced++;
            break;

          default:
            console.warn('[Offline Sync] Unknown action type:', action.type);
            await offlineQueue.markComplete(action.id);
            synced++;
        }
      } catch (error) {
        console.error(`[Offline Sync] Failed to sync action ${action.id}:`, error);
        failed++;
        // Keep failed actions in queue for retry
      }
    }

    return { success: true, synced, failed, total: pendingActions.length };
  } catch (error) {
    console.error('[Offline Sync] Error syncing offline actions:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync cart item to server
 */
async function syncCartItem(cartItem) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const response = await fetch(`${apiUrl}/api/cart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(cartItem),
  });

  if (!response.ok) {
    throw new Error(`Failed to sync cart item: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Sync favorite to server
 */
async function syncFavorite(favoriteData) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const response = await fetch(`${apiUrl}/api/favorites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(favoriteData),
  });

  if (!response.ok) {
    throw new Error(`Failed to sync favorite: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Sync profile update to server
 */
async function syncProfileUpdate(profileData) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const response = await fetch(`${apiUrl}/api/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    throw new Error(`Failed to sync profile: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Queue an action for offline sync
 */
export async function queueOfflineAction(type, data) {
  try {
    await offlineQueue.add({
      type,
      data,
    });
    return { success: true };
  } catch (error) {
    console.error('[Offline Sync] Failed to queue action:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Auto-sync when online (call this when connection is restored)
 */
export function setupAutoSync() {
  if (typeof window === 'undefined') return;

  const handleOnline = async () => {
    console.log('[Offline Sync] Connection restored, syncing offline actions...');
    const result = await syncOfflineActions();
    
    if (result.success && result.synced > 0) {
      // Show notification to user
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('MultiKonnect', {
          body: `Synced ${result.synced} offline action${result.synced > 1 ? 's' : ''}`,
          icon: '/icons/icon-192x192.png',
          tag: 'offline-sync',
        });
      }
    }
  };

  window.addEventListener('online', handleOnline);

  // Also trigger sync if already online
  if (navigator.onLine) {
    handleOnline();
  }

  return () => {
    window.removeEventListener('online', handleOnline);
  };
}

