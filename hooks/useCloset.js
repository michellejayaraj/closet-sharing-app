import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const ClosetContext = createContext(null)

const seedFriendsCloset = () => [
  {
    id: '1',
    imageUrl: 'https://images.urbndata.com/is/image/UrbanOutfitters/101507341_066_b2?$xlarge$&fit=constrain&fmt=webp&qlt=80&wid=720',
    name: 'Off The Shoulder Top',
    borrowed: false,
  },
  {
    id: '2',
    imageUrl: 'https://images.urbndata.com/is/image/UrbanOutfitters/105009674_001_b?$xlarge$&fit=constrain&fmt=webp&qlt=80&wid=720',
    name: 'Lace Boatneck Tee',
    borrowed: false,
  },
  {
    id: '3',
    imageUrl: 'https://images.urbndata.com/is/image/UrbanOutfitters/104376876_061_m?$xlarge$&fit=constrain&fmt=webp&qlt=80&wid=720',
    name: 'Beaded Chiffon Top',
    borrowed: false,
  },
  {
    id: '4',
    imageUrl: 'https://images.urbndata.com/is/image/UrbanOutfitters/104395595_061_m?$xlarge$&fit=constrain&fmt=webp&qlt=80&wid=720',
    name: 'Mesh Lace Up Corset',
    borrowed: false,
  },
  {
    id: '5',
    imageUrl: 'https://dam.dynamiteclothing.com/m/166f4bc9cad17f84/original/100100887_06V_1920x2880.jpg',
    name: 'Tube Corset',
    borrowed: false,
  },
  {
    id: '6',
    imageUrl: 'https://us.princesspolly.com/cdn/shop/products/1-modelinfo-mikayla-us8_1f9e6ee7-9e70-45c9-b2f7-85a4cafff5f4.jpg?v=1755630179&width=1800',
    name: 'Leather Jacket',
    borrowed: false,
  },
]

export function ClosetProvider({ children }) {
  const [myCloset, setMyCloset] = useState([])
  const [friendsCloset, setFriendsCloset] = useState(seedFriendsCloset())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCloset = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
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
    }

    loadCloset()
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

  const borrowItem = (id) => {
    setFriendsCloset(prev =>
      prev.map(item => item.id === id ? { ...item, borrowed: true } : item)
    )
  }

  const returnItem = (id) => {
    setFriendsCloset(prev =>
      prev.map(item => item.id === id ? { ...item, borrowed: false } : item)
    )
  }

  const value = {
    myCloset,
    friendsCloset,
    loading,
    addToMyCloset,
    borrowItem,
    returnItem,
    deleteFromMyCloset,
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