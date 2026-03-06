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
  Modal,
  TextInput,
  Pressable,
} from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { supabase } from '../lib/supabase'
import { ItemDetailModal } from '../components/modals/ItemDetailModal'

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
      <ActivityIndicator size="large" />
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{group.name}</Text>
        <TouchableOpacity
          onPress={openEditModal}
          style={styles.editIconButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="edit-2" size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>

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
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {`${getLabel(selectedMember)} hasn't added anything yet.`}
              </Text>
            </View>
          ) : (
            <FlatList
              data={selectedMember.items}
              keyExtractor={item => item.id}
              numColumns={2}
              columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
              contentContainerStyle={{ paddingBottom: 24 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.itemCard}
                  activeOpacity={0.8}
                  onPress={() => openDetail(item)}
                >
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.itemImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.itemImagePlaceholder} />
                  )}
                  {borrowedByOthers.has(item.id) && (
                    <View style={styles.unavailableBadge}>
                      <Text style={styles.unavailableBadgeText}>Borrowed</Text>
                    </View>
                  )}
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </>
      )}

      {members.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No other members in this group yet. Share your invite code!
          </Text>
        </View>
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

      <Modal
        visible={editModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setEditModalOpen(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Edit Group Name</Text>
            <TextInput
              placeholder="Group name..."
              placeholderTextColor="#9ca3af"
              value={editGroupName}
              onChangeText={setEditGroupName}
              style={styles.modalInput}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setEditModalOpen(false)}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveGroupName}
                disabled={
                  saving ||
                  !editGroupName.trim() ||
                  editGroupName.trim() === group.name
                }
                style={[
                  styles.modalSaveButton,
                  (saving ||
                    !editGroupName.trim() ||
                    editGroupName.trim() === group.name) &&
                    styles.modalButtonDisabled,
                ]}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text
                    style={[
                      styles.modalSaveButtonText,
                      (saving ||
                        !editGroupName.trim() ||
                        editGroupName.trim() === group.name) &&
                        styles.modalSaveButtonTextDisabled,
                    ]}
                  >
                    Save
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  editIconButton: {
    padding: 4,
  },
  tabs: {
    marginBottom: 16,
  },
  tabsContent: {
    gap: 8,
    paddingRight: 16,
  },
  tab: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    alignSelf: 'flex-start',
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#000',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#fff',
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
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabAvatarInitial: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
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
  itemCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemImage: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  itemImagePlaceholder: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#f3f4f6',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
    padding: 8,
  },
  unavailableBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  unavailableBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#111827',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelButton: {
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  modalSaveButton: {
    borderRadius: 8,
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  modalSaveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  modalSaveButtonTextDisabled: {
    color: '#6b7280',
  },
})