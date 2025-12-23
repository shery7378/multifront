'use client';

import DarkModeToggle from './DarkModeToggle';

/**
 * A simple button wrapper for the dark mode toggle
 * Can be placed anywhere in the app (header, footer, settings, etc.)
 */
export default function ThemeToggleButton({ className = '' }) {
  return (
    <div className={`flex items-center ${className}`}>
      <DarkModeToggle />
    </div>
  );
}

