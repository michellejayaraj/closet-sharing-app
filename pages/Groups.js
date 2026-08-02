import { useState, useEffect, useCallback } from 'react'
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
import { getSessionUser } from '../lib/session'
import { measureAsync } from '../lib/performance'
import { useNavigation } from '@react-navigation/native'
import { Button } from '../components/ui/Button'
import { GroupCard } from '../components/groups/GroupCard'
import { GroupsEmptyHero } from '../components/groups/GroupsEmptyHero'
import { ModalShell } from '../components/ui/ModalShell'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { colors, spacing, radii, typography } from '../lib/theme'

const groupsCacheByUser = new Map()

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

  const loadGroups = useCallback(async () => {
    const user = await getSessionUser()
    if (!user) {
      setLoading(false)
      return
    }
    setCurrentUserId(user.id)

    const cachedGroups = groupsCacheByUser.get(user.id)
    if (cachedGroups) {
      setGroups(cachedGroups)
      setLoading(false)
    }

    const { data, error: loadError } = await measureAsync('groups.load', () =>
      supabase.rpc('get_my_groups_with_previews'),
    )

    if (loadError) {
      console.error('Failed to load groups:', loadError)
      if (!cachedGroups) setGroups([])
    } else {
      const nextGroups = (data || []).map((group) => ({
        ...group,
        previewImages: group.preview_images || [],
      }))
      groupsCacheByUser.set(user.id, nextGroups)
      setGroups(nextGroups)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  const updateGroups = useCallback(
    (updater) => {
      setGroups((previous) => {
        const next = updater(previous)
        if (currentUserId) groupsCacheByUser.set(currentUserId, next)
        return next
      })
    },
    [currentUserId],
  )

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

    const { data: group, error: groupError } = await supabase.rpc(
      'create_group',
      { group_name_input: groupName.trim() },
    )

    if (groupError) {
      console.error('Create group error:', groupError)
      setError('Failed to create group.')
      setSaving(false)
      return
    }

    updateGroups((prev) => [
      ...prev,
      { ...group, role: 'owner', previewImages: [] },
    ])
    setGroupName('')
    setCreateOpen(false)
    setSaving(false)
  }

  const joinGroup = async () => {
    if (!inviteCode.trim()) return
    setSaving(true)
    setError(null)

    const { data: group, error: groupError } = await supabase.rpc(
      'join_group_by_invite_code',
      { invite_code_input: inviteCode.trim() },
    )

    if (groupError || !group) {
      setError('Invalid invite code.')
      setSaving(false)
      return
    }

    updateGroups((prev) => [
      ...prev,
      { ...group, role: 'member', previewImages: [] },
    ])
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
            updateGroups((prev) => prev.filter((g) => g.id !== group.id))
          },
        },
      ],
    )
  }

  const handleLeaveGroup = (group) => {
    Alert.alert('Leave Group', 'Are you sure you want to leave this group?', [
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
          updateGroups((prev) => prev.filter((g) => g.id !== group.id))
        },
      },
    ])
  }

  const renderRightActions = (item) => (
    <View style={styles.swipeActionContainer}>
      <TouchableOpacity
        style={styles.swipeActionButton}
        activeOpacity={0.8}
        onPress={() =>
          item.role === 'owner'
            ? handleDeleteGroup(item)
            : handleLeaveGroup(item)
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
                onPress={() =>
                  navigation.navigate('GroupDetail', { group: item })
                }
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
