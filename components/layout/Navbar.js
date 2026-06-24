import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'
import { colors, typography } from '../../lib/theme'

const TABS = [
  { name: 'My Closet', screen: 'MyCloset', icon: 'grid' },
  { name: 'Groups',    screen: 'Groups',   icon: 'users' },
  { name: 'Borrowed',  screen: 'Borrowed', icon: 'archive' },
  { name: 'Profile',   screen: 'Profile',  icon: 'user' },
]

export function Navbar() {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const state = navigation.getState()
  const currentRouteName = state?.routes?.[state.index]?.name ?? null

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map(({ name, screen, icon }) => {
        const isActive = currentRouteName === screen
        return (
          <Pressable
            key={screen}
            onPress={() => navigation.navigate(screen)}
            style={styles.tab}
            accessibilityLabel={name}
            accessibilityRole="tab"
          >
            <Feather
              name={icon}
              size={22}
              color={isActive ? colors.pop : colors.muted}
            />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {name}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.muted,
  },
  tabLabelActive: {
    color: colors.pop,
  },
})
