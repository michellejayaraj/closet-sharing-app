import { View, Image, StyleSheet, Text, Pressable, TouchableOpacity } from 'react-native'
import { Trash2 } from 'lucide-react-native'

export function ClosetItem({
  item,
  onClick,
  buttonLabel,
  onButtonClick,
  buttonDisabled = false,
  subtitle,
  onDelete,
}) {
  return (
    <Pressable
      onPress={onClick}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.image}
          accessibilityLabel={item.name}
        />
        {onDelete && (
          <TouchableOpacity
            onPress={() => onDelete(item.id)}
            style={styles.deleteButton}
            accessibilityLabel="Delete item"
            activeOpacity={0.7}
          >
            <Trash2 size={16} color="#374151" />
          </TouchableOpacity>
        )}
      </View>

      {/* Text Content */}
      <View style={styles.textContent}>
        <Text style={styles.name}>{item.name}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {/* Optional Button */}
      {buttonLabel && (
        <TouchableOpacity
          onPress={() => onButtonClick && onButtonClick(item.id)}
          disabled={buttonDisabled}
          style={[styles.actionButton, buttonDisabled && styles.actionButtonDisabled]}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.actionButtonText,
              buttonDisabled && styles.actionButtonTextDisabled,
            ]}
          >
            {buttonLabel}
          </Text>
        </TouchableOpacity>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
  },
  cardPressed: {
    opacity: 0.95,
  },
  imageContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
  },
  image: {
    width: '100%',
    height: 208,
    resizeMode: 'cover',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  textContent: {
    marginTop: 16,
    gap: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  actionButton: {
    marginTop: 16,
    width: '100%',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  actionButtonTextDisabled: {
    color: '#4b5563',
  },
})
