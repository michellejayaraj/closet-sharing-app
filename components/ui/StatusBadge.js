import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, radii, typography } from '../../lib/theme'

/**
 * Small pill badge for item availability status.
 * Rendered by the parent — position it absolutely over item images as needed.
 *
 * Props:
 *   label  — text to display, e.g. 'Borrowed' or 'Unavailable'
 *   style  — optional style overrides (e.g. position: 'absolute', top, left)
 */
export function StatusBadge({ label, style }) {
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm - 2,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
    color: colors.surface,
  },
})
