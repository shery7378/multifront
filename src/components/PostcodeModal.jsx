//src/components/PostcodeModal.jsx
import { useState } from "react";

export default function PostcodeModal({ isOpen, onClose, onSave }) {
  const [postcode, setPostcode] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!postcode.trim()) return alert("Please enter a postcode");
    onSave(postcode.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="relative bg-white p-6 rounded shadow-lg w-80">
        {/* Close Button in Top Right */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full border text-gray-500 hover:text-gray-700 text-xl font-bold cursor-pointer"
          aria-label="Close"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold mb-4">Change Your Location</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            className="border p-2 w-full mb-4 rounded"
            placeholder="e.g. SW1A 1AA"
          />
          <div className="flex justify-center space-x-2">
            <button type="submit" className="px-4 py-2 bg-vivid-red text-white rounded cursor-pointer">
              Change
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
