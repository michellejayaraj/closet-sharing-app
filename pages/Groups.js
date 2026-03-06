import { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native'
import Swipeable from 'react-native-gesture-handler/Swipeable'
import { supabase } from '../lib/supabase'
import { useNavigation } from '@react-navigation/native'

export function Groups() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const navigation = useNavigation()

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    setCurrentUserId(user.id)

    const { data, error } = await supabase
      .from('group_members')
      .select('group_id, role, groups(id, name, invite_code, created_by)')
      .eq('user_id', user.id)

    if (error) {
      console.error('Failed to load groups:', error)
    } else {
      setGroups(data.map(row => ({ ...row.groups, role: row.role })))
    }
    setLoading(false)
  }

  const createGroup = async () => {
    if (!groupName.trim()) return
    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({ name: groupName.trim(), created_by: user.id })
      .select()
      .single()

    if (groupError) {
        console.error('Create group error:', groupError)
        setError('Failed to create group.')
        setSaving(false)
        return
    }

    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: user.id, role: 'owner' })

    if (memberError) {
      setError('Failed to join group.')
      setSaving(false)
      return
    }

    setGroups(prev => [...prev, { ...group, role: 'owner' }])
    setGroupName('')
    setCreateOpen(false)
    setSaving(false)
  }

  const joinGroup = async () => {
    if (!inviteCode.trim()) return
    setSaving(true)
    setError(null)

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .single()

    if (groupError || !group) {
      setError('Invalid invite code.')
      setSaving(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: user.id, role: 'member' })

    if (memberError) {
      setError('Could not join group. You may already be a member.')
      setSaving(false)
      return
    }

    setGroups(prev => [...prev, { ...group, role: 'member' }])
    setInviteCode('')
    setJoinOpen(false)
    setSaving(false)
  }

  const shareInvite = async (group) => {
    await Share.share({
      message: `Join my closet group "${group.name}"! Use invite code: ${group.invite_code}`,
    })
  }

  const handleDeleteGroup = (group) => {
    Alert.alert(
      'Delete Group',
      'This will delete the group for all members. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('groups')
              .delete()
              .eq('id', group.id)
            if (error) {
              console.error('Delete group error:', error)
              Alert.alert('Error', 'Could not delete group.')
              return
            }
            setGroups((prev) => prev.filter((g) => g.id !== group.id))
          },
        },
      ],
    )
  }

  const handleLeaveGroup = (group) => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('group_members')
              .delete()
              .eq('group_id', group.id)
              .eq('user_id', currentUserId)
            if (error) {
              console.error('Leave group error:', error)
              Alert.alert('Error', 'Could not leave group.')
              return
            }
            setGroups((prev) => prev.filter((g) => g.id !== group.id))
          },
        },
      ],
    )
  }

  const renderRightActions = (item) => (
    <View style={styles.swipeActionContainer}>
      <TouchableOpacity
        style={styles.swipeActionButton}
        activeOpacity={0.8}
        onPress={() =>
          item.role === 'owner' ? handleDeleteGroup(item) : handleLeaveGroup(item)
        }
      >
        <Text style={styles.swipeActionText}>
          {item.role === 'owner' ? 'Delete' : 'Leave'}
        </Text>
      </TouchableOpacity>
    </View>
  )

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" />
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Groups</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => { setError(null); setJoinOpen(true) }}
            style={[styles.button, styles.secondaryButton]}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Join</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setError(null); setCreateOpen(true) }}
            style={styles.button}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>New Group</Text>
          </TouchableOpacity>
        </View>
      </View>

      {groups.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No groups yet. Create one and invite your friends!
          </Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <Swipeable renderRightActions={() => renderRightActions(item)}>
              <TouchableOpacity
                onPress={() => navigation.navigate('GroupDetail', { group: item })}
                activeOpacity={0.8}
              >
                <View style={styles.groupCard}>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{item.name}</Text>
                    <Text style={styles.groupCode}>Code: {item.invite_code}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation(); shareInvite(item) }}
                    style={styles.shareButton}
                  >
                    <Text style={styles.shareButtonText}>Share Invite</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Swipeable>
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}

      {/* Create Group Modal */}
      <Modal visible={createOpen} transparent animationType="fade" onRequestClose={() => setCreateOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setCreateOpen(false)}>
          <Pressable style={styles.card} onPress={() => {}}>
            <Text style={styles.modalTitle}>Create Group</Text>
            {error && <Text style={styles.error}>{error}</Text>}
            <TextInput
              placeholder="Group name..."
              placeholderTextColor="#9ca3af"
              value={groupName}
              onChangeText={setGroupName}
              style={styles.input}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setCreateOpen(false)} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={createGroup}
                disabled={saving || !groupName.trim()}
                style={[styles.button, (saving || !groupName.trim()) && styles.buttonDisabled]}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buttonText}>Create</Text>
                }
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Join Group Modal */}
      <Modal visible={joinOpen} transparent animationType="fade" onRequestClose={() => setJoinOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setJoinOpen(false)}>
          <Pressable style={styles.card} onPress={() => {}}>
            <Text style={styles.modalTitle}>Join Group</Text>
            {error && <Text style={styles.error}>{error}</Text>}
            <TextInput
              placeholder="Enter invite code..."
              placeholderTextColor="#9ca3af"
              value={inviteCode}
              onChangeText={setInviteCode}
              style={styles.input}
              autoCapitalize="characters"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setJoinOpen(false)} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={joinGroup}
                disabled={saving || !inviteCode.trim()}
                style={[styles.button, (saving || !inviteCode.trim()) && styles.buttonDisabled]}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buttonText}>Join</Text>
                }
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerButtons: { flexDirection: 'row', gap: 8 },
  title: { fontSize: 24, fontWeight: '600', color: '#111827' },
  button: {
    borderRadius: 8,
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  buttonDisabled: { backgroundColor: '#d1d5db' },
  buttonText: { fontSize: 14, fontWeight: '500', color: '#fff' },
  secondaryButton: { backgroundColor: '#f3f4f6' },
  secondaryButtonText: { fontSize: 14, fontWeight: '500', color: '#111827' },
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
  emptyText: { fontSize: 16, color: '#4b5563', textAlign: 'center' },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  groupCode: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  shareButton: {
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  shareButtonText: { fontSize: 13, fontWeight: '500', color: '#111827' },
  swipeActionContainer: {
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  swipeActionButton: {
    backgroundColor: '#ef4444',
    width: 80,
    height: '100%',
    minHeight: 72,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  swipeActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
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
  modalTitle: { fontSize: 20, fontWeight: '600', marginBottom: 16, color: '#111827' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelButton: {
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  error: { color: '#ef4444', marginBottom: 12, fontSize: 14 },
})