import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, FlatList} from 'react-native'
import { useCloset } from '../hooks/useCloset'
import { ClosetItem } from '../components/closet/ClosetItem'
import { ClosetGrid } from '../components/closet/ClosetGrid'
import { AddItemModal } from '../components/modals/AddItemModal'
import { ItemDetailModal } from '../components/modals/ItemDetailModal'

export function MyCloset() {
  const { myCloset, addToMyCloset, deleteFromMyCloset } = useCloset()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const openDetail = (item) => {
    setSelectedItem(item)
    setIsDetailOpen(true)
  }

  const closeDetail = () => {
    setSelectedItem(null)
    setIsDetailOpen(false)
  }

  const renderItem = ({ item }) => (
    <View style={styles.gridItem}>
      <ClosetItem
        item={item}
        onClick={() => openDetail(item)}
        onDelete={deleteFromMyCloset}
      />
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Closet</Text>
        <TouchableOpacity
          onPress={() => setIsModalOpen(true)}
          style={styles.addButton}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      {!myCloset || myCloset.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Your closet is empty. Add your first item!
          </Text>
        </View>
      ) : (
        <ClosetGrid data={myCloset} renderItem={renderItem} />
      )}

      <AddItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addToMyCloset}
      />

      <ItemDetailModal
        isOpen={isDetailOpen}
        onClose={closeDetail}
        item={selectedItem}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  addButton: {
    borderRadius: 8,
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
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
