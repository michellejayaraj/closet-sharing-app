import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather';

const NAV_ITEMS = [
  { name: 'My Closet', screen: 'MyCloset' },  
  { name: 'Groups', screen: 'Groups' },
  { name: 'Borrowed', screen: 'Borrowed' },
]

export function Navbar() {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const state = navigation.getState()
  const currentRouteName = state?.routes?.[state.index]?.name ?? null

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.inner}>
        <View style={styles.sidePlaceholder} />
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

        <Pressable
          onPress={() => navigation.navigate('Profile')}
          style={styles.avatar}
        >
          <Feather name="user" size={20} color="black" />
        </Pressable>
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
    marginLeft: 16,
  },
  sidePlaceholder: {
    width: 36,
  },
})