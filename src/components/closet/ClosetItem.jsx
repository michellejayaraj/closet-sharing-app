export function ClosetItem({
    item,
    onClick,
    buttonLabel,
    onButtonClick,
    buttonDisabled = false,
    subtitle,
  }) {
    return (
      <div
        onClick={onClick}
        className="group bg-white rounded-2xl border border-gray-200 p-4 cursor-pointer
                   transition-all duration-300 ease-in-out
                   hover:-translate-y-1 hover:shadow-lg"
      >
        {/* Image Container */}
        <div className="overflow-hidden rounded-xl">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-52 object-cover
                       transition-transform duration-300 ease-in-out
                       group-hover:scale-105"
          />
        </div>
  
        {/* Text Content */}
        <div className="mt-4 space-y-1">
          <p className="text-sm font-semibold text-gray-900">
            {item.name}
          </p>
  
          {subtitle && (
            <p className="text-xs text-gray-500">
              {subtitle}
            </p>
          )}
        </div>
  
        {/* Optional Button */}
        {buttonLabel && (
          <button
            onClick={(e) => {
              e.stopPropagation(); // prevent modal trigger
              if (onButtonClick) onButtonClick(item.id);
            }}
            disabled={buttonDisabled}
            className={`mt-4 w-full rounded-lg px-3 py-2 text-sm font-medium
                        transition-all duration-300 ease-in-out
              ${
                buttonDisabled
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-black text-white hover:bg-gray-800"
              }`}
          >
            {buttonLabel}
          </button>
        )}
      </div>
    );
  }
  