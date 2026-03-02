import { useState, useMemo } from 'react'
import { View, Text, StyleSheet, FlatList} from 'react-native'
import { useCloset } from '../hooks/useCloset'
import { ClosetItem } from '../components/closet/ClosetItem'
import { ClosetGrid } from '../components/closet/ClosetGrid'
import { ItemDetailModal } from '../components/modals/ItemDetailModal'

export function BorrowedItems() {
  const { friendsCloset, returnItem } = useCloset()

  const borrowedItems = useMemo(
    () => (friendsCloset || []).filter((item) => item.borrowed === true),
    [friendsCloset],
  )

  const [selectedItem, setSelectedItem] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const openModal = (item) => {
    setSelectedItem(item)
    setIsDetailOpen(true)
  }

  const closeModal = () => {
    setSelectedItem(null)
    setIsDetailOpen(false)
  }

  const renderItem = ({ item }) => (
    <View style={styles.gridItem}>
      <ClosetItem
        item={item}
        subtitle="From Sarah"
        onClick={() => openModal(item)}
        buttonLabel="Return"
        onButtonClick={returnItem}
      />
    </View>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Borrowed Items</Text>

      {borrowedItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            You haven't borrowed anything yet. Check out your friend's closet!
          </Text>
        </View>
      ) : (
        <ClosetGrid data={borrowedItems} renderItem={renderItem} />
      )}

      <ItemDetailModal
        isOpen={isDetailOpen}
        onClose={closeModal}
        item={selectedItem}
        onReturn={returnItem}
        showReturnButton
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
    color: '#111827',
  },
  emptyState: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
  },
  gridItem: {
    flex: 1,
  },
})
