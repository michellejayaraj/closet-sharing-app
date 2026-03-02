import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'

const NAV_ITEMS = [
  { name: 'My Closet', screen: 'MyCloset' },
  { name: "Friend's Closet", screen: 'FriendsCloset' },
  { name: 'Borrowed', screen: 'Borrowed' },
]

export function Navbar() {
  const navigation = useNavigation()
  const state = navigation.getState()
  const currentRouteName = state?.routes?.[state.index]?.name ?? null

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
      </View>
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
})
