import { useState, useEffect } from "react";

export function AddItemModal({ isOpen, onClose, onAdd }) {
  const [imageUrl, setImageUrl] = useState("");
  const [name, setName] = useState("");

  // Clear inputs whenever modal closes
  useEffect(() => {
    if (!isOpen) {
      setImageUrl("");
      setName("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!imageUrl.trim() || !name.trim()) return;

    onAdd({
      imageUrl: imageUrl.trim(),
      name: name.trim(),
      borrowed: false,
    });

    setImageUrl("");
    setName("");
    onClose();
  };

  const isDisabled = !imageUrl.trim() || !name.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold mb-4">
          Add New Item
        </h2>

        {/* Image URL Input */}
        <input
          type="text"
          placeholder="Paste image URL..."
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-black"
        />

        {/* Item Name Input */}
        <input
          type="text"
          placeholder="Item name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 mb-5 focus:outline-none focus:ring-2 focus:ring-black"
        />

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleAdd}
            disabled={isDisabled}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              isDisabled
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            Add Item
          </button>
        </div>
      </div>
    </div>
  );
}
