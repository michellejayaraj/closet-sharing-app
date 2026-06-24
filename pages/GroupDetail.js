import { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { supabase } from '../lib/supabase'
import { ItemDetailModal } from '../components/modals/ItemDetailModal'
import { ItemCard } from '../components/closet/ItemCard'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ModalShell } from '../components/ui/ModalShell'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { StatusBadge } from '../components/ui/StatusBadge'
import { colors, spacing, radii, typography } from '../lib/theme'

export function GroupDetail({ route }) {
  const [group, setGroup] = useState(route.params.group)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [borrowedItemIds, setBorrowedItemIds] = useState(new Set())
  const [borrowedByOthers, setBorrowedByOthers] = useState(new Set())
  const [selectedItem, setSelectedItem] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editGroupName, setEditGroupName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    setCurrentUserId(user.id)

    const { data: memberRows, error: memberError } = await supabase
      .from('group_members')
      .select('user_id, role, profiles(id, email, display_name, avatar_url)')
      .eq('group_id', group.id)

    if (memberError) {
      console.error('Failed to load members:', memberError)
      setLoading(false)
      return
    }

    const { data: borrowRows, error: borrowError } = await supabase
      .from('borrowed_items')
      .select('closet_item_id, borrower_id')
      .is('returned_at', null)

    if (borrowError) {
      console.error('Failed to load borrowed items:', borrowError)
    }

    const myBorrowedIds = new Set(
      (borrowRows || [])
        .filter(row => row.borrower_id === user.id)
        .map(row => row.closet_item_id)
    )

    const othersborrowedIds = new Set(
      (borrowRows || [])
        .filter(row => row.borrower_id !== user.id)
        .map(row => row.closet_item_id)
    )

    setBorrowedItemIds(myBorrowedIds)
    setBorrowedByOthers(othersborrowedIds)

    const otherMembers = memberRows.filter(row => row.user_id !== user.id)
    const membersWithItems = await Promise.all(
      otherMembers.map(async (row) => {
        const { data: items } = await supabase
          .from('closet_items')
          .select('*')
          .eq('user_id', row.user_id)

        const mappedItems = (items || []).map((item) => ({
          id: item.id,
          name: item.name,
          imageUrl: item.image_url,
        }))

        return {
          userId: row.user_id,
          role: row.role,
          email: row.profiles?.email,
          displayName: row.profiles?.display_name,
          avatarUrl: row.profiles?.avatar_url,
          items: mappedItems,
        }
      }),
    )

    setMembers(membersWithItems)
    if (membersWithItems.length > 0) {
      setSelectedMember(membersWithItems[0])
    }
    setLoading(false)
  }

  const getLabel = (member) => {
    return member.displayName || member.email?.split('@')[0] || 'Member'
  }

  const openDetail = (item) => {
    setSelectedItem(item)
    setIsDetailOpen(true)
  }

  const closeDetail = () => {
    setSelectedItem(null)
    setIsDetailOpen(false)
  }

  const handleBorrow = async (itemId) => {
    if (!currentUserId || !selectedMember) return

    if (borrowedByOthers.has(itemId)) {
      Alert.alert('Unavailable', 'This item is already borrowed by someone else.')
      return
    }

    const { error } = await supabase.from('borrowed_items').insert({
      borrower_id: currentUserId,
      owner_id: selectedMember.userId,
      closet_item_id: itemId,
      group_id: group.id,
    })

    if (error) {
      if (error.code === '23505') {
        Alert.alert('Unavailable', 'This item is already borrowed by someone else.')
        setBorrowedByOthers(prev => new Set([...prev, itemId]))
      } else {
        console.error('Borrow error:', error)
        Alert.alert('Error', 'Could not borrow this item. Please try again.')
      }
      return
    }

    setBorrowedItemIds((prev) => new Set([...prev, itemId]))
    Alert.alert('Borrowed', 'Item added to your borrowed items.')
    closeDetail()
  }

  const handleSaveGroupName = async () => {
    const newName = editGroupName.trim()
    if (!newName || newName === group.name) return
    setSaving(true)
    const { error } = await supabase
      .from('groups')
      .update({ name: newName })
      .eq('id', group.id)
    if (error) {
      console.error('Update group name error:', error)
      Alert.alert('Error', 'Could not update group name.')
    } else {
      setGroup((prev) => ({ ...prev, name: newName }))
      setEditModalOpen(false)
    }
    setSaving(false)
  }

  const openEditModal = () => {
    setEditGroupName(group.name)
    setEditModalOpen(true)
  }

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={colors.text} />
    </View>
  )

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={group.name}
        action={
          <TouchableOpacity
            onPress={openEditModal}
            style={styles.editIconButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="edit-2" size={18} color={colors.muted} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabs}
        contentContainerStyle={styles.tabsContent}
      >
        {members.map(member => (
          <TouchableOpacity
            key={member.userId}
            onPress={() => setSelectedMember(member)}
            style={[
              styles.tab,
              selectedMember?.userId === member.userId && styles.tabActive
            ]}
          >
            <View style={styles.tabInner}>
              {member.avatarUrl ? (
                <Image
                  source={{ uri: member.avatarUrl }}
                  style={styles.tabAvatar}
                />
              ) : (
                <View style={styles.tabAvatarPlaceholder}>
                  <Text style={styles.tabAvatarInitial}>
                    {getLabel(member).charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={[
                styles.tabText,
                selectedMember?.userId === member.userId && styles.tabTextActive,
              ]}>
                {getLabel(member)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedMember && (
        <>
          <Text style={styles.sectionTitle}>
            {`${getLabel(selectedMember)}'s Closet`}
          </Text>

          {selectedMember.items.length === 0 ? (
            <EmptyState
              message={`${getLabel(selectedMember)} hasn't added anything yet.`}
            />
          ) : (
            <FlatList
              data={selectedMember.items}
              keyExtractor={item => item.id}
              numColumns={2}
              columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
              contentContainerStyle={{ paddingBottom: 24 }}
              renderItem={({ item }) => (
                <ItemCard
                  item={item}
                  onPress={() => openDetail(item)}
                  badge={
                    borrowedByOthers.has(item.id)
                      ? <StatusBadge label="Borrowed" style={styles.itemBadge} />
                      : null
                  }
                  style={{ flex: 1 }}
                />
              )}
            />
          )}
        </>
      )}

      {members.length === 0 && (
        <EmptyState message="No other members in this group yet. Share your invite code!" />
      )}

      <ItemDetailModal
        isOpen={isDetailOpen}
        onClose={closeDetail}
        item={
          selectedItem
            ? {
                ...selectedItem,
                borrowed: borrowedItemIds.has(selectedItem.id),
                borrowedByOther: borrowedByOthers.has(selectedItem.id),
                ownerName: selectedMember ? getLabel(selectedMember) : '',
              }
            : null
        }
        onBorrow={handleBorrow}
        showBorrowButton
      />

      <ModalShell
        visible={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Group Name"
      >
        <TextInput
          placeholder="Group name..."
          placeholderTextColor={colors.muted}
          value={editGroupName}
          onChangeText={setEditGroupName}
          style={styles.input}
          autoFocus
        />
        <View style={styles.modalActions}>
          <Button variant="secondary" onPress={() => setEditModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onPress={handleSaveGroupName}
            loading={saving}
            disabled={!editGroupName.trim() || editGroupName.trim() === group.name}
          >
            Save
          </Button>
        </View>
      </ModalShell>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  editIconButton: {
    padding: 4,
  },
  tabs: {
    marginBottom: spacing.md,
  },
  tabsContent: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  tab: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.muted,
  },
  tabTextActive: {
    color: colors.surface,
  },
  tabAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  tabAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabAvatarInitial: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  sectionTitle: {
    fontSize: typography.sectionHeading.fontSize,
    fontWeight: typography.sectionHeading.fontWeight,
    color: colors.text,
    marginBottom: spacing.sm + 4,
  },
  itemBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg - 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
})
