import { useState } from "react";
import { useCloset } from "../hooks/useCloset";
import { ClosetItem } from "../components/closet/ClosetItem";
import { ItemDetailModal } from "../components/modals/ItemDetailModal";

export function BorrowedItems() {
  const { friendsCloset, returnItem } = useCloset();

  const borrowedItems = (friendsCloset || []).filter(
    (item) => item.borrowed === true
  );

  const [selectedItem, setSelectedItem] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const openModal = (item) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const closeModal = () => {
    setSelectedItem(null);
    setIsDetailOpen(false);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6">Borrowed Items</h1>

      {borrowedItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
          <p className="text-gray-600">
            You haven't borrowed anything yet. Check out your friend's closet!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {borrowedItems.map((item) => (
            <ClosetItem
            key={item.id}
            item={item}
            subtitle="From Sarah"
            onClick={() => openModal(item)}
            buttonLabel="Return"
            onButtonClick={returnItem}
          />          
          ))}
        </div>
      )}

      <ItemDetailModal
        isOpen={isDetailOpen}
        onClose={closeModal}
        item={selectedItem}
        onReturn={returnItem}
        showReturnButton
      />
    </div>
  );
}
