import { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { supabase } from '../lib/supabase'
import { useNavigation } from '@react-navigation/native'
import { Button } from '../components/ui/Button'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { colors, spacing, radii, typography } from '../lib/theme'

export function BorrowedItems() {
  const navigation = useNavigation()
  const [borrowedItems, setBorrowedItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadBorrowedItems = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setBorrowedItems([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('borrowed_items')
        .select(
          `
          id,
          borrowed_at,
          owner_id,
          closet_items (id, name, image_url)
        `,
        )
        .eq('borrower_id', user.id)
        .is('returned_at', null)
        .order('borrowed_at', { ascending: false })

      if (error) {
        console.error('Failed to load borrowed items:', error)
        Alert.alert('Error', 'Could not load your borrowed items.')
        setBorrowedItems([])
        return
      }

      const ownerIds = Array.from(
        new Set((data || []).map((row) => row.owner_id).filter(Boolean)),
      )

      let profileById = new Map()
      if (ownerIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name, email')
          .in('id', ownerIds)

        if (profilesError) {
          console.error('Failed to load owners for borrowed items:', profilesError)
        } else if (profiles) {
          profileById = new Map(
            profiles.map((p) => [p.id, p]),
          )
        }
      }

      const items = (data || []).map((row) => {
        const profile = profileById.get(row.owner_id)
        return {
          id: row.id,
          borrowedAt: row.borrowed_at,
          item: {
            id: row.closet_items?.id,
            name: row.closet_items?.name,
            imageUrl: row.closet_items?.image_url,
          },
          ownerName:
            profile?.display_name ||
            profile?.email ||
            'Unknown',
        }
      })

      setBorrowedItems(items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBorrowedItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleReturn = async (borrowedItemId) => {
    const { error } = await supabase
      .from('borrowed_items')
      .update({ returned_at: new Date().toISOString() })
      .eq('id', borrowedItemId)

    if (error) {
      console.error('Return error:', error)
      Alert.alert('Error', 'Could not return item.')
      return
    }

    setBorrowedItems((prev) => prev.filter((b) => b.id !== borrowedItemId))
  }

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await loadBorrowedItems()
    } finally {
      setRefreshing(false)
    }
  }

  const renderItem = ({ item }) => {
    const borrowedDate = item.borrowedAt
      ? new Date(item.borrowedAt).toLocaleDateString()
      : ''

    return (
      <View style={styles.card}>
        {item.item?.imageUrl ? (
          <Image
            source={{ uri: item.item.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : null}
        <View style={styles.cardContent}>
          <Text style={styles.itemName}>{item.item?.name}</Text>
          <Text style={styles.ownerText}>From: {item.ownerName}</Text>
          {borrowedDate ? (
            <Text style={styles.dateText}>Borrowed on {borrowedDate}</Text>
          ) : null}
          <Button
            variant="primary"
            onPress={() => handleReturn(item.id)}
            style={styles.returnButton}
          >
            Return
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Borrowed Items" />

      {loading && borrowedItems.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.text} />
        </View>
      ) : borrowedItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="archive" size={20} color={colors.muted} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>Nothing borrowed yet</Text>
          <Text style={styles.emptyDescription}>
            Borrowed pieces from friends will appear here.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Groups')}
            activeOpacity={0.7}
            style={styles.emptyLink}
          >
            <Text style={styles.emptyLinkText}>Browse groups →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={borrowedItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        />
      )}
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
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: radii.sm,
    marginBottom: spacing.sm + 4,
  },
  cardContent: {
    gap: 4,
  },
  itemName: {
    fontSize: typography.cardLabel.fontSize,
    fontWeight: typography.cardLabel.fontWeight,
    color: colors.text,
    marginBottom: 2,
  },
  ownerText: {
    fontSize: typography.body.fontSize,
    color: colors.muted,
  },
  dateText: {
    fontSize: typography.body.fontSize,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  returnButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
})
