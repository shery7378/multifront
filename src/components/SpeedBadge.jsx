'use client';

/**
 * Speed Badge Component
 * Displays formatted speed badges like "Ready in 30 mins" or "Pickup in 1 hour"
 */
export default function SpeedBadge({ 
  deliveryTime, 
  prepTime, 
  mode = 'delivery', // 'delivery' or 'pickup'
  className = '' 
}) {
  // Parse delivery time (e.g., "30 mins", "1 hour", "45 min")
  const parseTime = (timeStr) => {
    if (!timeStr) return null;
    
    const str = String(timeStr).toLowerCase();
    const minutesMatch = str.match(/(\d+)\s*(?:min|minute|mins)/);
    const hoursMatch = str.match(/(\d+)\s*(?:hour|hours|hr|hrs)/);
    
    if (minutesMatch) {
      return parseInt(minutesMatch[1]);
    } else if (hoursMatch) {
      return parseInt(hoursMatch[1]) * 60;
    }
    
    // Try to extract number
    const numMatch = str.match(/(\d+)/);
    if (numMatch) {
      return parseInt(numMatch[1]);
    }
    
    return null;
  };

  // Get badge text based on time
  const getBadgeText = (timeMinutes, mode) => {
    if (!timeMinutes) return null;
    
    if (timeMinutes <= 30) {
      return mode === 'pickup' ? 'Ready in 30 mins' : 'Delivers in 30 mins';
    } else if (timeMinutes <= 60) {
      return mode === 'pickup' ? 'Ready in 1 hour' : 'Delivers in 1 hour';
    } else if (timeMinutes <= 90) {
      return mode === 'pickup' ? 'Ready in 1.5 hours' : 'Delivers in 1.5 hours';
    } else {
      const hours = Math.round(timeMinutes / 60);
      return mode === 'pickup' ? `Ready in ${hours} hours` : `Delivers in ${hours} hours`;
    }
  };

  // Determine which time to use
  const timeToUse = prepTime || deliveryTime;
  const timeMinutes = parseTime(timeToUse);
  const badgeText = getBadgeText(timeMinutes, mode);

  if (!badgeText) {
    return null;
  }

  // Determine badge color based on speed
  const getBadgeColor = () => {
    if (timeMinutes <= 30) {
      return 'bg-green-100 text-green-800 border-green-300';
    } else if (timeMinutes <= 60) {
      return 'bg-blue-100 text-blue-800 border-blue-300';
    } else {
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${getBadgeColor()} ${className}`}
    >
      <svg
        className="w-3 h-3 mr-1"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
      {badgeText}
    </span>
  );
}

