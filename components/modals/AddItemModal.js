import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'

export function AddItemModal({ isOpen, onClose, onAdd }) {
  const [imageUrl, setImageUrl] = useState('')
  const [name, setName] = useState('')
  const [isImageValid, setIsImageValid] = useState(false)
  const [shouldRender, setShouldRender] = useState(isOpen)

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
    } else {
      const timeout = setTimeout(() => setShouldRender(false), 200)
      return () => clearTimeout(timeout)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setImageUrl('')
      setName('')
      setIsImageValid(false)
    }
  }, [isOpen])

  if (!shouldRender) return null

  const isDisabled = !imageUrl.trim() || !name.trim()

  const handleAdd = () => {
    if (isDisabled) return
    onAdd({
      imageUrl: imageUrl.trim(),
      name: name.trim(),
      borrowed: false,
    })
    onClose()
  }

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.centered}
        >
          <Pressable style={styles.card} onPress={() => {}}>
            <Text style={styles.title}>Add New Item</Text>

            <TextInput
              placeholder="Paste image URL..."
              placeholderTextColor="#9ca3af"
              value={imageUrl}
              onChangeText={(text) => {
                setImageUrl(text)
                setIsImageValid(false)
              }}
              style={styles.input}
            />

            {imageUrl && isImageValid && (
              <View style={styles.previewWrap}>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              </View>
            )}

            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.hiddenImage}
                onLoad={() => setIsImageValid(true)}
                onError={() => setIsImageValid(false)}
              />
            ) : null}

            <TextInput
              placeholder="Item name..."
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
              style={[styles.input, styles.inputLast]}
            />

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={onClose}
                style={styles.cancelButton}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAdd}
                disabled={isDisabled}
                style={[
                  styles.addButton,
                  isDisabled && styles.addButtonDisabled,
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.addButtonText,
                    isDisabled && styles.addButtonTextDisabled,
                  ]}
                >
                  Add Item
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  centered: {
    width: '100%',
    maxWidth: 448,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#111827',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 16,
    color: '#111827',
  },
  inputLast: {
    marginBottom: 20,
  },
  previewWrap: {
    marginBottom: 16,
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  hiddenImage: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    pointerEvents: 'none',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  addButton: {
    borderRadius: 8,
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  addButtonTextDisabled: {
    color: '#6b7280',
  },
})
