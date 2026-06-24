import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { colors, spacing, radii, typography } from '../../lib/theme'

/**
 * Reusable button. Variants:
 *   'primary'   — raspberry pop fill, white text  (CTAs: Add Item, Borrow, Save)
 *   'secondary' — white fill with beige border     (Cancel, secondary actions)
 *   'ghost'     — no background, muted text        (subtle links / back buttons)
 *
 * Props:
 *   children   — button label text
 *   onPress    — handler
 *   variant    — 'primary' | 'secondary' | 'ghost'  (default: 'primary')
 *   loading    — show ActivityIndicator instead of label
 *   disabled   — disables press and dims the button
 *   style      — additional style overrides for the outer container
 */
export function Button({
  children,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}) {
  const isDisabled = disabled || loading

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        styles[variant],
        isDisabled && styles.disabledContainer,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.surface : colors.muted}
          size="small"
        />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`]]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  // ── Variants ──────────────────────────────────────────────────────────────
  primary: {
    backgroundColor: colors.pop,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },

  // ── Disabled ──────────────────────────────────────────────────────────────
  disabledContainer: {
    opacity: 0.45,
  },

  // ── Labels ────────────────────────────────────────────────────────────────
  label: {
    fontSize: typography.buttonLabel.fontSize,
    fontWeight: typography.buttonLabel.fontWeight,
    letterSpacing: typography.buttonLabel.letterSpacing,
    lineHeight: typography.buttonLabel.lineHeight,
  },
  primaryLabel: {
    color: colors.surface,
  },
  secondaryLabel: {
    color: colors.text,
  },
  ghostLabel: {
    color: colors.muted,
  },
})
