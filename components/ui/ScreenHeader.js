import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, typography } from '../../lib/theme'

/**
 * Standardized screen title row.
 * Left: page title. Right: optional action slot (pass a Button or any node).
 *
 * Props:
 *   title  — string shown as the screen heading
 *   action — optional right-side element (e.g. <Button>Add Item</Button>)
 */
export function ScreenHeader({ title, action }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {action ?? null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.screenTitle.fontSize,
    fontWeight: typography.screenTitle.fontWeight,
    color: colors.text,
  },
})
