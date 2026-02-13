export function ItemDetailModal({
    isOpen,
    onClose,
    item,
    onBorrow,
    onReturn,
    showBorrowButton = false,
    showReturnButton = false,
  }) {
    if (!isOpen || !item) return null;
  
    const handleBorrow = () => {
      if (onBorrow) {
        onBorrow(item.id);
        onClose();
      }
    };
  
    const handleReturn = () => {
      if (onReturn) {
        onReturn(item.id);
        onClose();
      }
    };
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/60"
          onClick={onClose}
        />
  
        {/* Modal Card */}
        <div className="relative z-10 w-full max-w-3xl mx-4 rounded-2xl bg-white shadow-2xl overflow-hidden">
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-600 hover:text-black text-2xl font-bold"
          >
            ×
          </button>
  
          {/* Image */}
          <div className="flex justify-center bg-gray-50">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="max-h-[70vh] w-auto object-contain"
            />
          </div>
  
          {/* Content */}
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">
              {item.name}
            </h2>
  
            {/* Borrowed Badge */}
            {item.borrowed && (
              <span className="inline-block mb-4 rounded-full bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700">
                Borrowed
              </span>
            )}
  
            {/* Buttons */}
            <div className="flex gap-3">
              {showBorrowButton && !item.borrowed && (
                <button
                  onClick={handleBorrow}
                  className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 transition"
                >
                  Borrow
                </button>
              )}
  
              {showReturnButton && (
                <button
                  onClick={handleReturn}
                  className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 transition"
                >
                  Return
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  