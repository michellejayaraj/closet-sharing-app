import { Trash2 } from "lucide-react";
export function ClosetItem({
    item,
    onClick,
    buttonLabel,
    onButtonClick,
    buttonDisabled = false,
    subtitle,
    onDelete,
  }) {
    return (
      <div
        onClick={onClick}
        className="group bg-white rounded-2xl border border-gray-200 p-4 cursor-pointer
                   transition-all duration-300 ease-in-out
                   hover:-translate-y-1 hover:shadow-lg"
      >
        {/* Image Container */}
        <div className="relative overflow-hidden rounded-xl">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-52 object-cover
                       transition-transform duration-300 ease-in-out
                       group-hover:scale-105"
          />
          {/* Delete button - only shown on hover when onDelete is provided */}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="absolute top-2 right-2 p-2 rounded-lg
              bg-white/80 backdrop-blur-sm text-gray-700
              opacity-0 group-hover:opacity-100
              transition-all duration-200
              hover:text-red-500"
   

              aria-label="Delete item"
            >
              <Trash2 size={16} />
            </button>
          )}

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
  