import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import { supabase } from '../lib/supabase'
import { getSessionUser } from '../lib/session'
import { measureAsync } from '../lib/performance'
import { appendUniquePage, hasNextPage } from '../lib/pagination.cjs'

const ClosetContext = createContext(null)
const CLOSET_PAGE_SIZE = 24

export function ClosetProvider({ children }) {
  const [myCloset, setMyCloset] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const loadCloset = useCallback(async () => {
    const user = await getSessionUser()
    if (!user) {
      setLoading(false)
      setMyCloset([])
      setHasMore(false)
      return
    }

    const { data, error } = await measureAsync('closet.load.initial', () =>
      supabase
        .from('closet_items')
        .select('id, name, image_url, borrowed, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(0, CLOSET_PAGE_SIZE - 1),
    )

    if (error) {
      console.error('Failed to load closet:', error)
    } else {
      setMyCloset(
        data.map((item) => ({
          id: item.id,
          name: item.name,
          imageUrl: item.image_url,
          borrowed: item.borrowed,
        })),
      )
      setHasMore(hasNextPage(data, CLOSET_PAGE_SIZE))
    }
    setLoading(false)
  }, [])

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return

    setLoadingMore(true)
    try {
      const user = await getSessionUser()
      if (!user) return

      const offset = myCloset.length
      const { data, error } = await measureAsync('closet.load.more', () =>
        supabase
          .from('closet_items')
          .select('id, name, image_url, borrowed, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(offset, offset + CLOSET_PAGE_SIZE - 1),
      )

      if (error) {
        console.error('Failed to load more closet items:', error)
        return
      }

      const nextPage = (data || []).map((item) => ({
        id: item.id,
        name: item.name,
        imageUrl: item.image_url,
        borrowed: item.borrowed,
      }))
      setMyCloset((previous) => appendUniquePage(previous, nextPage))
      setHasMore(hasNextPage(data || [], CLOSET_PAGE_SIZE))
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loading, loadingMore, myCloset.length])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadCloset()
      } else {
        setMyCloset([])
      }
    })

    loadCloset()

    return () => subscription.unsubscribe()
  }, [loadCloset])

  const addToMyCloset = async (item) => {
    const user = await getSessionUser()
    if (!user) return

    const { data, error } = await supabase
      .from('closet_items')
      .insert({
        user_id: user.id,
        name: item.name?.trim() ?? '',
        image_url: item.imageUrl,
        borrowed: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to add item:', error)
    } else {
      setMyCloset((prev) => [
        {
          id: data.id,
          name: data.name,
          imageUrl: data.image_url,
          borrowed: data.borrowed,
        },
        ...prev,
      ])
    }
  }

  const deleteFromMyCloset = async (id) => {
    // Optimistic UI update: remove immediately from local state
    setMyCloset((prev) => prev.filter((item) => item.id !== id))

    const { error } = await supabase.from('closet_items').delete().eq('id', id)

    if (error) {
      console.error('Failed to delete item:', error)
      // If delete fails, ideally we would refetch; for now, log the error.
    }
  }

  const value = {
    myCloset,
    loading,
    loadingMore,
    hasMore,
    addToMyCloset,
    deleteFromMyCloset,
    loadMore,
    refetch: () => loadCloset(),
  }

  return (
    <ClosetContext.Provider value={value}>{children}</ClosetContext.Provider>
  )
}

export function useCloset() {
  const context = useContext(ClosetContext)
  if (!context) {
    throw new Error('useCloset must be used within a ClosetProvider')
  }
  return context
}
