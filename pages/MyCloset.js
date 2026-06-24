import { useState } from 'react'
import { View, Text, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { useCloset } from '../hooks/useCloset'
import { ClosetGrid } from '../components/closet/ClosetGrid'
import { ItemCard } from '../components/closet/ItemCard'
import { AddItemModal } from '../components/modals/AddItemModal'
import { ItemDetailModal } from '../components/modals/ItemDetailModal'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/StatusBadge'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { colors, spacing, typography } from '../lib/theme'

export function MyCloset() {
  const { myCloset, loading, addToMyCloset, deleteFromMyCloset, refetch } = useCloset()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const openDetail = (item) => {
    setSelectedItem(item)
    setIsDetailOpen(true)
  }

  const closeDetail = () => {
    setSelectedItem(null)
    setIsDetailOpen(false)
  }

  const handleDelete = async (id) => {
    await deleteFromMyCloset(id)
    closeDetail()
  }

  const renderItem = ({ item }) => (
    <ItemCard
      item={item}
      onPress={() => openDetail(item)}
      badge={
        item.borrowed
          ? <StatusBadge label="Borrowed" style={styles.itemBadge} />
          : null
      }
      style={styles.gridItem}
    />
  )

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refetch()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="My Closet"
        action={
          <Button onPress={() => setIsModalOpen(true)}>
            Add Item
          </Button>
        }
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.text} />
        </View>
      ) : !myCloset || myCloset.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="grid" size={20} color={colors.muted} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>Your closet is empty</Text>
          <Text style={styles.emptyDescription}>
            Add your first piece to start building your closet.
          </Text>
          <TouchableOpacity
            onPress={() => setIsModalOpen(true)}
            activeOpacity={0.7}
            style={styles.emptyLink}
          >
            <Text style={styles.emptyLinkText}>Add item →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ClosetGrid
          data={myCloset}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
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
        onDelete={handleDelete}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  emptyIcon: {
    marginBottom: spacing.md,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: typography.sectionHeading.fontSize,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: typography.body.fontSize,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: spacing.lg,
  },
  emptyLink: {
    paddingVertical: spacing.xs,
  },
  emptyLinkText: {
    fontSize: typography.body.fontSize,
    fontWeight: '500',
    color: colors.pop,
  },
  gridItem: {
    width: '100%',
  },
  itemBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
  },
})
