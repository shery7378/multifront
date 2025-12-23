//src/components/UI/CloseXButton.jsx
import { XMarkIcon } from '@heroicons/react/24/solid';

export default function CloseXButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        w-8 h-8 rounded-full border border-gray-200
        flex items-center justify-center
        hover:border-vivid-red hover:shadow-[0_0_10px_#ef4444]
        transition-colors cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-red-500
      "
      aria-label="Close"
      type="button"
    >
      <XMarkIcon className="w-4 h-4 text-black" />
    </button>
  );
}
