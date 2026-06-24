import { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native'
import Swipeable from 'react-native-gesture-handler/Swipeable'
import { supabase } from '../lib/supabase'
import { useNavigation } from '@react-navigation/native'
import { Button } from '../components/ui/Button'
import { GroupCard } from '../components/groups/GroupCard'
import { GroupsEmptyHero } from '../components/groups/GroupsEmptyHero'
import { ModalShell } from '../components/ui/ModalShell'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { colors, spacing, radii, typography } from '../lib/theme'

async function fetchGroupPreviewImages(groupId) {
  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)

  if (membersError || !members?.length) return []

  const userIds = members.map((m) => m.user_id)
  const { data: items, error: itemsError } = await supabase
    .from('closet_items')
    .select('image_url')
    .in('user_id', userIds)
    .not('image_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(4)

  if (itemsError) return []
  return (items || []).map((i) => i.image_url).filter(Boolean)
}

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

    const { data, error: loadError } = await supabase
      .from('group_members')
      .select('group_id, role, groups(id, name, invite_code, created_by)')
      .eq('user_id', user.id)

    if (loadError) {
      console.error('Failed to load groups:', loadError)
      setGroups([])
    } else {
      const groupsBase = data.map((row) => ({ ...row.groups, role: row.role }))
      const groupsWithPreviews = await Promise.all(
        groupsBase.map(async (group) => ({
          ...group,
          previewImages: await fetchGroupPreviewImages(group.id),
        })),
      )
      setGroups(groupsWithPreviews)
    }
    setLoading(false)
  }

  const openCreate = () => {
    setError(null)
    setCreateOpen(true)
  }

  const openJoin = () => {
    setError(null)
    setJoinOpen(true)
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

    setGroups((prev) => [...prev, { ...group, role: 'owner', previewImages: [] }])
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

    const previewImages = await fetchGroupPreviewImages(group.id)
    setGroups((prev) => [...prev, { ...group, role: 'member', previewImages }])
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
            const { error: deleteError } = await supabase
              .from('groups')
              .delete()
              .eq('id', group.id)
            if (deleteError) {
              console.error('Delete group error:', deleteError)
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
            const { error: leaveError } = await supabase
              .from('group_members')
              .delete()
              .eq('group_id', group.id)
              .eq('user_id', currentUserId)
            if (leaveError) {
              console.error('Leave group error:', leaveError)
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Groups"
        action={
          <View style={styles.headerButtons}>
            <Button variant="secondary" onPress={openJoin}>
              Join
            </Button>
            <Button variant="primary" onPress={openCreate}>
              New Group
            </Button>
          </View>
        }
      />

      {groups.length === 0 ? (
        <GroupsEmptyHero onCreate={openCreate} onJoin={openJoin} />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Swipeable renderRightActions={() => renderRightActions(item)}>
              <GroupCard
                group={item}
                onPress={() => navigation.navigate('GroupDetail', { group: item })}
                onShare={() => shareInvite(item)}
              />
            </Swipeable>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <Text style={styles.footerHint}>
              Tap to browse groups · Swipe to leave
            </Text>
          }
        />
      )}

      <ModalShell
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Group"
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TextInput
          placeholder="Group name..."
          placeholderTextColor={colors.muted}
          value={groupName}
          onChangeText={setGroupName}
          style={styles.input}
        />
        <View style={styles.modalActions}>
          <Button variant="secondary" onPress={() => setCreateOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onPress={createGroup}
            loading={saving}
            disabled={!groupName.trim()}
          >
            Create
          </Button>
        </View>
      </ModalShell>

      <ModalShell
        visible={joinOpen}
        onClose={() => setJoinOpen(false)}
        title="Join Group"
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TextInput
          placeholder="Enter invite code..."
          placeholderTextColor={colors.muted}
          value={inviteCode}
          onChangeText={setInviteCode}
          style={styles.input}
          autoCapitalize="characters"
        />
        <View style={styles.modalActions}>
          <Button variant="secondary" onPress={() => setJoinOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onPress={joinGroup}
            loading={saving}
            disabled={!inviteCode.trim()}
          >
            Join
          </Button>
        </View>
      </ModalShell>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  footerHint: {
    marginTop: spacing.sm,
    fontSize: typography.caption.fontSize,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: spacing.md,
  },
  swipeActionContainer: {
    marginBottom: spacing.md,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  swipeActionButton: {
    backgroundColor: '#ef4444',
    width: 80,
    height: '100%',
    minHeight: 220,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
  },
  swipeActionText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '600',
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
  error: {
    color: '#ef4444',
    marginBottom: spacing.sm,
    fontSize: typography.body.fontSize,
  },
})
