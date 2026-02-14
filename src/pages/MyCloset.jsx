import { useState } from "react";
import { useCloset } from "../hooks/useCloset";
import { ClosetItem } from "../components/closet/ClosetItem";
import { AddItemModal } from "../components/modals/AddItemModal";
import { ItemDetailModal } from "../components/modals/ItemDetailModal";

export function MyCloset() {
  const { myCloset, addToMyCloset, deleteFromMyCloset } = useCloset();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const openDetail = (item) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const closeDetail = () => {
    setSelectedItem(null);
    setIsDetailOpen(false);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Closet</h1>

        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition"
        >
          Add Item
        </button>
      </div>

      {/* Empty State */}
      {!myCloset || myCloset.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
          <p className="text-gray-600">
            Your closet is empty. Add your first item!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {myCloset.map((item) => (
          <ClosetItem
            key={item.id}
            item={item}
            onClick={() => openDetail(item)}
            onDelete={deleteFromMyCloset}
          />
        ))}
        </div>
      )}

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addToMyCloset}
      />

      {/* Detail Modal (no borrow buttons in MyCloset) */}
      <ItemDetailModal
        isOpen={isDetailOpen}
        onClose={closeDetail}
        item={selectedItem}
      />
    </div>
  );
}
