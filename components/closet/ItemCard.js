import { View, Text, Image, Pressable, StyleSheet, Platform } from 'react-native'
import { colors, spacing, radii, typography } from '../../lib/theme'

export function ItemCard({
  item,
  onPress,
  badge,
  showName = false,
  tileAspectRatio = 1,
  style,
}) {
  const label = item.name?.trim()

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed, style]}
    >
      <View style={[styles.imageContainer, { aspectRatio: tileAspectRatio }]}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.image}
            resizeMode="cover"
            accessibilityLabel={label || 'Closet item'}
          />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}
        {badge ?? null}
      </View>
      {showName && label ? (
        <View style={styles.labelContainer}>
          <Text style={styles.name} numberOfLines={2}>
            {label}
          </Text>
        </View>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#1F1F1F',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardPressed: {
    opacity: 0.92,
  },
  imageContainer: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
  },
  labelContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  name: {
    fontSize: typography.cardLabel.fontSize,
    fontWeight: typography.cardLabel.fontWeight,
    color: colors.text,
    lineHeight: 18,
  },
})
