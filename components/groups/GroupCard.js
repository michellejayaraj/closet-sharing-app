import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { GroupCollage } from './GroupCollage'
import { colors, spacing, radii, typography } from '../../lib/theme'

export function GroupCard({ group, onPress, onShare }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.92} style={styles.card}>
      <GroupCollage images={group.previewImages ?? []} style={styles.collage} />

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.name} numberOfLines={1}>
              {group.name}
            </Text>
            <Text style={styles.subtitle}>Shared closet</Text>
          </View>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.()
              onShare?.()
            }}
            style={styles.shareButton}
            activeOpacity={0.8}
          >
            <Text style={styles.shareButtonText}>Share Invite</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.code}>Code · {group.invite_code}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#171717',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  collage: {
    padding: spacing.sm,
    backgroundColor: colors.surfaceSoft,
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md + 2,
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.caption.fontSize,
    color: colors.muted,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  code: {
    fontSize: typography.body.fontSize,
    color: colors.muted,
    letterSpacing: 0.3,
  },
  shareButton: {
    borderRadius: radii.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  shareButtonText: {
    fontSize: typography.buttonLabelSm.fontSize,
    fontWeight: typography.buttonLabelSm.fontWeight,
    letterSpacing: typography.buttonLabelSm.letterSpacing,
    lineHeight: typography.buttonLabelSm.lineHeight,
    color: colors.text,
  },
})
