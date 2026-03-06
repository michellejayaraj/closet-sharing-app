import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const ClosetContext = createContext(null)

export function ClosetProvider({ children }) {
  const [myCloset, setMyCloset] = useState([])
  const [loading, setLoading] = useState(true)

  const loadCloset = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      setMyCloset([])
      return
    }

    const { data, error } = await supabase
      .from('closet_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to load closet:', error)
    } else {
      setMyCloset(data.map(item => ({
        id: item.id,
        name: item.name,
        imageUrl: item.image_url,
        borrowed: item.borrowed,
      })))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadCloset()
      } else {
        setMyCloset([])
      }
    })
  
    loadCloset()
  
    return () => subscription.unsubscribe()
  }, [])

  const addToMyCloset = async (item) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('closet_items')
      .insert({
        user_id: user.id,
        name: item.name,
        image_url: item.imageUrl,
        borrowed: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to add item:', error)
    } else {
      setMyCloset(prev => [{
        id: data.id,
        name: data.name,
        imageUrl: data.image_url,
        borrowed: data.borrowed,
      }, ...prev])
    }
  }

  const deleteFromMyCloset = async (id) => {
    // Optimistic UI update: remove immediately from local state
    setMyCloset(prev => prev.filter(item => item.id !== id))

    const { error } = await supabase
      .from('closet_items')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Failed to delete item:', error)
      // If delete fails, ideally we would refetch; for now, log the error.
    }
  }

  const value = {
    myCloset,
    loading,
    addToMyCloset,
    deleteFromMyCloset,
    refetch: () => loadCloset(),
  }

  return (
    <ClosetContext.Provider value={value}>
      {children}
    </ClosetContext.Provider>
  )
}

export function useCloset() {
  const context = useContext(ClosetContext)
  if (!context) {
    throw new Error('useCloset must be used within a ClosetProvider')
  }
  return context
}