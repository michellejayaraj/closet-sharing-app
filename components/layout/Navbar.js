import { useState } from 'react'
import { View, Text, StyleSheet, Pressable, Modal, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { supabase } from '../../lib/supabase'
import Feather from '@expo/vector-icons/Feather';

const NAV_ITEMS = [
  { name: 'My Closet', screen: 'MyCloset' },
  { name: "Friend's Closet", screen: 'FriendsCloset' },
  { name: 'Borrowed', screen: 'Borrowed' },
]

export function Navbar() {
  const navigation = useNavigation()
  const state = navigation.getState()
  const currentRouteName = state?.routes?.[state.index]?.name ?? null
  const [profileOpen, setProfileOpen] = useState(false)
  const [user, setUser] = useState(null)

  const openProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    setProfileOpen(true)
  }

  return (
    <View style={styles.header}>
      <View style={styles.inner}>
        <View style={styles.nav}>
          {NAV_ITEMS.map(({ name, screen }) => {
            const isActive = currentRouteName === screen
            return (
              <Pressable
                key={screen}
                onPress={() => navigation.navigate(screen)}
                style={[styles.link, isActive && styles.linkActive]}
              >
                <Text
                  style={[
                    styles.linkText,
                    isActive ? styles.linkTextActive : styles.linkTextInactive,
                  ]}
                >
                  {name}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <Pressable onPress={openProfile} style={styles.avatar}>
          <Feather name="user" size={20} color="black" />
        </Pressable>
      </View>

      <Modal
        visible={profileOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setProfileOpen(false)}>
          <View style={styles.menu}>
            <Text style={styles.email}>{user?.email}</Text>
            <View style={styles.divider} />
            <TouchableOpacity
              onPress={() => {
                setProfileOpen(false)
                supabase.auth.signOut()
              }}
              style={styles.signOutButton}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
    backgroundColor: 'rgba(250, 250, 250, 0.95)',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  link: {
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  linkActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  linkTextActive: {
    color: '#18181b',
  },
  linkTextInactive: {
    color: '#52525b',
  },
  avatar: {
    position: 'absolute',
    right: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 16,
  },
  menu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  email: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#e4e4e7',
    marginBottom: 12,
  },
  signOutButton: {
    paddingVertical: 4,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ef4444',
  },
})