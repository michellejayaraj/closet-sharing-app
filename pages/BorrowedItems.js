import { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { supabase } from '../lib/supabase'

export function BorrowedItems() {
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
            <Text style={styles.dateText}>
              Borrowed on {borrowedDate}
            </Text>
          ) : null}
          <TouchableOpacity
            style={styles.returnButton}
            activeOpacity={0.8}
            onPress={() => handleReturn(item.id)}
          >
            <Text style={styles.returnButtonText}>Return</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Borrowed Items</Text>

      {loading && borrowedItems.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#000" />
        </View>
      ) : borrowedItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            You haven't borrowed anything yet. Check out your groups to borrow
            from friends!
          </Text>
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
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
  },
  cardContent: {
    gap: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  ownerText: {
    fontSize: 14,
    color: '#4b5563',
  },
  dateText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },
  returnButton: {
    marginTop: 8,
    backgroundColor: '#000',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  returnButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
})
