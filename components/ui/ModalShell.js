import { Modal, View, Text, Pressable, StyleSheet } from 'react-native'
import { colors, spacing, radii, typography } from '../../lib/theme'

/**
 * Reusable modal wrapper — semi-transparent overlay + white card + title.
 * Handles the boilerplate that was duplicated across Groups and GroupDetail.
 *
 * Props:
 *   visible   — controls Modal visibility
 *   onClose   — called when the overlay is tapped or hardware back is pressed
 *   title     — heading shown at the top of the card (optional)
 *   children  — content inside the card: inputs, error text, action buttons
 */
export function ModalShell({ visible, onClose, title, children }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* Inner Pressable swallows taps so they don't bubble to the overlay */}
        <Pressable style={styles.card} onPress={() => {}}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
})
