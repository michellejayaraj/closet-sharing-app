import { View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Navbar } from './Navbar'

export function Layout({ children }) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <Navbar />
      <View style={styles.main}>{children}</View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  main: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
})
