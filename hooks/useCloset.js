import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const MY_CLOSET_KEY = 'myCloset'
const FRIENDS_CLOSET_KEY = 'friendsCloset'

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

const safeParseArray = (value) => {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Failed to parse data from AsyncStorage', error)
    return []
  }
}

const seedFriendsCloset = () => {
  const items = [
    {
      imageUrl:
        'https://images.urbndata.com/is/image/UrbanOutfitters/101507341_066_b2?$xlarge$&fit=constrain&fmt=webp&qlt=80&wid=720',
      name: 'Off The Shoulder Top',
    },
    {
      imageUrl:
        'https://images.urbndata.com/is/image/UrbanOutfitters/105009674_001_b?$xlarge$&fit=constrain&fmt=webp&qlt=80&wid=720',
      name: 'Lace Boatneck Tee',
    },
    {
      imageUrl:
        'https://images.urbndata.com/is/image/UrbanOutfitters/104376876_061_m?$xlarge$&fit=constrain&fmt=webp&qlt=80&wid=720',
      name: 'Beaded Chiffon Top',
    },
    {
      imageUrl:
        'https://images.urbndata.com/is/image/UrbanOutfitters/104395595_061_m?$xlarge$&fit=constrain&fmt=webp&qlt=80&wid=720',
      name: 'Mesh Lace Up Corset',
    },
    {
      imageUrl:
        'https://dam.dynamiteclothing.com/m/166f4bc9cad17f84/original/100100887_06V_1920x2880.jpg',
      name: 'Tube Corset',
    },
    {
      imageUrl:
        'https://us.princesspolly.com/cdn/shop/products/1-modelinfo-mikayla-us8_1f9e6ee7-9e70-45c9-b2f7-85a4cafff5f4.jpg?v=1755630179&width=1800',
      name: 'Leather Jacket',
    },
  ]

  return items.map((item) => ({
    id: createId(),
    imageUrl: item.imageUrl,
    name: item.name,
    borrowed: false,
  }))
}

export function useCloset() {
  const [myCloset, setMyCloset] = useState([])
  const [friendsCloset, setFriendsCloset] = useState([])

  // Initial load + seeding
  useEffect(() => {
    const load = async () => {
      try {
        const storedMyCloset = safeParseArray(
          await AsyncStorage.getItem(MY_CLOSET_KEY),
        )
        setMyCloset(storedMyCloset)
      } catch (error) {
        console.error('Failed to load myCloset from AsyncStorage', error)
      }

      try {
        const rawFriends = await AsyncStorage.getItem(FRIENDS_CLOSET_KEY)
        const parsedFriends = safeParseArray(rawFriends)

        if (parsedFriends.length > 0) {
          setFriendsCloset(parsedFriends)
        } else {
          const seeded = seedFriendsCloset()
          setFriendsCloset(seeded)
          try {
            await AsyncStorage.setItem(
              FRIENDS_CLOSET_KEY,
              JSON.stringify(seeded),
            )
          } catch (error) {
            console.error('Failed to seed friendsCloset in AsyncStorage', error)
          }
        }
      } catch (error) {
        console.error('Failed to load friendsCloset from AsyncStorage', error)
      }
    }

    load()
  }, [])

  const persistMyCloset = (next) => {
    setMyCloset(next)
    AsyncStorage.setItem(MY_CLOSET_KEY, JSON.stringify(next)).catch((error) => {
      console.error('Failed to save myCloset to AsyncStorage', error)
    })
  }

  const persistFriendsCloset = (updater) => {
    setFriendsCloset((prev) => {
      const next =
        typeof updater === 'function' ? updater(prev) : Array.from(updater)

      AsyncStorage.setItem(
        FRIENDS_CLOSET_KEY,
        JSON.stringify(next),
      ).catch((error) => {
        console.error('Failed to save friendsCloset to AsyncStorage', error)
      })

      return next
    })
  }

  const addToMyCloset = (item) => {
    const newItem = {
      id: createId(),
      ...item,
    }
    const next = [...myCloset, newItem]
    persistMyCloset(next)
  }

  const borrowItem = (id) => {
    persistFriendsCloset((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, borrowed: true } : item,
      ),
    )
  }

  const returnItem = (id) => {
    persistFriendsCloset((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, borrowed: false } : item,
      ),
    )
  }

  const deleteFromMyCloset = (id) => {
    const next = myCloset.filter((item) => item.id !== id)
    persistMyCloset(next)
  }

  return {
    myCloset,
    friendsCloset,
    addToMyCloset,
    borrowItem,
    returnItem,
    deleteFromMyCloset,
  }
}
