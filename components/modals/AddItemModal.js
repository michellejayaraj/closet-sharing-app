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
  ActivityIndicator,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { decode } from 'base64-arraybuffer'
import { supabase } from '../../lib/supabase'

export function AddItemModal({ isOpen, onClose, onAdd }) {
  const [imageUrl, setImageUrl] = useState('')
  const [name, setName] = useState('')
  const [uploading, setUploading] = useState(false)
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
    }
  }, [isOpen])

  if (!shouldRender) return null

  const pickImage = async (fromCamera) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      alert('Permission required to access photos.')
      return
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, base64: true })

    if (result.canceled) return

    const asset = result.assets[0]
    await uploadImage(asset)
  }

  const uploadImage = async (asset) => {
    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const uri = asset.uri
      const base64 = asset.base64

      if (!base64) {
        throw new Error('No base64 data returned from image picker')
      }

      const extFromUri = uri.split('.').pop()
      const ext = extFromUri && extFromUri.length <= 4 ? extFromUri.toLowerCase() : 'jpg'
      const normalizedExt = ext === 'jpg' ? 'jpeg' : ext
      const path = `${user.id}/${Date.now()}.${ext}`

      const fileData = decode(base64)

      const { error } = await supabase.storage
        .from('closet-images')
        .upload(path, fileData, { contentType: `image/${normalizedExt}` })

      if (error) throw error

      const { data } = supabase.storage
        .from('closet-images')
        .getPublicUrl(path)

      setImageUrl(data.publicUrl)
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Failed to upload image. Try again.')
    } finally {
      setUploading(false)
    }
  }

  const isDisabled = !imageUrl || !name.trim() || uploading

  const handleAdd = () => {
    if (isDisabled) return
    onAdd({ imageUrl, name: name.trim(), borrowed: false })
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

            {imageUrl ? (
              <View style={styles.previewWrap}>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setImageUrl('')}
                  style={styles.removeImage}
                >
                  <Text style={styles.removeImageText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imageButtons}>
                <TouchableOpacity
                  onPress={() => pickImage(false)}
                  style={styles.imageButton}
                  disabled={uploading}
                >
                  {uploading
                    ? <ActivityIndicator color="#111827" />
                    : <Text style={styles.imageButtonText}>Choose Photo</Text>
                  }
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => pickImage(true)}
                  style={styles.imageButton}
                  disabled={uploading}
                >
                  <Text style={styles.imageButtonText}>Take Photo</Text>
                </TouchableOpacity>
              </View>
            )}

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
                style={[styles.addButton, isDisabled && styles.addButtonDisabled]}
                activeOpacity={0.8}
              >
                <Text style={[styles.addButtonText, isDisabled && styles.addButtonTextDisabled]}>
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
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  imageButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageButtonText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  previewWrap: {
    marginBottom: 16,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  removeImage: {
    marginTop: 8,
  },
  removeImageText: {
    fontSize: 14,
    color: '#ef4444',
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