//src/components/UI/IconButton.jsx
'use client';
import { forwardRef } from 'react';

const baseClasses = `
  min-w-8 min-h-8 rounded-full border border-gray-200
  flex items-center justify-center
  hover:border-vivid-red hover:shadow-[0_0_10px_#ef4444]
  transition-colors cursor-pointer
  focus:outline-none focus:ring-2 focus:ring-red-500
`;

const IconButton = forwardRef(({ icon: Icon, onClick, className = '', iconClasses = '' }, ref) => {
  return (
    <div
      ref={ref}
      className={`${baseClasses} ${className}`}
      onClick={onClick}
    >
      <Icon className={`w-5 h-5 text-vivid-red ${iconClasses}`} />
    </div>
  );
});

IconButton.displayName = 'IconButton';
export default IconButton;

// Example Uses

// 1. Basic usage with FaEdit icon (default vivid-red color)
{/* <IconButton icon={FaEdit} /> */}

// 2. With click handler for editing (blue icon color)
{/* <IconButton
    icon={FaEdit}
    onClick={handleEditClick}
    iconClasses="text-blue-500"
/> */}

// 3. Conditional styling based on state (e.g., favorited, green icon with larger size)
{/* <IconButton
    icon={HeartIcon}
    onClick={handleClick}
    iconClasses={isFavorited ? 'text-green-500 w-6 h-6' : 'text-vivid-red w-5 h-5'}
    className={isFavorited ? 'bg-green-100' : ''}
/> */}

// 4. Toggle theme with SunIcon/MoonIcon (yellow for Sun with rotation, blue for Moon)
{/* <IconButton
    icon={isDarkMode ? SunIcon : MoonIcon}
    onClick={() => setIsDarkMode(!isDarkMode)}
    iconClasses={isDarkMode ? 'text-yellow-500 rotate-12' : 'text-blue-500'}
    className="mt-2"
/> */}

// 5. Form submission with FaCheck icon and conditional styling (green icon when valid, smaller size)
{/* <IconButton
    icon={FaCheck}
    onClick={handleSubmit}
    iconClasses={formValid ? 'text-green-600 w-4 h-4' : 'text-gray-400 w-4 h-4'}
    className={formValid ? 'bg-green-100' : 'opacity-50 cursor-not-allowed'}
/> */}

// 6. Delete action in a modal with TrashIcon (red icon with slight scale)
{/* <IconButton
    icon={TrashIcon}
    onClick={handleDelete}
    iconClasses="text-red-600 scale-110"
    className="bg-red-100 hover:bg-red-200"
/> */}

// 7. Navigation button with HomeIcon (purple icon with bold stroke)
{/* <IconButton
    icon={HomeIcon}
    onClick={() => router.push('/home')}
    iconClasses="text-purple-500 stroke-2"
/> */}

// 8. Disabled state with CogIcon (gray icon with reduced opacity)
{/* <IconButton
    icon={CogIcon}
    onClick={isDisabled ? null : handleSettingsClick}
    iconClasses={isDisabled ? 'text-gray-400 opacity-50' : 'text-vivid-red'}
    className={isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
/> */}

// 9. Custom size and color with MapPinIcon (blue icon with larger size)
{/* <IconButton
    icon={MapPinIcon}
    onClick={handleLocationClick}
    iconClasses="text-blue-500 w-6 h-6"
    className="w-10 h-10 border-blue-300 hover:border-blue-500 hover:shadow-[0_0_10px_#3b82f6]"
/> */}

// 10. With tooltip using wrapper div (cyan icon with rotation animation)
{/* <div className="relative group">
    <IconButton
        icon={FaInfoCircle}
        onClick={handleInfoClick}
        iconClasses="text-cyan-500 animate-spin-slow"
    />
    <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2">
        Info
    </span>
</div> */}