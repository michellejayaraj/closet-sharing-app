import { View, Image, StyleSheet } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { Ionicons } from '@expo/vector-icons'
import { colors, radii, spacing } from '../../lib/theme'

const SLOT_COUNT = 4

const PLACEHOLDER_TILES = [
  { ionIcon: 'shirt-outline', background: colors.surface, iconColor: colors.muted },
  { icon: 'plus', background: colors.popPale, iconColor: colors.pop },
  { icon: 'shopping-bag', background: colors.surfaceSoft, iconColor: colors.muted },
  { icon: null, background: colors.surfaceSoft, iconColor: colors.muted },
]

function PlaceholderTile({ config, compact }) {
  const size = compact ? 18 : 22

  return (
    <View
      style={[
        styles.placeholder,
        { backgroundColor: config.background },
      ]}
    >
      {config.ionIcon ? (
        <Ionicons name={config.ionIcon} size={size} color={config.iconColor} />
      ) : config.icon ? (
        <Feather name={config.icon} size={size} color={config.iconColor} />
      ) : null}
    </View>
  )
}

/**
 * 2×2 mini collage for group preview tiles.
 * Real closet image URLs fill slots first; empty slots show themed icon placeholders.
 */
export function GroupCollage({ images = [], style, compact = false }) {
  const urls = images.filter(Boolean).slice(0, SLOT_COUNT)

  return (
    <View style={[styles.grid, style]}>
      {Array.from({ length: SLOT_COUNT }, (_, index) => {
        const imageUrl = urls[index] ?? null
        const placeholder = PLACEHOLDER_TILES[index]

        return (
          <View
            key={index}
            style={[
              styles.tile,
              compact ? styles.tileCompact : styles.tileDefault,
            ]}
          >
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
            ) : (
              <PlaceholderTile config={placeholder} compact={compact} />
            )}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.xs,
  },
  tile: {
    overflow: 'hidden',
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileDefault: {
    width: '49%',
    aspectRatio: 1,
    borderRadius: radii.sm,
  },
  tileCompact: {
    width: '49%',
    aspectRatio: 1,
    borderRadius: 6,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
