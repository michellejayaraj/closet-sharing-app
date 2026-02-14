import { useEffect, useState } from 'react'

const MY_CLOSET_KEY = 'myCloset'
const FRIENDS_CLOSET_KEY = 'friendsCloset'

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

const safeParseArray = (value) => {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Failed to parse data from localStorage', error)
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
    try {
      const storedMyCloset = safeParseArray(
        typeof window !== 'undefined'
          ? window.localStorage.getItem(MY_CLOSET_KEY)
          : null,
      )
      setMyCloset(storedMyCloset)
    } catch (error) {
      console.error('Failed to load myCloset from localStorage', error)
    }

    try {
      const rawFriends =
        typeof window !== 'undefined'
          ? window.localStorage.getItem(FRIENDS_CLOSET_KEY)
          : null
      const parsedFriends = safeParseArray(rawFriends)

      if (parsedFriends.length > 0) {
        setFriendsCloset(parsedFriends)
      } else {
        const seeded = seedFriendsCloset()
        setFriendsCloset(seeded)
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(
              FRIENDS_CLOSET_KEY,
              JSON.stringify(seeded),
            )
          }
        } catch (error) {
          console.error('Failed to seed friendsCloset in localStorage', error)
        }
      }
    } catch (error) {
      console.error('Failed to load friendsCloset from localStorage', error)
    }
  }, [])

  const persistMyCloset = (next) => {
    setMyCloset(next)
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(MY_CLOSET_KEY, JSON.stringify(next))
      }
    } catch (error) {
      console.error('Failed to save myCloset to localStorage', error)
    }
  }

  const persistFriendsCloset = (updater) => {
    setFriendsCloset((prev) => {
      const next =
        typeof updater === 'function' ? updater(prev) : Array.from(updater)

      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(
            FRIENDS_CLOSET_KEY,
            JSON.stringify(next),
          )
        }
      } catch (error) {
        console.error('Failed to save friendsCloset to localStorage', error)
      }

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
    const next = myCloset.filter((item) => item.id !== id);
    persistMyCloset(next);
  };

  return { myCloset, friendsCloset, addToMyCloset, borrowItem, returnItem, deleteFromMyCloset }
}