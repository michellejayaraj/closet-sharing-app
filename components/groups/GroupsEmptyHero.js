import { View, Text, StyleSheet } from 'react-native'
import { GroupCollage } from './GroupCollage'
import { Button } from '../ui/Button'
import { colors, spacing, radii, typography } from '../../lib/theme'

/**
 * Visual empty state for Groups — decorative placeholder collage + CTAs.
 * Collage tiles are placeholders only (no real closet data).
 */
export function GroupsEmptyHero({ onCreate, onJoin }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.heroCard}>
        <View style={styles.collageFrame}>
          <GroupCollage images={[]} compact />
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>Start a closet circle</Text>
          <Text style={styles.description}>
            Create a private closet with friends, roommates, or sisters.
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button onPress={onCreate} style={styles.actionButton}>
          New Group
        </Button>
        <Button variant="secondary" onPress={onJoin} style={styles.actionButton}>
          Join with Code
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  collageFrame: {
    padding: spacing.md,
    backgroundColor: colors.surfaceSoft,
  },
  copy: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg + 4,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.body.fontSize,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 280,
  },
  actions: {
    gap: spacing.sm,
  },
  actionButton: {
    paddingVertical: 14,
  },
})
