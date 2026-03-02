import { useEffect, useState } from 'react'
import {
  View,
  Text,
  Image,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
} from 'react-native'

export function ItemDetailModal({
  isOpen,
  onClose,
  item,
  onBorrow,
  onReturn,
  showBorrowButton = false,
  showReturnButton = false,
}) {
  const [shouldRender, setShouldRender] = useState(isOpen)

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
    } else {
      const timeout = setTimeout(() => setShouldRender(false), 200)
      return () => clearTimeout(timeout)
    }
  }, [isOpen])

  if (!shouldRender || !item) return null

  const handleBorrow = () => {
    if (onBorrow) {
      onBorrow(item.id)
      onClose()
    }
  }

  const handleReturn = () => {
    if (onReturn) {
      onReturn(item.id)
      onClose()
    }
  }

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.centered} onPress={() => {}}>
          <View style={styles.card}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>

            <View style={styles.imageWrap}>
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.image}
                resizeMode="contain"
                accessibilityLabel={item.name}
              />
            </View>

            <View style={styles.content}>
              <Text style={styles.title}>{item.name}</Text>

              {item.borrowed && (
                <View style={styles.badgeWrap}>
                  <Text style={styles.badge}>Borrowed</Text>
                </View>
              )}

              <View style={styles.actions}>
                {showBorrowButton && !item.borrowed && (
                  <TouchableOpacity
                    onPress={handleBorrow}
                    style={styles.primaryButton}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryButtonText}>Borrow</Text>
                  </TouchableOpacity>
                )}
                {showReturnButton && (
                  <TouchableOpacity
                    onPress={handleReturn}
                    style={styles.primaryButton}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryButtonText}>Return</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  centered: {
    width: '100%',
    maxWidth: 768,
    maxHeight: '90%',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4b5563',
    lineHeight: 28,
  },
  imageWrap: {
    backgroundColor: '#fafafa',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    maxHeight: 400,
  },
  image: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: '#111827',
  },
  badgeWrap: {
    marginBottom: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    borderRadius: 8,
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
})
