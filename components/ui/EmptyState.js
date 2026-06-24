import { View, Text, StyleSheet } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { Button } from './Button'
import { colors, spacing, radii, typography } from '../../lib/theme'

/**
 * Polished empty-state card for lists and grids.
 *
 * Props:
 *   title        — optional heading
 *   description  — body copy (falls back to `message` for legacy usage)
 *   message      — legacy single-line copy; used when description is omitted
 *   icon         — optional Feather icon name (e.g. 'archive', 'users')
 *   action       — optional single button: { label, onPress, variant? }
 *   actions      — optional button row: [{ label, onPress, variant? }, ...]
 */
export function EmptyState({
  title,
  description,
  message,
  icon,
  action,
  actions,
}) {
  const body = description ?? message

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        {icon ? (
          <View style={styles.iconWrap}>
            <Feather name={icon} size={22} color={colors.pop} />
          </View>
        ) : null}

        {title ? <Text style={styles.title}>{title}</Text> : null}

        {body ? (
          <Text
            style={[
              styles.description,
              (action || actions?.length) && styles.descriptionWithAction,
            ]}
          >
            {body}
          </Text>
        ) : null}

        {action ? (
          <Button
            variant={action.variant ?? 'primary'}
            onPress={action.onPress}
            style={styles.singleAction}
          >
            {action.label}
          </Button>
        ) : null}

        {actions?.length ? (
          <View style={styles.actionsRow}>
            {actions.map(({ label, onPress, variant = 'primary' }) => (
              <Button
                key={label}
                variant={variant}
                onPress={onPress}
                style={styles.rowAction}
              >
                {label}
              </Button>
            ))}
          </View>
        ) : null}
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.popPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sectionHeading.fontSize,
    fontWeight: typography.sectionHeading.fontWeight,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 21,
  },
  descriptionWithAction: {
    marginBottom: spacing.lg,
  },
  singleAction: {
    alignSelf: 'stretch',
    paddingVertical: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  rowAction: {
    flex: 1,
    paddingVertical: 12,
  },
})
