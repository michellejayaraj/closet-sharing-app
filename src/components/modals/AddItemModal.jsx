import { useState, useEffect } from "react";

export function AddItemModal({ isOpen, onClose, onAdd }) {
  const [imageUrl, setImageUrl] = useState("");
  const [name, setName] = useState("");
  const [isImageValid, setIsImageValid] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    } else {
      const timeout = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setImageUrl("");
      setName("");
      setIsImageValid(false);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const isDisabled = !imageUrl.trim() || !name.trim();

  const handleAdd = () => {
    if (isDisabled) return;

    onAdd({
      imageUrl: imageUrl.trim(),
      name: name.trim(),
      borrowed: false,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 transition-all duration-200 ease-out
          ${isOpen ? "opacity-100" : "opacity-0"}`}
      />

      {/* Modal Card */}
      <div
        className={`relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl
          transition-all duration-200 ease-out
          ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
      >
        <h2 className="text-xl font-semibold mb-4">
          Add New Item
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!isDisabled) handleAdd();
          }}
        >
          <input
            type="text"
            placeholder="Paste image URL..."
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value);
              setIsImageValid(false);
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-black"
          />

          {imageUrl && isImageValid && (
            <div className="mb-4">
              <img
                src={imageUrl}
                alt="Preview"
                className="max-w-[200px] rounded-lg border"
              />
            </div>
          )}

          {imageUrl && (
            <img
              src={imageUrl}
              alt=""
              className="hidden"
              onLoad={() => setIsImageValid(true)}
              onError={() => setIsImageValid(false)}
            />
          )}

          <input
            type="text"
            placeholder="Item name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 mb-5 focus:outline-none focus:ring-2 focus:ring-black"
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-300 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
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
        </form>
      </div>
    </div>
  );
}
